import os
import subprocess
import webbrowser
import time
import sys

def run():
    print("Starting Dart & Flutter Expert...")
    base_dir = os.path.dirname(os.path.abspath(__file__))
    backend_script = os.path.join(base_dir, "backend", "main.py")
    
    # Start backend
    try:
        subprocess.Popen([sys.executable, backend_script])
        print("Backend started in background.")
        
        print("Waiting 3 seconds...")
        time.sleep(3)
        
        # Open browser
        webbrowser.open("http://localhost:5000")
        print("Browser opened.")
    except Exception as e:
        print(f"Error: {e}")
        input("Press Enter to close...")

if __name__ == "__main__":
    run()
