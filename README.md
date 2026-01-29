# Darty 🌑☀️💎🎯❤️

A high-fidelity, Google Gemini-inspired AI tutor for Dart & Flutter development. Darty is designed to take absolute beginners and guide them into becoming mobile app developers through simple Arabic explanations, real-world analogies, and hands-on exercises.

## ✨ Features

- **Google Gemini 3 Flash Power**: Latest AI model for fast, accurate generation.
- **Material Rounded UI**: A stunning, modern interface with smooth animations and dark/light modes.
- **Bilingual Support**: Fully optimized for Arabic (RTL) and English (LTR).
- **Documentation Aware**: Darty stays up-to-date by scraping official Flutter/Dart docs.
- **Chat History**: Persists your conversations locally so you never lose a lesson.
- **Smart Resizing**: A flexible sidebar that adjusts to your workflow.

## 🚀 Getting Started

1. **Setup API Key**: Create a `.env` file in the root directory and add your key:
   ```env
   GOOGLE_API_KEY=YOUR_AIZA_KEY_HERE
   ```
2. **Install Dependencies**:
   ```bash
   pip install flask flask-cors requests beautifulsoup4 google-genai python-dotenv
   ```
3. **Run the App**:
   ```bash
   python backend/main.py
   ```
   *Darty will automatically open in your browser at `http://localhost:5000`.*

## �️ Project Architecture

Darty is built with a decoupled architecture for maximum stability:
- **Frontend**: Vanilla HTML/JS with high-fidelity CSS and Material Symbols.
- **Backend**: Flask-based API managing session context and AI orchestration.
- **AI Core**: Google Gemini 3 Flash integrated via `google-genai` SDK.
- **Cache**: Fast local scraping cache for documentation context.

---
*Built with passion for developers by developers.* 🌑☀️💎🎯❤️
