# Complete Installation & Setup Guide

This guide details setting up the Sports Management Progressive Web Application for development and production.

---

## Prerequisites

- **Python 3.12+**
- **Node.js 18+ or 20+**
- **npm** (comes with Node.js)

---

## Quick Start (Single Command)

To run both backend and frontend concurrently in a single terminal:

```bash
python run_server.py
```
*(Or simply double click or run `run_server.bat` on Windows)*.

---

## Detailed Step-by-Step Setup

1. Open your terminal and navigate to `backend/`:
   ```bash
   cd backend
   ```

2. (Optional) Create a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   ```

3. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Create/verify `.env` configuration file in `backend/`:
   ```env
   SECRET_KEY=django-insecure-sports-mgmt-vibe-coding-2026-key
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   MEDIA_URL=/media/
   STATIC_URL=/static/
   ```

5. Apply database migrations:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. Seed initial demo data (branches, sports, trials, dynamic forms, sample registrations, and all 4 demo users):
   ```bash
   python manage.py seed_demo_data
   ```

7. Run backend server:
   ```bash
   python manage.py runserver 8000
   ```
   Backend will be listening at `http://127.0.0.1:8000/`.

---

## 2. Frontend Setup

1. Open a second terminal window and navigate to `frontend/`:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Frontend will be running at `http://localhost:5173/`.

---

## 3. Demo Credentials

You can sign in with any of the following accounts or use the 1-click quick-fill buttons on the login screen:

- **Admin**: `admin` / `admin123`
- **Sports Coordinator**: `sports1` / `sports123`
- **Branch Coordinator**: `branch1` / `branch123`
- **Student Coordinator**: `student1` / `student123`

To access the student tryouts registration portal without logging in, open:
`http://localhost:5173/public-trials`

---

## 4. Running Backend Tests

Verify database, hierarchy rules, and dynamic form snapshot preservation:
```bash
cd backend
python manage.py test
```
