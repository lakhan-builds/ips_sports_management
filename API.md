# API Reference Documentation

All endpoints are prefixed with `/api/v1/`.

Interactive Swagger UI is available at:
`http://localhost:8000/api/docs/`

---

## 1. Authentication (`/api/v1/auth/`)

- `POST /auth/login/`
  - Request: `{"username": "...", "password": "..."}`
  - Response: `{"access": "jwt_token", "refresh": "jwt_refresh", "user": {...}}`
- `POST /auth/refresh/`
  - Request: `{"refresh": "jwt_refresh"}`
- `GET /auth/me/` (Requires Bearer token)
  - Returns current user profile, role, and branch assignments.
- `POST /auth/change-password/`
  - Request: `{"old_password": "...", "new_password": "..."}`

---

## 2. User Management (`/api/v1/users/`)

- `GET /users/` (Supports `?search=...`, `?role=...`, `?branch=...`)
- `POST /users/` (Creates coordinator, enforces hierarchy authority)
- `GET /users/{id}/`
- `PUT /users/{id}/`
- `DELETE /users/{id}/` (Soft-deactivates user)
- `POST /users/{id}/reset-password/`
  - Request: `{"new_password": "..."}`
  - Allowed if requesting user role is higher in hierarchy than target user.

---

## 3. Branches (`/api/v1/branches/`)

- `GET /branches/` (Supports `?search=...`, `?assigned_only=true`)
- `POST /branches/` (Admin only)
- `PUT /branches/{id}/` (Admin only)
- `DELETE /branches/{id}/` (Admin only)

---

## 4. Sports (`/api/v1/sports/`)

- `GET /sports/` (Public / Authenticated)
- `POST /sports/` (Admin only)
- `PUT /sports/{id}/` (Admin only)
- `DELETE /sports/{id}/` (Admin only)

---

## 5. Trials (`/api/v1/trials/`)

- `GET /trials/` (Supports `?search=...`, `?sport=...`, `?status=...`)
- `POST /trials/` (Multipart/form-data: title, sport, branch, trial_date, start_time, end_time, venue, description, poster)
- `PUT /trials/{id}/`
- `DELETE /trials/{id}/`
- `POST /trials/{id}/publish/`
- `POST /trials/{id}/unpublish/`

---

## 6. Forms (`/api/v1/forms/`)

- `GET /forms/` (Supports `?search=...`, `?sport=...`, `?status=...`)
- `POST /forms/`
  - Request body includes title, sport, branch, description, status, deadline, and `fields: [...]`.
- `PUT /forms/{id}/`
- `DELETE /forms/{id}/`
- `POST /forms/{id}/publish/`
- `POST /forms/{id}/close/`
- `POST /forms/{id}/reopen/`

---

## 7. Submissions (`/api/v1/submissions/`)

- `POST /submissions/` (Public / Student Registration)
  - Request: `{"form_id": 1, "student_name": "...", "enrollment_number": "...", "branch_id": 1, "semester": "3", "email": "...", "phone": "...", "answers": {"field_name": "val"}}`
- `GET /submissions/` (Scoped by coordinator role & assigned branches)
- `GET /submissions/{id}/`
- `GET /submissions/export/` (Downloads filtered CSV)

---

## 8. Selections (`/api/v1/selections/`)

- `GET /selections/` (Supports `?sport=...`, `?branch=...`, `?search=...`)
- `POST /selections/select/`
  - Request: `{"submission_id": 1, "notes": "..."}`
  - Creates `StudentSelection`, saves complete `snapshot_data`, sets submission status to `SELECTED`.
- `POST /selections/unselect/`
  - Request: `{"submission_id": 1, "notes": "..."}`
- `GET /selections/export/` (Downloads CSV)

---

## 9. Dashboard (`/api/v1/dashboard/`)

- `GET /dashboard/stats/`
  - Aggregated role-scoped metrics, recent trials, forms, selections, and sports registration breakdown.
