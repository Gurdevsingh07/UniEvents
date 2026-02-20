# University Event Management System

A complete production-ready full-stack web application for automating student event registration, QR code attendance tracking, and report generation at universities.

## 🚀 Quick Start

### Prerequisites
- Java 17+
- Node.js 18+
- MySQL 8.0+
- Docker (optional)

### Option 1: Docker (Recommended)
```bash
# Clone and start all services
cp .env.example .env
docker-compose up --build
```
- Frontend: http://localhost
- Backend API: http://localhost:8080
- Swagger: http://localhost:8080/swagger-ui.html

### Option 2: Manual Setup

**1. Database**
```bash
mysql -u root -p < schema.sql
```

**2. Backend**
```bash
cd backend
mvn spring-boot:run
```

**3. Frontend**
```bash
cd frontend
npm install
npm run dev
```

## 🔑 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@university.edu | Admin@123 |
| Organizer | organizer@university.edu | Organizer@123 |
| Student | student@university.edu | Student@123 |

## 📁 Project Structure
```
├── backend/                    # Spring Boot API
│   └── src/main/java/com/university/eventmanagement/
│       ├── controller/         # REST controllers
│       ├── service/            # Business logic
│       ├── repository/         # Data access
│       ├── model/              # JPA entities
│       ├── dto/                # Data transfer objects
│       ├── security/           # JWT + Spring Security
│       ├── config/             # Swagger, data seeder
│       └── exception/          # Global error handling
├── frontend/                   # React + Vite + MUI
│   └── src/
│       ├── pages/              # Page components
│       ├── components/         # Shared components
│       ├── context/            # Auth context
│       └── api/                # Axios config
├── docker-compose.yml
├── schema.sql
└── DEPLOYMENT.md
```

## ✨ Features
- **Role-Based Access**: Admin, Organizer, Student dashboards
- **QR Code Attendance**: Instant scan-based check-in
- **Real-time Dashboard**: Live attendance stats
- **Report Export**: PDF, CSV, Excel downloads
- **JWT Authentication**: Secure API access
- **Responsive UI**: Works on mobile & desktop
