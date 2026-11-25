# AI Continuation & Repository Handoff Guide

> **MANDATORY INSTRUCTION FOR ALL AI ASSISTANTS:**  
> Whenever you start or continue work in this repository, you **MUST** read this file first.  
> For **every change or task you perform in any session**, you **MUST update this file** under the **Session Changelog** and **Active State** sections before concluding your response. This ensures continuous, uninterrupted knowledge transfer across sessions.

---

## 1. Project Identity & Context

* **Project Title:** InternLog: A Smart OJT Journal and Hours Tracking System
* **Course:** IT342 — Systems Integration and Architecture 1
* **Repository:** `https://github.com/Pochyy/InternLog.git`
* **Local Workspace Root:** `C:\Code Files\IT342 - G01\Project`
* **Scope Baseline:** Approved InternLog Software Requirements Specification (SRS).
* **Single Primary Role Invariant:** Scoped exclusively around the **Registered OJT Student (`student`)** role (SRS Sections 1.5, 1.6, 2.2). Do not introduce admin, faculty, or supervisor login portals unless an explicit SRS amendment is provided by the user.

---

## 2. Session Changelog & Ledger

### Session 1: Initial Repository Clone, Audit & Technical Documentation
* **Timestamp:** 2026-11-24
* **Actions Taken:**
  1. Cloned remote GitHub repository (`https://github.com/Pochyy/InternLog.git`) directly into workspace root.
  2. Conducted full codebase audit across backend (`Node.js`/`Express`/`sql.js`) and frontend (`React 18`/`Vite`/`React Router v6`).
  3. Authored [`PROJECT_SUMMARY.md`](file:///c:/Code%20Files/IT342%20-%20G01/Project/PROJECT_SUMMARY.md) containing comprehensive architectural specifications, ERD, endpoint contracts, frontend Bento grid breakdown, and roadmap.
  4. Created [`AI_CONTINUATION.md`](file:///c:/Code%20Files/IT342%20-%20G01/Project/AI_CONTINUATION.md) to serve as persistent context handoff for future AI sessions.
* **Current Git Commit:** `14edbce0d4e6dbc3031bcf38a32601812bde697e`.

### Session 2: Increment 2 Requirements Review & SRS / Completion Report Analysis
* **Timestamp:** 2026-11-25
* **Actions Taken:**
  1. Located and extracted requirements from reference documents in parent directory:
     - `IT342_G01_Lariosa_Vinzent_InternLog_SRS.docx.pdf` (Approved SRS by Vinzent Emmanuel M. Lariosa, IT342 - G01).
     - `IT342-PD-Completion-Report-Template.docx` (Official Increment Completion Report Template).
  2. Analyzed Increment 2 functional requirements:
     - **Feature 1: User Profile Management** (View & edit profile details, avatar, student metadata, input validation, strict user isolation).
     - **Feature 2: Reset Password (Forgot Password)** (Login page entry, expiring single-use token table, password hashing, old session invalidation).
     - **Feature 3: Change Password** (Authenticated modal/view, current password verification via bcrypt, new password validation & confirmation).
  3. Confirmed architectural & operational specifications with user:
     - **Git Branching Strategy:** Separate feature branches (`feature/user-profile-management`, `feature/change-password`, `feature/reset-password`) pushed to remote per feature, then merged into `main` after all features are validated.
     - **Password Reset Token Delivery:** Render a prominent, friendly developer notification banner on screen (with copyable token/direct reset link) plus backend console logging for instant zero-dependency testing.
     - **User Schema Extensions:** Extend `users` table with `student_id_number`, `contact_number`, and `academic_program` alongside existing profile fields.
  4. Prepared step-by-step incremental development, testing, and Git commit/push protocol.
  5. Established requirements for generating `docs/Increment-2-Completion-Report.pdf` from the official report template.
* **Active Status:** All three Increment 2 feature branches (`feature/user-profile-management`, `feature/change-password`, `feature/reset-password`) built, tested, and pushed to remote. Proceeding to merge into `main` and generate `docs/Increment-2-Completion-Report.pdf`.

### Session 3: Increment 2 Execution — Feature-by-Feature Build, Verification & Git Pushes
* **Timestamp:** 2026-11-25
* **Feature 1 (`feature/user-profile-management`) — Completed & Verified:**
  - Extended `users` SQLite schema (`student_id_number`, `contact_number`, `academic_program`, `updated_at`) with automatic non-destructive `ALTER TABLE` migration in `backend/src/config/db.js`.
  - Created `backend/src/controllers/userController.js` and `backend/src/routes/userRoutes.js` (`/api/users/profile` & `/api/users/:userId`) enforcing strict row-level authorization (`403 Forbidden` on cross-user access), format validation, and duplicate email/student ID checks (`409 Conflict`).
  - Built `frontend/src/pages/UserProfile.jsx` in Pro Max Bento Grid layout with View/Edit modes, updated `Navbar.jsx`, `StudentDashboard.jsx`, and `AuthContext.jsx`.
  - Passed full API integration suite & Vite production build. Pushed branch (`8a63414`).
* **Feature 2 (`feature/change-password`) — Completed & Verified:**
  - Implemented `PUT / POST /api/auth/change-password` in `authController.js` verifying `current_password` via `bcrypt.compare`, enforcing length/confirmation/non-reuse rules, hashing `new_password` with 10 salt rounds, revoking prior JWT, and rotating session token.
  - Built `frontend/src/components/ChangePasswordCard.jsx` and integrated it into `UserProfile.jsx` and `AuthContext.jsx`.
  - Verified all 11 security & validation assertions including old password invalidation. Pushed branch (`a1a05ea`).
* **Feature 3 (`feature/reset-password`) — Completed & Verified:**
  - Added `password_reset_tokens` table in SQLite storing SHA-256 `token_hash`, 15-minute `expires_at`, and `used_at` single-use timestamp.
  - Implemented `POST /api/auth/forgot-password`, `GET /api/auth/verify-reset-token`, and `POST /api/auth/reset-password`.
  - Built Split-Screen `ForgotPassword.jsx` (with Developer Recovery Notification Banner & copyable token/direct reset button) and `ResetPassword.jsx`, plus added `"Forgot Password?"` link on `Login.jsx`.
  - Verified SHA-256 at-rest storage, expiration rejection, prior-token invalidation, single-use enforcement, and bcrypt login transition.

---

## 3. Architecture & Code Conventions

### 3.1 Backend Patterns (`backend/`)
* **Framework:** Express.js (`backend/src/server.js`) listening on port `5000`.
* **Database Driver:** `sql.js` (`backend/src/config/db.js`).  
  * *Important:* SQLite runs in-memory and exports to `backend/data/internlog.db` via `saveDatabase()`.
  * Always use the exported helper functions:
    * `queryOne(sql, params)`: returns single object or `null`.
    * `queryAll(sql, params)`: returns array of objects.
    * `execute(sql, params)`: runs mutation and automatically calls `saveDatabase()`.
* **Authentication Middleware:** `backend/src/middleware/auth.js`
  * `authenticateToken`: extracts Bearer token, verifies JWT, checks against `revoked_tokens` table.
  * `requireRole(...roles)`: RBAC guard. Default: `requireRole('student')`.
* **Response Format:** Always adhere to consistent JSON structure:
  ```json
  {
    "success": true, // or false
    "message": "Human readable status message",
    "data": { ... } // optional payload
  }
  ```

### 3.2 Frontend Patterns (`frontend/`)
* **Framework:** React 18 with Vite (`frontend/src/App.jsx`).
* **Routing & Guards:** React Router v6. Protected pages must be wrapped with `<ProtectedRoute allowedRoles={['student']}>`.
* **State Management:** `AuthContext.jsx` exposes `user`, `ojtProfile`, `setOjtProfile`, `loading`, `isAuthenticated`, `login`, `register`, and `logout`.
* **API Communication:** Use `apiRequest(endpoint, options)` in `frontend/src/api.js`. It automatically injects `Authorization: Bearer <token>` from `localStorage.getItem('internlog_token')`.
* **Styling Tokens:** Defined in `frontend/src/index.css`:
  * Primary Palette: Deep Navy & Productivity Teal (`#0D9488`, `#134E4A`, `#CCFBF1`)
  * Accent: Warm Amber (`#F59E0B`, `#FEF3C7`)
  * Layout: Bento Grid (`.bento-grid`, `.bento-card`, `.bento-span-*`)
  * Forms: Split-screen auth layout (`.auth-split-layout`, `.auth-showcase-panel`, `.auth-card`)

---

## 4. Current Database Schema Summary

The database is defined in `backend/src/config/db.js`.

1. **`users` Table:**
   * Columns: `user_id` (TEXT PK), `google_id` (TEXT UNIQUE), `email` (TEXT UNIQUE NOT NULL), `full_name` (TEXT NOT NULL), `password_hash` (TEXT NOT NULL), `role` (TEXT DEFAULT 'student'), `profile_picture_url` (TEXT), `created_at` (TEXT NOT NULL), `last_login_at` (TEXT).
2. **`ojt_profiles` Table:**
   * Columns: `profile_id` (TEXT PK), `user_id` (TEXT UNIQUE FK -> users), `company_name` (TEXT NOT NULL), `required_hours` (REAL DEFAULT 300), `rendered_hours` (REAL DEFAULT 0), `start_date` (TEXT NOT NULL), `working_days` (TEXT NOT NULL), `estimated_completion_date` (TEXT), `updated_at` (TEXT NOT NULL).
3. **`revoked_tokens` Table:**
   * Columns: `token` (TEXT PK), `revoked_at` (TEXT NOT NULL).

---

## 5. Next Steps & Recommended Increment 2 Roadmap

When instructed by the user to proceed with feature development, the next planned increment is **Project Development Increment 2 (Daily Time Logging & Smart Journal System)**:

### 5.1 Schema Additions Needed for Increment 2
1. **`daily_time_logs` Table:**
   * `log_id` (TEXT PK)
   * `user_id` (TEXT FK -> users)
   * `log_date` (TEXT NOT NULL)
   * `time_in` (TEXT NOT NULL)
   * `time_out` (TEXT)
   * `lunch_break_hours` (REAL DEFAULT 1.0)
   * `hours_rendered` (REAL NOT NULL)
   * `status` (TEXT DEFAULT 'completed') -- 'in_progress', 'completed'
   * `created_at`, `updated_at` (TEXT)
2. **`journal_entries` Table:**
   * `journal_id` (TEXT PK)
   * `log_id` (TEXT FK -> daily_time_logs, nullable)
   * `user_id` (TEXT FK -> users)
   * `entry_date` (TEXT NOT NULL)
   * `raw_notes` (TEXT)
   * `polished_content` (TEXT)
   * `skills_learned` (TEXT)
   * `challenges_encountered` (TEXT)
   * `created_at`, `updated_at` (TEXT)

### 5.2 Planned Increment 2 Endpoints
* `GET /api/logs` — List student daily logs (with date filtering).
* `POST /api/logs/time-in` — Clock in for the current day.
* `POST /api/logs/time-out` — Clock out and compute daily rendered hours.
* `POST /api/journals` — Create or update daily work journal.
* `POST /api/journals/ai-polish` — Gemini AI endpoint to format raw notes into professional journal entries.

### 5.3 Planned Increment 2 Frontend Additions
* **Daily Time Clock Card:** Interactive Time In / Time Out buttons with active timer.
* **Daily Journal Editor:** Modal or dedicated page to record daily learnings and polish with AI.
* **Attendance History Table:** Filterable table showing daily logs and hours rendered.

---

## 6. How the Next AI Should Update This File

When any AI assistant works on this project:
1. Append an entry to **Section 2 (Session Changelog & Ledger)** detailing:
   * Session number and date.
   * Features implemented, modified, or debugged.
   * Any files added or deleted.
   * Testing outcomes.
2. Update **Section 4 (Database Schema)** if tables or columns were added.
3. Update **Section 5 (Next Steps)** by crossing off completed tasks and adding new ones.
