# 🚀 UniEvents – Deployment Guide

> Deploy the frontend on **Vercel** and the backend on **Render**.

---

## Architecture Overview

```
┌──────────────────────┐         ┌───────────────────────┐
│   Vercel (Frontend)  │────────▶│   Render (Backend)    │
│   React / Vite SPA   │  HTTPS  │   Spring Boot API     │
│                      │◀────────│                       │
│   vercel.json        │  JSON   │   PostgreSQL (Render)  │
│   rewrites /api/*    │         │   Managed Database     │
└──────────────────────┘         └───────────────────────┘
```

---

## Prerequisites

- A **GitHub** account with this repository pushed.
- A [Vercel](https://vercel.com) account (free tier is fine).
- A [Render](https://render.com) account (free tier is fine).

---

## Step 1: Deploy Backend on Render

### Option A: One-Click Blueprint (Recommended)

1. Push this codebase to your GitHub repository.
2. Go to [Render Blueprints](https://dashboard.render.com/blueprints).
3. Click **New Blueprint Instance**.
4. Connect your GitHub repository.
5. Render will detect `render.yaml` and automatically create:
   - A **Web Service** (your Spring Boot backend)
   - A **PostgreSQL Database**
6. Wait for the build to complete (~5-10 minutes on first deploy).

### Option B: Manual Setup

#### 1. Create a PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **PostgreSQL**.
2. Set:
   - **Name**: `unievents-db`
   - **Database**: `unievents`
   - **User**: `unievents_user`
   - **Region**: Oregon (or your closest)
   - **Plan**: Free
3. Click **Create Database**.
4. Once created, copy the **Internal Database URL** from the database info page.

#### 2. Create the Web Service

1. Go to **New** → **Web Service**.
2. Connect your GitHub repository.
3. Configure:
   - **Name**: `unievents-backend`
   - **Region**: Same as your database
   - **Runtime**: Docker
   - **Dockerfile Path**: `./backend/Dockerfile`
   - **Docker Context**: `./backend`
   - **Plan**: Free
4. Add these **Environment Variables**:

| Key              | Value                                              |
|------------------|----------------------------------------------------|
| `PORT`           | `8080`                                             |
| `DB_URL`         | `jdbc:postgresql://<host>:<port>/<dbname>` (from DB info) |
| `DB_DRIVER`      | `org.postgresql.Driver`                            |
| `JPA_DIALECT`    | `org.hibernate.dialect.PostgreSQLDialect`          |
| `DB_USERNAME`    | (from database info page)                          |
| `DB_PASSWORD`    | (from database info page)                          |
| `HIBERNATE_DDL`  | `update`                                           |
| `JWT_SECRET`     | (click **Generate** to create a random 64-char key)|
| `CORS_ORIGINS`   | `https://uni-events-swart.vercel.app`              |
| `H2_CONSOLE_ENABLED` | `false`                                       |

> **Important**: The `DB_URL` from Render looks like `postgres://user:pass@host/dbname`.
> You need to convert it to JDBC format: `jdbc:postgresql://host:port/dbname`

5. Click **Create Web Service** and wait for the first deploy.

---

## Step 2: Deploy Frontend on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → **Add New** → **Project**.
2. Import your GitHub repository.
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add this **Environment Variable**:

| Key              | Value                                              |
|------------------|----------------------------------------------------|
| `VITE_API_URL`   | `https://unievents-1sv4.onrender.com` (your Render URL) |

5. Click **Deploy**.

---

## Step 3: Verify the Deployment

1. Open your Vercel URL: `https://uni-events-swart.vercel.app`
2. Try logging in or registering.
3. Open the browser **Developer Tools** (F12) → **Network** tab.
4. Verify that API calls to `/api/auth/login` return a **200** status (not 404 or CORS error).

### Troubleshooting

| Problem                        | Solution                                           |
|--------------------------------|----------------------------------------------------|
| `404` on API calls             | Check that `vercel.json` rewrites point to correct Render URL |
| CORS errors                    | Verify `CORS_ORIGINS` env var on Render matches your Vercel domain exactly |
| Backend is sleeping (slow)     | Render free tier sleeps after 15 min. First request takes ~30s to wake up. |
| Database connection error      | Verify `DB_URL` is in JDBC format: `jdbc:postgresql://...` not `postgres://...` |
| Build fails on Render          | Check the build logs. Ensure `Dockerfile` is at `./backend/Dockerfile` |

---

## Environment Variable Reference

### Backend (Render)

| Variable             | Required | Description                                |
|----------------------|----------|--------------------------------------------|
| `PORT`               | Yes      | Server port (Render sets this automatically) |
| `DB_URL`             | Yes      | JDBC PostgreSQL connection string           |
| `DB_DRIVER`          | Yes      | `org.postgresql.Driver`                    |
| `JPA_DIALECT`        | Yes      | `org.hibernate.dialect.PostgreSQLDialect`  |
| `DB_USERNAME`        | Yes      | Database username                          |
| `DB_PASSWORD`        | Yes      | Database password                          |
| `JWT_SECRET`         | Yes      | Random 64+ character string               |
| `CORS_ORIGINS`       | Yes      | Comma-separated allowed origins            |
| `HIBERNATE_DDL`      | No       | Default: `update`                          |
| `H2_CONSOLE_ENABLED` | No       | Default: `false`                           |

### Frontend (Vercel)

| Variable        | Required | Description                        |
|-----------------|----------|------------------------------------|
| `VITE_API_URL`  | Yes      | Backend URL (e.g., `https://unievents-1sv4.onrender.com`) |

---

## Local Development

For local development, no changes needed! The app falls back to:
- **H2** file-based database (no setup required)
- **localhost:5173** → proxy to **localhost:8080** via Vite config

```bash
# Terminal 1: Start backend
cd backend
./mvnw spring-boot:run

# Terminal 2: Start frontend
cd frontend
npm run dev:client
```
