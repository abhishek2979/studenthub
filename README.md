#  StudentHub — Academic Management Platform

A full-stack MERN application for managing students, attendance, and results.  
**Teachers** sign in with Google. **Students** log in with a username & password set by their teacher.

---
### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Google Cloud Console project (for OAuth)
- Cloudinary account (for profile photos)
---

##  Step 1 — Google OAuth Setup (REQUIRED for teacher login)
##  Step 2 — Backend Setup
## 🖥️ Step 3 — Frontend Setup
## 👤 Login Credentials

| Role    | Method          | Credentials                          |
|---------|-----------------|--------------------------------------|
| Teacher | Google OAuth    | Click "Sign in with Google"          |
| Student | Username + Pass | `@arjun.sharma` / `Student@123`      |
| Student | Username + Pass | `@priya.patel`  / `Student@123`      |

> **Teacher accounts are created automatically** on first Google sign-in — no registration form needed.

---

## Authentication Flow

```
Teacher → Google Button → Google Popup → ID Token → Backend verifies with Google → JWT issued
Student → Username + Password → Backend checks bcrypt hash → JWT issued
```

---

## 📁 Project Structure

```
studenthub/
├── backend/
│   ├── controllers/    authController.js (Google OAuth + student login)
│   ├── models/         User.js (googleId for teachers, username for students)
│   ├── routes/         auth.js, students.js, attendance.js, results.js
│   └── server.js
└── frontend/
    ├── src/
    │   ├── pages/      LoginPage.jsx, TeacherDashboard.jsx, StudentDashboard.jsx
    │   ├── components/ UI.jsx
    │   └── utils/      api.js
    └── index.html
```
