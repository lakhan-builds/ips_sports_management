# Sports Management Progressive Web Application (PWA)

A modular, production-ready, full-stack **Sports Management Progressive Web Application** designed specifically for educational institutions (universities/colleges) to coordinate sports trials, branches, coordinators, student trial registrations, and athlete selections.

Built with **Python 3.12+ / Django 5+ / Django REST Framework** backend and **React 18 / Vite 5 / Tailwind CSS** PWA frontend, following an **AI/vibe-coding modular architecture**.

---

## 🌟 Key Features

1. **Strict 4-Level Role Hierarchy & Authority**:
   - **Admin**: Complete institutional control, user management, branch & sports catalogs, system audit logs.
   - **Sports Coordinator**: University-wide trial calendars, poster uploads, form oversight, branch coordinator management, selection rosters.
   - **Branch Coordinator**: Branch-assigned trial scheduling, dynamic form builder, student coordinator supervision.
   - **Student Coordinator**: Sport-wise trial evaluation, applicant profiles, candidate selection, and rejection.
2. **Hierarchical Password Reset**:
   - Higher-level coordinators can directly reset credentials for users below their role in the hierarchy without complex OTP flows.
3. **Dynamic Drag/Ordered Form Builder**:
   - Create customizable registration forms supporting: Text, Textarea, Number, Email, Phone, Date, Dropdown, Radio, Checkbox, and File/Image attachments.
   - Set required fields, custom placeholders, options, and submission deadlines.
   - Forms support `DRAFT`, `PUBLISHED`, `CLOSED`, and `ARCHIVED` statuses.
4. **Student Selection & Permanent Snapshot Preservation**:
   - Selecting a student creates an immutable `StudentSelection` record linked to the original submission.
   - Preserves a **complete JSON snapshot (`snapshot_data`)** of the student's submitted data, answers, timestamp, and evaluation notes even if the form or student record changes later.
5. **Trial Poster Management**:
   - Media poster upload, trial start/end times, venue, sport, branch, and descriptions displayed as cards.
   - Direct publish/unpublish toggles.
6. **Public Student Registration Portal**:
   - Public-facing view (`/public-trials`) where prospective students can browse upcoming trials and submit registrations directly through the dynamic form builder questionnaire.
7. **PWA Offline & Mobile Support**:
   - Web App Manifest (`manifest.json`), Service Worker (`sw.js`), app icons, installability, and an offline status banner.
8. **CSV Data Exports**:
   - Filter-aware CSV exports for both submissions (`/api/v1/submissions/export/`) and selections (`/api/v1/selections/export/`).
9. **Interactive API Documentation**:
   - Interactive Swagger UI at `/api/docs/` and Redoc at `/api/redoc/` powered by `drf-spectacular`.

---

## 🛠 Technology Stack

### Backend
- **Python 3.12+**
- **Django 5.1+**
- **Django REST Framework 3.15+**
- **Django SimpleJWT** (stateless JWT tokens)
- **django-cors-headers**
- **Pillow** (trial poster & file handling)
- **drf-spectacular** (OpenAPI 3.0 / Swagger schema)
- **python-dotenv**

### Frontend
- **React 18**
- **Vite 5**
- **Tailwind CSS 3.4**
- **React Router 6**
- **Axios** (centralized client with JWT interceptor)
- **Lucide React** (icons)
- **PWA Service Worker & Manifest**

---

## 🚀 Quick Start Guide

### Start Both Servers with a Single Command

Run the unified runner script from the root directory:

```bash
python run_server.py
```
*(On Windows, you can also double-click or run `run_server.bat`).*

This automatically starts both the Django API backend (`http://127.0.0.1:8000`) and the Vite React frontend (`http://localhost:5173`), handles proxy routing, and provides graceful shutdown when pressing `Ctrl + C`.

---

### Manual Step-by-Step Start (Alternative)

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Seed realistic demo data (branches, sports, trials, forms, submissions, selections, & demo users)
python manage.py seed_demo_data

# Run Django development server
python manage.py runserver 8000
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run Vite development server
npm run dev
```

Visit the app in your browser:
- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8000/api/v1/](http://localhost:8000/api/v1/)
- **Swagger Documentation**: [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)

---

## 🔑 Demo Credentials

| Role | Username | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Institutional superuser, manages all coordinators, sports, branches, trials, audit logs |
| **Sports Coordinator** | `sports1` | `sports123` | Manages trials, branch coordinators, student coordinators, all submissions & selections |
| **Branch Coordinator** | `branch1` | `branch123` | Manages CSE & ECE branch trials, dynamic forms, student coordinators |
| **Student Coordinator** | `student1` | `student123` | Assigned to CSE branch; evaluates submissions, executes student selections |

*(The login page features a 1-click credential selector for instant testing).*

---

## 🧪 Running Automated Tests

Run backend unit tests verifying authentication, role hierarchy checks, password reset restrictions, dynamic form submission, and snapshot preservation:

```bash
cd backend
python manage.py test
```

Build the production frontend bundle:

```bash
cd frontend
npm run build
```
