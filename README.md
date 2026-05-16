# 🗂 TaskFlow — Team Task Manager

A full-stack collaborative task management app built with React, Node.js/Express, and PostgreSQL.

![Stack](https://img.shields.io/badge/Frontend-React-blue) ![Stack](https://img.shields.io/badge/Backend-Node.js%20%2F%20Express-green) ![Stack](https://img.shields.io/badge/Database-PostgreSQL-blue) ![Stack](https://img.shields.io/badge/Deploy-Railway-purple)

---

## Features

- **Authentication** — Secure JWT-based signup/login
- **Projects** — Create projects, invite team members
- **Kanban Board** — Drag-free To Do / In Progress / Done columns
- **Tasks** — Title, description, due date, priority, assignee
- **Role-Based Access** — Admins manage everything; Members update their own tasks
- **Dashboard** — Stats, charts (status breakdown, tasks per user), overdue alerts
- **Responsive UI** — Dark-themed, production-grade design

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router 6, Recharts, Axios |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |
| Validation | express-validator |
| Deploy | Railway |

---

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL running locally

### 1. Clone & Setup Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your database URL and JWT secret
npm install
npm run dev
```

### 2. Setup Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env: set REACT_APP_API_URL=http://localhost:5000/api
npm install
npm start
```

The app runs at `http://localhost:3000`

---

## 🚀 Deployment on Railway (Mandatory)

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/team-task-manager.git
git push -u origin main
```

### Step 2: Deploy Backend on Railway

1. Go to [railway.app](https://railway.app) → **New Project**
2. Select **Deploy from GitHub Repo** → select your repo
3. Choose the **`backend`** folder as the root directory
4. Railway will auto-detect Node.js and install deps

**Add a PostgreSQL database:**
- In your Railway project → **New** → **Database** → **PostgreSQL**
- Railway auto-injects `DATABASE_URL` into your service

**Set environment variables** (Settings → Variables):
```
JWT_SECRET=your_random_secret_min_32_chars
NODE_ENV=production
FRONTEND_URL=https://your-frontend.railway.app
```

### Step 3: Deploy Frontend on Railway

1. In the same Railway project → **New Service** → **GitHub Repo**
2. Choose your repo, set root directory to **`frontend`**
3. Set build command: `npm run build`
4. Set start command: `npx serve -s build -l $PORT`

**Set environment variables:**
```
REACT_APP_API_URL=https://your-backend.railway.app/api
```

### Step 4: Link them

- Copy the backend Railway URL → paste into frontend's `REACT_APP_API_URL`
- Copy the frontend Railway URL → paste into backend's `FRONTEND_URL`
- Redeploy both services

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List user's projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project + members |
| POST | `/api/projects/:id/members` | Add member (admin) |
| DELETE | `/api/projects/:id/members/:userId` | Remove member (admin) |
| DELETE | `/api/projects/:id` | Delete project (admin) |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks?project_id=X` | Get project tasks |
| POST | `/api/tasks` | Create task (admin) |
| PATCH | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task (admin) |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get all stats |

---

## Database Schema

```sql
users (id, name, email, password, created_at)
projects (id, name, description, created_by, created_at)
project_members (id, project_id, user_id, role, joined_at)
tasks (id, project_id, title, description, due_date, priority, status, assigned_to, created_by, created_at, updated_at)
```

---

## Role Permissions

| Action | Admin | Member |
|--------|-------|--------|
| Create/delete tasks | ✅ | ❌ |
| Update task status | ✅ | ✅ (own tasks only) |
| Add/remove members | ✅ | ❌ |
| View all project tasks | ✅ | ✅ |
| Delete project | ✅ | ❌ |

---

## Project Structure

```
team-task-manager/
├── backend/
│   ├── server.js           # Entry point + DB init
│   ├── middleware/auth.js  # JWT middleware
│   ├── models/db.js        # PostgreSQL pool
│   └── routes/
│       ├── auth.js
│       ├── projects.js
│       ├── tasks.js
│       └── dashboard.js
└── frontend/
    └── src/
        ├── App.jsx
        ├── App.css
        ├── context/AuthContext.jsx
        ├── utils/api.js
        ├── components/Layout.jsx
        └── pages/
            ├── Login.jsx
            ├── Signup.jsx
            ├── Dashboard.jsx
            ├── Projects.jsx
            └── ProjectDetail.jsx
```
