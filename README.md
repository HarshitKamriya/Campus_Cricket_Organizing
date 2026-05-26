# Campus Cricket — NIT Srinagar

A full-stack real-time live cricket broadcasting web application built for on-campus matches at NIT Srinagar.

## 🚀 Features

- **Real-time Live Scoring**: Ball-by-ball updates broadcast instantly via Socket.IO.
- **Admin Panel**: Authenticated scorers can log ball events (runs, wickets, extras) with undo capability.
- **Audience View**: Read-only scoreboard, player cards, and commentary feed.
- **Full Match History**: Persistent storage of matches, innings, and comprehensive player stats.
- **NIT Srinagar Branding**: Premium UI featuring NIT Srinagar colors (Blue `#1a237e` and Gold `#ffc107`).

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, React Router, Socket.IO Client, Framer Motion
- **Backend**: Node.js, Express, Socket.IO, Sequelize (ORM)
- **Database**: PostgreSQL 14+
- **Deployment**: Docker Compose

## 🔧 Prerequisites

- Node.js 20+
- PostgreSQL 14+ or Docker

## 🚀 Quick Start (Docker)

The easiest way to run the entire stack (Postgres + Backend + Frontend) is using Docker Compose.

```bash
# Start all services
docker-compose up -d

# Run database migrations and seed data
docker-compose exec backend npm run db:migrate
docker-compose exec backend npm run db:seed
```

The app will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 💻 Local Development Setup

### 1. Database Setup

Make sure you have PostgreSQL running locally and create a database:
```sql
CREATE DATABASE campus_cricket;
CREATE USER cricket_user WITH PASSWORD 'cricket_pass';
GRANT ALL PRIVILEGES ON DATABASE campus_cricket TO cricket_user;
```

### 2. Backend Setup

```bash
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`.

## 🧑‍💼 Admin Credentials

The database seeder creates default admin users:
- **Admin 1**: \`admin\` / \`admin123\`
- **Scorer**: \`scorer1\` / \`scorer123\`

## 📦 API Reference

- \`POST /api/auth/login\` - Login to get JWT token
- \`GET /api/matches\` - List all matches
- \`POST /api/matches\` - Create match (Admin only)
- \`POST /api/matches/:id/events\` - Add ball event (Admin only)
- \`GET /api/matches/:id/scoreboard\` - Get real-time scoreboard data

## 🧪 Demo Script

A \`demo-script.sh\` is provided in the root directory to quickly test the flow via curl commands without the UI.

```bash
./demo-script.sh
```

## 🏗️ Deployment Notes

### Frontend (Vercel/Netlify)
- **Framework**: Vite
- **Build Command**: \`npm run build\`
- **Output Directory**: \`dist\`
- **Env**: Set \`VITE_API_URL\` to your backend URL

### Backend (Render/Heroku)
- **Build Command**: \`npm install\`
- **Start Command**: \`npm start\`
- **Env**: Set \`DATABASE_URL\`, \`JWT_SECRET\`, \`CORS_ORIGIN\`
