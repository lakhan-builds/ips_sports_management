# System Architecture

## 1. Modular Directory Structure (Designed for AI/Vibe Coding)

The application cleanly separates backend business domains and frontend components so any AI agent or software engineer can locate and modify targeted capabilities quickly:

```text
sports-management/
├── backend/
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   └── __init__.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   │
│   ├── apps/
│   │   ├── accounts/       # Custom User, CoordinatorProfile, AuditLog, Role hierarchy
│   │   ├── branches/       # Branch model, assignments
│   │   ├── sports/         # Sport models, slugs, tournament types
│   │   ├── trials/         # Trial model, poster uploads, scheduling, publish status
│   │   ├── forms/          # Form, FormField (dynamic form builder)
│   │   ├── submissions/    # FormSubmission, SubmissionAnswer
│   │   ├── selections/     # StudentSelection, snapshot preservation, unselect
│   │   └── dashboard/      # Aggregated role-scoped metrics & stats
│   │
│   ├── requirements.txt
│   └── manage.py
│
├── frontend/
│   ├── src/
│   │   ├── api/            # Centralized API service layer (client, auth, users, trials, forms...)
│   │   ├── context/        # AuthContext (JWT, user state, permission checks)
│   │   ├── components/
│   │   │   ├── common/     # StatCard, Modal, ConfirmDialog, StatusBadge, EmptyState...
│   │   │   └── layout/     # Sidebar, Topbar, Layout wrapper
│   │   ├── pages/          # Login, Dashboard, Users, Sports, Branches, Trials, Forms...
│   │   └── routes/         # ProtectedRoute with allowedRoles checks
│   │
│   ├── public/             # PWA manifest.json, sw.js, app icons
│   ├── package.json
│   └── vite.config.js
```

---

## 2. Model Relationships & Schema

```text
User (AbstractBaseUser)
 ├── role [ADMIN, SPORTS_COORDINATOR, BRANCH_COORDINATOR, STUDENT_COORDINATOR]
 └── CoordinatorProfile (OneToOne)
      └── assigned_branches (ManyToMany -> Branch)

Branch
 ├── code (unique, e.g. CSE, ECE)
 ├── name
 └── is_active

Sport
 ├── name (unique)
 ├── slug (auto-slugified)
 └── icon

Trial
 ├── sport (ForeignKey -> Sport, on_delete=PROTECT)
 ├── branch (ForeignKey -> Branch, on_delete=SET_NULL, null=True)
 ├── trial_date, start_time, end_time, venue, description
 ├── poster (ImageField upload_to='trial_posters/')
 ├── status [DRAFT, PUBLISHED, CANCELLED]
 └── created_by (ForeignKey -> User, on_delete=SET_NULL)

Form
 ├── sport (ForeignKey -> Sport, on_delete=PROTECT)
 ├── branch (ForeignKey -> Branch, on_delete=SET_NULL, null=True)
 ├── status [DRAFT, PUBLISHED, CLOSED, ARCHIVED]
 └── fields (OneToMany -> FormField, on_delete=CASCADE)
      ├── label, field_name, field_type, placeholder, is_required, options, order

FormSubmission
 ├── form (ForeignKey -> Form, on_delete=PROTECT)
 ├── student_name, enrollment_number, email, phone, semester
 ├── branch (ForeignKey -> Branch, on_delete=PROTECT)
 ├── status [PENDING, SELECTED, NOT_SELECTED]
 └── answers (OneToMany -> SubmissionAnswer, on_delete=CASCADE)
      ├── field_label, field_name, value, file_upload

StudentSelection
 ├── submission (OneToOneField -> FormSubmission, on_delete=PROTECT)
 ├── student_name, enrollment_number
 ├── sport (ForeignKey -> Sport, on_delete=PROTECT)
 ├── branch (ForeignKey -> Branch, on_delete=PROTECT)
 ├── selected_by (ForeignKey -> User, on_delete=SET_NULL)
 ├── selected_at (DateTimeField auto_now_add)
 ├── notes (TextField)
 └── snapshot_data (JSONField) -- COMPLETE preserved snapshot of student & submission!

AuditLog
 ├── user (ForeignKey -> User, on_delete=SET_NULL)
 ├── action, object_type, object_id, description, created_at
```

---

## 3. Data Integrity & Preservation Rules

1. **Snapshot Preservation**: When a student is selected, `apps.selections.services.select_student` generates an immutable JSON dictionary inside `StudentSelection.snapshot_data`. Even if the underlying `Form` or `FormField` is altered or archived in subsequent seasons, the exact submission answers and timestamps remain preserved for institutional records.
2. **Safe Deletions**: Deleting forms or trials uses soft-deletion (`is_active=False` and status `ARCHIVED`) so existing submission foreign keys are never abruptly orphaned or corrupted.
3. **Role Scoping in Backend**: While the UI adapts navigation and action buttons based on user role, all backend ViewSets explicitly scope database queries using `request.user.role` and `coordinator_profile.assigned_branches`. Unauthorized REST calls are rejected by DRF permission classes.
