#!/usr/bin/env python
"""
Unified Development Server Runner for Sports Management PWA.
Launches both Django REST Framework backend and React Vite frontend concurrently.
"""

import os
import sys
import subprocess
import signal
import time
from pathlib import Path

# Paths
ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"

def find_node():
    """Locate node and npm on system, including local fallback if not on global PATH."""
    local_node_dir = Path(os.environ.get("LOCALAPPDATA", "")) / "Programs" / "node-v20.18.0-win-x64"
    if local_node_dir.exists() and str(local_node_dir) not in os.environ.get("PATH", ""):
        os.environ["PATH"] = f"{local_node_dir};{os.environ.get('PATH', '')}"

def print_banner():
    banner = """
======================================================================
         🏆 SPORTS MANAGEMENT SYSTEM - LOCAL SERVERS 🏆
======================================================================
  Frontend PWA:       http://localhost:5173/
  Public Tryouts:     http://localhost:5173/public-trials
  Backend API:        http://127.0.0.1:8000/api/v1/
  Swagger API Docs:   http://127.0.0.1:8000/api/docs/

  Demo Credentials:
    • Admin:               admin    / admin123
    • Sports Coordinator:  sports1  / sports123
    • Branch Coordinator:  branch1  / branch123
    • Student Coordinator: student1 / student123

  Press [Ctrl + C] anytime to stop all servers.
======================================================================
"""
    print(banner)

def main():
    find_node()
    print_banner()

    processes = []

    try:
        # 1. Start Django Backend
        print("[Backend] Starting Django REST Framework server on port 8000...")
        backend_cmd = [sys.executable, "manage.py", "runserver", "8000"]
        backend_proc = subprocess.Popen(
            backend_cmd,
            cwd=BACKEND_DIR,
            shell=False
        )
        processes.append(("Backend", backend_proc))

        # Give Django a brief moment to initialize
        time.sleep(1)

        # 2. Start Vite Frontend
        print("[Frontend] Starting Vite React server on port 5173...")
        npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
        frontend_proc = subprocess.Popen(
            [npm_cmd, "run", "dev"],
            cwd=FRONTEND_DIR,
            shell=True
        )
        processes.append(("Frontend", frontend_proc))

        # Monitor processes
        while True:
            for name, proc in processes:
                ret = proc.poll()
                if ret is not None:
                    print(f"[{name}] exited unexpectedly with code {ret}")
                    return ret
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n[Shutdown] Stopping servers gracefully...")
    finally:
        for name, proc in processes:
            if proc.poll() is None:
                print(f"[Shutdown] Terminating {name}...")
                if sys.platform == "win32":
                    subprocess.call(["taskkill", "/F", "/T", "/PID", str(proc.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    proc.terminate()
        print("[Shutdown] All servers terminated.")

if __name__ == "__main__":
    sys.exit(main() or 0)
