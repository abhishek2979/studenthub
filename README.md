# 📚 StudentHub — Academic Management Platform

A full-stack MERN application for managing students, attendance, and results.  
**Teachers** sign in with Google. **Students** log in with a username & password set by their teacher.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Google Cloud Console project (for OAuth)
- Cloudinary account (for profile photos)

---

## 🔑 Step 1 — Google OAuth Setup (REQUIRED for teacher login)

1. Go to **https://console.cloud.google.com**
2. Create a new project (or select an existing one)
3. Go to **APIs & Services → OAuth consent screen**
   - User Type: **External**
   - App name: `StudentHub`
   - Add your email as a test user
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Name: `StudentHub`
   - Authorized JavaScript origins:
     ```
     http://localhost:5173
     http://localhost:5000
     ```
   - Authorized redirect URIs:
     ```
     http://localhost:5173
     ```
5. Copy your **Client ID** (looks like: `123456789.apps.googleusercontent.com`)

---

## ⚙️ Step 2 — Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/studenthub
JWT_SECRET=any_long_random_string_here
JWT_EXPIRE=7d

GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Seed sample student accounts:
```bash
node seed.js
```

Start backend:
```bash
npm run dev
```

> Runs at **http://localhost:5000**

---

## 🖥️ Step 3 — Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
```

Start frontend:
```bash
npm run dev
```

> Runs at **http://localhost:5173**

---

## 👤 Login Credentials

| Role    | Method          | Credentials                          |
|---------|-----------------|--------------------------------------|
| Teacher | Google OAuth    | Click "Sign in with Google"          |
| Student | Username + Pass | `@arjun.sharma` / `Student@123`      |
| Student | Username + Pass | `@priya.patel`  / `Student@123`      |

> **Teacher accounts are created automatically** on first Google sign-in — no registration form needed.

---

## 🔐 Authentication Flow

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
