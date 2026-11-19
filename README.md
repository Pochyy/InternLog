# InternLog: A Smart OJT Journal and Hours Tracking System

**Course:** IT342 — Systems Integration and Architecture 1  
**Deliverable:** Project Development Increment 1 — Core User Accounts, Authentication, and Role-Based Dashboard

---

## 1. Project Overview

**InternLog** is a web-based system designed to help On-the-Job Training (OJT), practicum, and internship students accurately track their rendered hours, configure their internship placement parameters, keep daily work journals, and compile formal weekly reports.

In strict alignment with the approved **InternLog Software Requirements Specification (SRS)** (Sections 1.5, 1.6, and 2.2), the system is scoped around a single primary user role: the **Registered OJT Student (`student`)**.

---

## 2. Project Development Increment 1 — Implemented Features

### 2.1. User Account Creation (`POST /api/auth/register`)
* **Field Validation:** Validates required fields (`full_name`, `email`, `password`, `confirm_password`), enforces valid email formatting, minimum password length ($\ge 6$ characters), and password confirmation matching on both client and server.
* **Duplicate Account Prevention:** Enforces a `UNIQUE` database constraint on email addresses and performs case-insensitive duplicate checks (`409 Conflict`).
* **Secure Password Hashing:** Hashes all passwords using **bcrypt (`bcryptjs`)** with 10 salt rounds prior to database persistence. Plaintext passwords are never stored.
* **Role Assignment:** Automatically assigns the `'student'` role (*Registered OJT Student*) in accordance with the SRS.
* **Database Persistence:** Stores user records in a relational **SQLite** database (`backend/data/internlog.db`).

### 2.2. User Login and Logout (`POST /api/auth/login`, `POST /api/auth/logout`)
* **Functional Login Interface:** Responsive login view with email and password authentication.
* **Credential Verification:** Verifies submitted passwords against stored bcrypt hashes and updates `last_login_at` timestamps.
* **Invalid Credential Error Handling:** Displays clear, user-friendly error alerts for non-existent emails or invalid passwords (`401 Unauthorized`).
* **Secure Session Management:** Issues signed **JSON Web Tokens (JWT)** transmitted via `Authorization: Bearer <token>` headers and verified on protected endpoints (`GET /api/auth/me`).
* **Proper Session Termination (Logout):** Clears client session state and records the revoked token in the backend `revoked_tokens` table so logged-out tokens cannot be reused.
* **Route & Endpoint Protection:** Blocks unauthenticated requests on both the React frontend (`ProtectedRoute`) and Express backend (`authenticateToken` middleware).

### 2.3. Role-Based User Dashboard (`/dashboard`)
* **Registered OJT Student Dashboard:** Redirects authenticated students directly to their dashboard displaying their name, verified role badge (`Role: Registered OJT Student`), and navigation controls.
* **OJT Onboarding & Profile Configuration (SRS `FR-1.4` & `FR-1.5`):** Prompts newly registered students to configure their **Host Company Name**, **Total Required Hours**, **Official Start Date**, and **Weekly Working Days**, with full edit capability at any time.
* **Hours & Progress Metrics Overview (SRS `FR-2.4` & `FR-2.5`):** Dynamically computes and displays Total Required Hours, Hours Rendered, Hours Remaining, Completion Percentage, and an Estimated Completion Date based on scheduled working days.
* **Role-Based Access Control (RBAC):** Enforces `requireRole('student')` on backend routes and `allowedRoles={['student']}` on frontend routes.

---

## 3. Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router v6, Modern Responsive CSS (360px+ viewports) |
| **Backend** | Node.js, Express.js, RESTful API Architecture |
| **Database** | SQLite (`sql.js` relational engine persisting to `backend/data/internlog.db`) |
| **Authentication & Security** | `bcryptjs` (Password Hashing), `jsonwebtoken` (JWT Session Auth & Revocation), CORS |

---

## 4. Project Structure

```text
InternLog/
├── backend/
│   ├── data/
│   │   └── internlog.db             # Auto-generated SQLite relational database
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                # SQLite initialization & table schemas (users, ojt_profiles, revoked_tokens)
│   │   ├── controllers/
│   │   │   ├── authController.js    # Register, Login, Logout, and Current User handlers
│   │   │   └── profileController.js # OJT Profile configuration & hours forecasting logic
│   │   ├── middleware/
│   │   │   └── auth.js              # JWT authentication & Role-Based Access Control (RBAC)
│   │   ├── routes/
│   │   │   ├── authRoutes.js        # /api/auth/* endpoints
│   │   │   └── profileRoutes.js     # /api/profile/* protected endpoints
│   │   └── server.js                # Express server entry point
│   ├── .env.example                 # Environment variable template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Top navigation bar with role indicator & logout
│   │   │   ├── OjtSetupModal.jsx    # OJT Onboarding & configuration modal (SRS FR-1.4/1.5)
│   │   │   └── ProtectedRoute.jsx   # Frontend authentication & role guard
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Global authentication state provider
│   │   ├── pages/
│   │   │   ├── Login.jsx            # User login interface
│   │   │   ├── Register.jsx         # User account creation interface
│   │   │   └── StudentDashboard.jsx # Registered OJT Student Dashboard
│   │   ├── api.js                   # Fetch wrapper with Bearer JWT attachment
│   │   ├── App.jsx                  # Application routing
│   │   ├── index.css                # Responsive styling (SRS Deep Navy & Steel Blue palette)
│   │   └── main.jsx                 # React DOM entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## 5. Setup and Execution Instructions

### Prerequisites
* **Node.js** (v18.0.0 or higher recommended)
* **npm** (v9.0.0 or higher)

### Step 1: Clone the Repository
```bash
git clone https://github.com/Pochyy/InternLog.git
cd InternLog
```

### Step 2: Configure and Start the Backend Server
Open a terminal and run:
```bash
cd backend
npm install
```
*(Optional)* If `.env` is not present, copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Start the backend API server:
```bash
npm start
```
The backend API will initialize the SQLite database at `backend/data/internlog.db` and listen on **`http://localhost:5000`**.

### Step 3: Install and Start the Frontend Application
Open a **second terminal** and run:
```bash
cd frontend
npm install
npm run dev
```
The React development server will start on **`http://localhost:5173`**.

### Step 4: Access the Application
1. Open your browser and navigate to **`http://localhost:5173`**.
2. Click **Create an Account** (`/register`) to register a new OJT Student account.
3. Upon registration, you will be automatically authenticated and redirected to the **Registered OJT Student Dashboard** (`/dashboard`).
4. Click **Set Up OJT Profile Now** (or **Configure OJT Details**) to configure your Host Company Name, Total Required Hours, Official Start Date, and Weekly Working Days.
5. Click **Logout** in the top navigation bar to terminate your session, then test signing back in via `/login`.

---

## 6. API Endpoints Summary

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Health check for backend API status |
| `POST` | `/api/auth/register` | Public | Register a new OJT student account (validates & hashes password) |
| `POST` | `/api/auth/login` | Public | Authenticate student credentials & receive JWT session token |
| `POST` | `/api/auth/logout` | Protected | Revoke active JWT token and terminate session |
| `GET` | `/api/auth/me` | Protected | Retrieve current authenticated student and OJT profile |
| `GET` | `/api/profile` | Protected (`student`) | Retrieve OJT profile and calculated hours progress metrics |
| `PUT` | `/api/profile` | Protected (`student`) | Create or update OJT placement parameters |
