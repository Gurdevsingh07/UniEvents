# Deployment Guide — University Event Management System

## Table of Contents
1. [Deploy with Docker (VPS/EC2)](#1-deploy-with-docker-vpsec2)
2. [Backend on Railway](#2-backend-on-railway)
3. [Backend on Render](#3-backend-on-render)
4. [Frontend on Vercel](#4-frontend-on-vercel)
5. [Frontend on Netlify](#5-frontend-on-netlify)
6. [MySQL Hosting](#6-mysql-hosting)
7. [Production Configuration](#7-production-configuration)

---

## 1. Deploy with Docker (VPS/EC2)

### On AWS EC2 / DigitalOcean / Any VPS:

```bash
# 1. SSH into your server
ssh user@your-server-ip

# 2. Install Docker & Docker Compose
sudo apt update && sudo apt install -y docker.io docker-compose

# 3. Clone/upload project
git clone <your-repo-url>
cd university-event-management-system

# 4. Configure environment
cp .env.example .env
nano .env  # Edit with production values

# 5. Start all services
docker-compose up -d --build

# 6. Verify
docker-compose ps
curl http://localhost:8080/api/events
```

Your app will be live at `http://your-server-ip`.

---

## 2. Backend on Railway

1. Push backend code to a GitHub repository
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select your repo, point to the `backend/` directory
4. Add a **MySQL** service from Railway's Add-ons
5. Set environment variables:
   - `DB_URL` = Railway MySQL connection URL (convert to JDBC format)
   - `DB_USERNAME` = from Railway MySQL
   - `DB_PASSWORD` = from Railway MySQL
   - `JWT_SECRET` = your secret key
   - `CORS_ORIGINS` = your frontend URL
6. Railway auto-detects the `pom.xml` and builds with Maven
7. Note the generated URL (e.g., `https://your-app.up.railway.app`)

---

## 3. Backend on Render

1. Push to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo, set:
   - **Root Directory**: `backend`
   - **Build Command**: `mvn clean package -DskipTests`
   - **Start Command**: `java -jar target/*.jar`
   - **Environment**: `Java`
4. Add environment variables (same as Railway above)
5. Deploy — Render provides a URL like `https://your-app.onrender.com`

---

## 4. Frontend on Vercel

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Navigate to frontend
cd frontend

# 3. Set environment variable
# Create .env.production:
echo "VITE_API_URL=https://your-backend-url.com" > .env.production

# 4. Deploy
vercel --prod
```

Or via Vercel Dashboard:
1. Import your Git repo
2. Set **Root Directory** to `frontend`
3. Set **Framework Preset** to Vite
4. Add environment variable: `VITE_API_URL` = your backend URL
5. Deploy

---

## 5. Frontend on Netlify

1. Go to [netlify.com](https://netlify.com) → Add New Site → Import from Git
2. Set:
   - **Base Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `frontend/dist`
3. Add environment variable: `VITE_API_URL` = your backend URL
4. Add `_redirects` file to `frontend/public/`:
   ```
   /*    /index.html   200
   ```
5. Deploy

---

## 6. MySQL Hosting

### Option A: PlanetScale (Free Tier)
1. Create account at [planetscale.com](https://planetscale.com)
2. Create a database → get connection string
3. Convert to JDBC format: `jdbc:mysql://host:port/dbname?sslMode=VERIFY_IDENTITY`

### Option B: Railway MySQL
1. Add MySQL service in Railway dashboard
2. Use the provided credentials

### Option C: AWS RDS
1. Create MySQL RDS instance
2. Configure security group to allow your backend IP
3. Use the endpoint as `DB_URL`

### Option D: Docker on VPS
Already included in `docker-compose.yml`

---

## 7. Production Configuration

### Backend CORS Setup
In production, update `CORS_ORIGINS` to only allow your frontend domain:
```
CORS_ORIGINS=https://your-frontend-domain.vercel.app
```

### JWT Secret
Generate a strong secret for production:
```bash
openssl rand -base64 64
```

### Environment Variables Checklist
| Variable | Description |
|----------|-------------|
| `DB_URL` | JDBC MySQL connection string |
| `DB_USERNAME` | Database username |
| `DB_PASSWORD` | Database password |
| `JWT_SECRET` | JWT signing key (256+ bits) |
| `JWT_EXPIRATION` | Token expiry in ms (default: 86400000 = 24h) |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins |
| `VITE_API_URL` | Backend base URL (frontend) |

### SSL/HTTPS
For production, use a reverse proxy (Nginx/Caddy) with Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```
