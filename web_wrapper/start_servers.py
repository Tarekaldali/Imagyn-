#!/usr/bin/env python3
"""
ComfyUI Studio Server Manager
Manages both ComfyUI and Flask servers with automatic restart capabilities
"""

import subprocess
import sys
import time
import requests
import signal
import os
from pathlib import Path

class ServerManager:
    def __init__(self):
        self.comfyui_process = None
        self.flask_process = None
        self.comfyui_dir = Path(__file__).parent.parent
        self.flask_dir = Path(__file__).parent
        self.running = True
        
    def start_comfyui(self):
        """Start ComfyUI server with retry logic"""
        print("🚀 Starting ComfyUI server...")
        
        # Kill any existing processes on port 8188
        try:
            subprocess.run(['netstat', '-ano', '|', 'findstr', ':8188'], shell=True, capture_output=True)
        except:
            pass
            
        cmd = [
            sys.executable, "main.py",
            "--disable-api-nodes",
            "--listen", "127.0.0.1", 
            "--port", "8188"
        ]
        
        try:
            self.comfyui_process = subprocess.Popen(
                cmd,
                cwd=self.comfyui_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0
            )
            
            # Wait for server to be ready
            print("⏳ Waiting for ComfyUI to start...")
            for i in range(90):  # 90 seconds timeout
                try:
                    if self.comfyui_process.poll() is not None:
                        # Process died
                        stdout, _ = self.comfyui_process.communicate()
                        print(f"❌ ComfyUI process exited early. Output:\n{stdout}")
                        return False
                        
                    response = requests.get("http://localhost:8188/queue", timeout=2)
                    if response.status_code == 200:
                        print("✅ ComfyUI server started successfully!")
                        return True
                except requests.RequestException:
                    pass
                
                time.sleep(1)
                if i % 10 == 0 and i > 0:
                    print(f"⏳ Still waiting... ({i}s)")
            
            print("❌ ComfyUI server failed to start within timeout")
            return False
            
        except Exception as e:
            print(f"❌ Failed to start ComfyUI: {e}")
            return False
    
    def start_flask(self):
        """Start Flask server"""
        print("🚀 Starting Flask API Bridge...")
        
        cmd = [sys.executable, "flask_server.py"]
        
        try:
            self.flask_process = subprocess.Popen(
                cmd,
                cwd=self.flask_dir,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0
            )
            
            # Wait for Flask to start
            print("⏳ Waiting for Flask to start...")
            for i in range(30):
                try:
                    response = requests.get("http://localhost:8890/", timeout=2)
                    if response.status_code == 200:
                        print("✅ Flask API Bridge started successfully!")
                        return True
                except requests.RequestException:
                    pass
                
                if self.flask_process.poll() is not None:
                    print("❌ Flask process exited early")
                    return False
                    
                time.sleep(1)
            
            print("❌ Flask server failed to start within timeout")
            return False
            
        except Exception as e:
            print(f"❌ Failed to start Flask: {e}")
            return False
    
    def monitor_servers(self):
        """Monitor and restart servers if they crash"""
        print("👀 Monitoring servers...")
        
        while self.running:
            try:
                # Check ComfyUI
                if self.comfyui_process and self.comfyui_process.poll() is not None:
                    print("🔄 ComfyUI process died, restarting...")
                    self.start_comfyui()
                
                # Check Flask
                if self.flask_process and self.flask_process.poll() is not None:
                    print("🔄 Flask process died, restarting...")
                    self.start_flask()
                
                # Health check
                try:
                    requests.get("http://localhost:8188/queue", timeout=3)
                    requests.get("http://localhost:8890/", timeout=3)
                except requests.RequestException:
                    print("⚠️ Server health check failed")
                
                time.sleep(10)  # Check every 10 seconds
                
            except KeyboardInterrupt:
                break
    
    def stop_servers(self):
        """Stop all servers"""
        print("🛑 Stopping servers...")
        self.running = False
        
        if self.flask_process:
            try:
                if os.name == 'nt':
                    self.flask_process.send_signal(signal.CTRL_BREAK_EVENT)
                else:
                    self.flask_process.terminate()
                self.flask_process.wait(timeout=5)
            except:
                if self.flask_process.poll() is None:
                    self.flask_process.kill()
        
        if self.comfyui_process:
            try:
                if os.name == 'nt':
                    self.comfyui_process.send_signal(signal.CTRL_BREAK_EVENT)
                else:
                    self.comfyui_process.terminate()
                self.comfyui_process.wait(timeout=10)
            except:
                if self.comfyui_process.poll() is None:
                    self.comfyui_process.kill()
        
        print("✅ All servers stopped")
    
    def run(self):
        """Main execution"""
        print("🎨 ComfyUI Studio Server Manager")
        print("=" * 50)
        
        # Setup signal handlers
        signal.signal(signal.SIGINT, lambda s, f: self.stop_servers())
        if hasattr(signal, 'SIGTERM'):
            signal.signal(signal.SIGTERM, lambda s, f: self.stop_servers())
        
        try:
            # Start ComfyUI first
            if not self.start_comfyui():
                print("❌ Failed to start ComfyUI. Exiting.")
                return False
            
            # Start Flask
            if not self.start_flask():
                print("❌ Failed to start Flask. Exiting.")
                self.stop_servers()
                return False
            
            print("\n🎉 ComfyUI Studio is ready!")
            print("📱 Frontend: http://localhost:8890")
            print("🔧 ComfyUI: http://localhost:8188")
            print("Press Ctrl+C to stop servers")
            print("=" * 50)
            
            # Monitor servers
            self.monitor_servers()
            
        except KeyboardInterrupt:
            pass
        finally:
            self.stop_servers()
        
        return True

if __name__ == "__main__":
    manager = ServerManager()
    success = manager.run()
    sys.exit(0 if success else 1)