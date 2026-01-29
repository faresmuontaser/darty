"""
Web Scraper Module
Scrapes Dart and Flutter official documentation plus educational resources
"""

import requests
from bs4 import BeautifulSoup
from typing import Optional, Dict, List
from cache_manager import CacheManager


class DocScraper:
    """Scrapes Dart and Flutter documentation and educational resources"""
    
    # Official documentation URLs
    DART_ARCHIVE_URL = "https://dart.dev/get-dart/archive"
    FLUTTER_RELEASES_URL = "https://docs.flutter.dev/release/release-notes"
    
    # Educational resources for comprehensive context
    EDUCATIONAL_URLS = [
        "https://www.educative.io/courses/learn-dart-first-step-to-flutter/an-introduction-to-control-structures",
        "https://pub.dev/",
        "https://dart.dev/tutorials",
        "https://dart.dev/language",
        "https://code.makery.ch/library/topic/dart/",
        "https://dart.dev/docs",
        "https://dart.dev/guides",
        "https://dart.dev/guides/language/language-tour",
        "https://docs.flutter.dev/get-started/install",
        "https://docs.flutter.dev/development/ui/widgets-intro",
        "https://docs.flutter.dev/cookbook",
    ]
    
    def __init__(self, cache_manager: Optional[CacheManager] = None):
        """
        Initialize the documentation scraper
        
        Args:
            cache_manager: Optional cache manager instance
        """
        self.cache_manager = cache_manager or CacheManager()
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def _fetch_url(self, url: str, use_cache: bool = True) -> Optional[str]:
        """
        Fetch content from URL with caching support
        
        Args:
            url: URL to fetch
            use_cache: Whether to use cache
            
        Returns:
            HTML content or None if failed
        """
        # Try cache first if enabled
        if use_cache:
            cached_content = self.cache_manager.get(url)
            if cached_content:
                print(f"✓ Loaded from cache: {url}")
                return cached_content
        
        # Fetch from web
        try:
            print(f"⬇ Fetching: {url}")
            response = self.session.get(url, timeout=15)
            response.raise_for_status()
            content = response.text
            
            # Cache the content
            if use_cache:
                self.cache_manager.set(url, content)
            
            return content
        
        except requests.RequestException as e:
            print(f"✗ Error fetching {url}: {e}")
            return None
    
    def _extract_text_from_html(self, html: str, max_chars: int = 5000) -> str:
        """
        Extract clean text from HTML
        
        Args:
            html: HTML content
            max_chars: Maximum characters to extract
            
        Returns:
            Cleaned text
        """
        try:
            soup = BeautifulSoup(html, 'lxml')
            
            # Remove script, style, nav, footer tags
            for tag in soup(["script", "style", "nav", "footer", "header"]):
                tag.decompose()
            
            # Get text
            text = soup.get_text(strip=True, separator=' ')
            
            # Clean up whitespace
            text = ' '.join(text.split())
            
            return text[:max_chars]
        
        except Exception as e:
            print(f"Error extracting text: {e}")
            return ""
    
    def scrape_dart_archive(self) -> Optional[Dict[str, str]]:
        """
        Scrape Dart SDK archive page for latest versions
        
        Returns:
            Dictionary with version information
        """
        html = self._fetch_url(self.DART_ARCHIVE_URL)
        if not html:
            return None
        
        try:
            soup = BeautifulSoup(html, 'lxml')
            
            result = {
                'url': self.DART_ARCHIVE_URL,
                'title': soup.title.string if soup.title else 'Dart SDK Archive',
                'content': self._extract_text_from_html(html, 3000)
            }
            
            return result
        
        except Exception as e:
            print(f"Error parsing Dart archive: {e}")
            return None
    
    def scrape_flutter_releases(self) -> Optional[Dict[str, str]]:
        """
        Scrape Flutter release notes page
        
        Returns:
            Dictionary with release information
        """
        html = self._fetch_url(self.FLUTTER_RELEASES_URL)
        if not html:
            return None
        
        try:
            soup = BeautifulSoup(html, 'lxml')
            
            result = {
                'url': self.FLUTTER_RELEASES_URL,
                'title': soup.title.string if soup.title else 'Flutter Release Notes',
                'content': self._extract_text_from_html(html, 3000)
            }
            
            return result
        
        except Exception as e:
            print(f"Error parsing Flutter releases: {e}")
            return None
    
    def scrape_educational_resources(self) -> List[Dict[str, str]]:
        """
        Scrape all educational resource URLs
        
        Returns:
            List of dictionaries with scraped content
        """
        results = []
        
        print(f"\n📚 Scraping {len(self.EDUCATIONAL_URLS)} educational resources...")
        
        for i, url in enumerate(self.EDUCATIONAL_URLS, 1):
            print(f"\n[{i}/{len(self.EDUCATIONAL_URLS)}] Processing: {url}")
            
            html = self._fetch_url(url)
            if not html:
                continue
            
            try:
                soup = BeautifulSoup(html, 'lxml')
                
                result = {
                    'url': url,
                    'title': soup.title.string if soup.title else url,
                    'content': self._extract_text_from_html(html, 2000)
                }
                
                results.append(result)
                print(f"✓ Successfully scraped: {result['title'][:50]}...")
            
            except Exception as e:
                print(f"✗ Error parsing {url}: {e}")
        
        print(f"\n✓ Successfully scraped {len(results)} resources\n")
        return results
    
    def get_all_documentation(self) -> Dict[str, any]:
        """
        Scrape all documentation sources
        
        Returns:
            Dictionary with all scraped documentation
        """
        print("\n" + "="*60)
        print("📚 Starting Comprehensive Documentation Scraping...")
        print("="*60 + "\n")
        
        documentation = {
            'dart_archive': self.scrape_dart_archive(),
            'flutter_releases': self.scrape_flutter_releases(),
            'educational_resources': self.scrape_educational_resources()
        }
        
        print("\n" + "="*60)
        print("✓ Documentation scraping complete!")
        print("="*60 + "\n")
        
        return documentation
    
    def build_context_summary(self, documentation: Dict[str, any]) -> str:
        """
        Build a comprehensive context summary from scraped documentation
        
        Args:
            documentation: Dictionary with scraped documentation
            
        Returns:
            Formatted context string for AI training
        """
        context_parts = []
        
        context_parts.append("# معلومات من المصادر الرسمية والتعليمية\n")
        
        # Dart Archive
        if documentation.get('dart_archive'):
            context_parts.append(f"""
## أرشيف Dart SDK
المصدر: {documentation['dart_archive']['url']}
المحتوى: {documentation['dart_archive']['content'][:800]}
""")
        
        # Flutter Releases
        if documentation.get('flutter_releases'):
            context_parts.append(f"""
## ملاحظات إصدارات Flutter
المصدر: {documentation['flutter_releases']['url']}
المحتوى: {documentation['flutter_releases']['content'][:800]}
""")
        
        # Educational Resources
        if documentation.get('educational_resources'):
            context_parts.append("\n## الموارد التعليمية\n")
            
            for i, resource in enumerate(documentation['educational_resources'][:8], 1):
                context_parts.append(f"""
### مصدر {i}: {resource['title'][:60]}
URL: {resource['url']}
محتوى: {resource['content'][:600]}
""")
        
        full_context = "\n".join(context_parts)
        
        # Print summary
        print(f"\n📊 Context Summary:")
        print(f"   - Total length: {len(full_context)} characters")
        print(f"   - Resources included: {len(documentation.get('educational_resources', []))}+2")
        print("")
        
        return full_context
