"""
Main Flask Application
Serves the frontend and provides API endpoints for the Dart & Flutter Expert Tutor
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import sys
import webbrowser
from threading import Timer
from pathlib import Path

# Add backend directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config_manager import ConfigManager
from cache_manager import CacheManager
from scraper import DocScraper
from ai_tutor import DartFlutterTutor

# Initialize Flask app
app = Flask(__name__, 
            static_folder='../frontend',
            static_url_path='')
CORS(app)

# Initialize managers
config_manager = ConfigManager()
cache_manager = CacheManager()
doc_scraper = DocScraper(cache_manager)

# Global tutor instance (will be initialized after API key is set)
tutor = None
documentation_context = None


@app.route('/')
def index():
    """Serve the main HTML page"""
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/api/config/save-api-key', methods=['POST'])
def save_api_key():
    """
    Save the OpenAI API key
    
    Expected JSON: {"api_key": "AIza..."}
    """
    try:
        data = request.get_json()
        api_key = data.get('api_key', '').strip()
        
        if not api_key:
            return jsonify({
                'success': False,
                'message': 'مفتاح API مطلوب'
            }), 400
        
        # Validate API key format
        if not config_manager.validate_api_key(api_key):
            return jsonify({
                'success': False,
                'message': 'صيغة مفتاح Google API غير صحيحة. يجب أن يبدأ بـ AIza'
            }), 400
        
        # Save API key
        if config_manager.save_api_key(api_key):
            return jsonify({
                'success': True,
                'message': 'تم حفظ مفتاح API بنجاح'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'فشل حفظ مفتاح API'
            }), 500
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'خطأ: {str(e)}'
        }), 500


@app.route('/api/scrape/documentation', methods=['POST'])
def scrape_documentation():
    """
    Scrape Dart and Flutter documentation
    """
    global documentation_context, tutor
    
    try:
        print("\n" + "="*50)
        print("Starting documentation scraping...")
        print("="*50)
        
        # Scrape all documentation
        documentation = doc_scraper.get_all_documentation()
        
        # Build context summary
        documentation_context = doc_scraper.build_context_summary(documentation)
        
        # Update tutor context if tutor is initialized
        if tutor:
            tutor.update_context(documentation_context)
        
        # Get cache stats
        cache_stats = cache_manager.get_cache_stats()
        
        return jsonify({
            'success': True,
            'message': 'تم جلب الوثائق بنجاح',
            'cache_stats': cache_stats,
            'context_length': len(documentation_context)
        })
    
    except Exception as e:
        print(f"Error during scraping: {e}")
        return jsonify({
            'success': False,
            'message': f'خطأ في جلب الوثائق: {str(e)}'
        }), 500


@app.route('/api/tutor/initialize', methods=['POST'])
def initialize_tutor():
    """
    Initialize the AI tutor with the saved API key
    Also triggers documentation scraping
    """
    global tutor, documentation_context
    
    try:
        # Get API key
        api_key = config_manager.get_api_key()
        
        if not api_key:
            return jsonify({
                'success': False,
                'message': 'لم يتم العثور على مفتاح API. يرجى حفظه أولاً'
            }), 400
        
        # Scrape documentation if not already done
        if not documentation_context:
            print("Scraping documentation for context...")
            documentation = doc_scraper.get_all_documentation()
            documentation_context = doc_scraper.build_context_summary(documentation)
        
        # Initialize tutor
        tutor = DartFlutterTutor(api_key, documentation_context)
        
        return jsonify({
            'success': True,
            'message': 'تم تهيئة Darty بنجاح! يمكنك الآن طرح الأسئلة',
            'context_loaded': len(documentation_context) > 0
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'خطأ في تهيئة الخبير: {str(e)}'
        }), 500


@app.route('/api/tutor/ask', methods=['POST'])
def ask_tutor():
    """
    Ask the tutor a question
    
    Expected JSON: {"question": "..."}
    """
    global tutor
    
    try:
        if not tutor:
            return jsonify({
                'success': False,
                'message': 'جاري تحضير Darty.. من فضلك انتظر ثواني وجرب تاني'
            }), 400
        
        data = request.get_json()
        question = data.get('question', '').strip()
        
        if not question:
            return jsonify({
                'success': False,
                'message': 'السؤال مطلوب'
            }), 400
        
        # Get answer from tutor
        answer = tutor.ask(question)
        
        if answer:
            return jsonify({
                'success': True,
                'answer': answer
            })
        else:
            return jsonify({
                'success': False,
                'message': 'فشل الحصول على إجابة'
            }), 500
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'خطأ: {str(e)}'
        }), 500


@app.route('/api/tutor/analyze-code', methods=['POST'])
def analyze_code():
    """
    Analyze Dart/Flutter code
    
    Expected JSON: {"code": "..."}
    """
    global tutor
    
    try:
        if not tutor:
            return jsonify({
                'success': False,
                'message': 'لم يتم تهيئة الخبير'
            }), 400
        
        data = request.get_json()
        code = data.get('code', '').strip()
        
        if not code:
            return jsonify({
                'success': False,
                'message': 'الكود مطلوب'
            }), 400
        
        # Analyze code
        analysis = tutor.analyze_code(code)
        
        if analysis:
            return jsonify({
                'success': True,
                'analysis': analysis
            })
        else:
            return jsonify({
                'success': False,
                'message': 'فشل تحليل الكود'
            }), 500
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'خطأ: {str(e)}'
        }), 500


@app.route('/api/tutor/generate-exercises', methods=['POST'])
def generate_exercises():
    """
    Generate practice exercises
    
    Expected JSON: {"topic": "..."}
    """
    global tutor
    
    try:
        if not tutor:
            return jsonify({
                'success': False,
                'message': 'لم يتم تهيئة الخبير'
            }), 400
        
        data = request.get_json()
        topic = data.get('topic', '').strip()
        
        if not topic:
            return jsonify({
                'success': False,
                'message': 'الموضوع مطلوب'
            }), 400
        
        # Generate exercises
        exercises = tutor.generate_exercises(topic)
        
        if exercises:
            return jsonify({
                'success': True,
                'exercises': exercises
            })
        else:
            return jsonify({
                'success': False,
                'message': 'فشل إنشاء التمارين'
            }), 500
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'خطأ: {str(e)}'
        }), 500


@app.route('/api/tutor/explain-concept', methods=['POST'])
def explain_concept():
    """
    Explain a Dart/Flutter concept
    
    Expected JSON: {"concept": "..."}
    """
    global tutor
    
    try:
        if not tutor:
            return jsonify({
                'success': False,
                'message': 'لم يتم تهيئة الخبير'
            }), 400
        
        data = request.get_json()
        concept = data.get('concept', '').strip()
        
        if not concept:
            return jsonify({
                'success': False,
                'message': 'المفهوم مطلوب'
            }), 400
        
        # Explain concept
        explanation = tutor.explain_concept(concept)
        
        if explanation:
            return jsonify({
                'success': True,
                'explanation': explanation
            })
        else:
            return jsonify({
                'success': False,
                'message': 'فشل شرح المفهوم'
            }), 500
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'خطأ: {str(e)}'
        }), 500


@app.route('/api/status', methods=['GET'])
def get_status():
    """Get the current status of the application"""
    api_key_configured = config_manager.is_configured()
    tutor_initialized = tutor is not None
    context_loaded = documentation_context is not None
    
    cache_stats = cache_manager.get_cache_stats()
    
    return jsonify({
        'api_key_configured': api_key_configured,
        'tutor_initialized': tutor_initialized,
        'context_loaded': context_loaded,
        'cache_stats': cache_stats
    })


@app.route('/api/cache/clear', methods=['POST'])
def clear_cache():
    """Clear all cached documentation"""
    try:
        cache_manager.clear_all()
        return jsonify({
            'success': True,
            'message': 'تم مسح الذاكرة المؤقتة بنجاح'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'خطأ: {str(e)}'
        }), 500


def open_browser():
    """Opens the browser to the application URL after a short delay"""
    webbrowser.open("http://localhost:5000")

if __name__ == '__main__':
    print("\n" + "="*60)
    print(f"🚀 Darty Server: http://localhost:5000")
    print(f"🤖 AI Model: Google Gemini 3 Flash")
    print(f"⚙️  API Key Configured: {config_manager.is_configured()}")
    print("="*60 + "\n")

    # Global variables for auto-init
    if config_manager.is_configured():
        try:
            print("Auto-initializing Darty...")
            api_key = config_manager.get_api_key()
            # We initialize without full context first to be fast, 
            # documentation will be loaded on first use or via sync
            tutor = DartFlutterTutor(api_key, "")
            print("✓ Darty is ready!")
        except Exception as e:
            print(f"✗ Auto-initialization failed: {e}")
    
    # Open browser automatically after 1.5 seconds
    Timer(1.5, open_browser).start()
    
    app.run(debug=False, host='0.0.0.0', port=5000)
