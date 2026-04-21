# 🏢 HRMS Enterprise

A comprehensive, enterprise-level Human Resource Management System built with modern web technologies. This full-stack application provides complete HR lifecycle management with multi-tenant architecture, role-based access control, and advanced features for employee management, payroll, attendance, performance reviews, and more.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.3.1-blue.svg)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Database Setup](#-database-setup)
- [Running the Application](#-running-the-application)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [User Roles & Permissions](#-user-roles--permissions)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 👥 **Employee Management**
- Complete employee lifecycle (onboarding → exit)
- Employee profiles with personal, professional, and banking details
- Experience and education history tracking
- Bulk employee import via Excel/CSV
- Employee insights and analytics
- Custom roles and permissions

### 📅 **Attendance & Leave Management**
- Clock in/out with location tracking
- Attendance regularization requests
- Multiple leave types with configurable quotas
- Leave balance tracking and carry-forward
- Multi-level approval workflows
- Work From Home (WFH) requests

### 💰 **Payroll & Compensation**
- Flexible salary structure configuration
- Automated payroll processing
- Salary revision history tracking
- Payslip generation
- PF, ESIC, TDS calculations
- Bonus, deductions, and adjustments

### 📊 **Performance Management**
- Performance review cycles (Probation, Quarterly, Annual)
- Self-appraisal and manager ratings
- Goal tracking and achievements
- 360-degree feedback support

### 💵 **Expense Management**
- Reimbursement claims with receipt upload
- Travel expense management
- Approval workflows
- Expense policy enforcement

### 📄 **Document Management**
- Employee document upload and storage
- HR document generation (Offer Letter, Appointment Letter, etc.)
- Document templates with dynamic fields
- Secure document access control

### 🎯 **Onboarding & Offboarding**
- Customizable onboarding checklists
- Task assignment and tracking
- New hire portal
- Exit formalities management

### 📢 **Communication & Engagement**
- Company-wide announcements
- Priority-based notifications
- Pulse surveys for employee engagement
- Team mood tracking

### 🏢 **Organization Management**
- Multi-tenant architecture (Platform Admin)
- Department and designation management
- Holiday calendar
- Asset tracking and assignment
- Organization settings and branding

### 📈 **Reports & Analytics**
- Dashboard with key metrics
- Headcount and attrition reports
- Attendance and leave analytics
- Payroll summaries
- Custom report generation
- Export to Excel/PDF

### 🔐 **Security & Compliance**
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Custom role creation with granular permissions
- Audit logs for all critical actions
- Rate limiting and security headers
- Data encryption

---

## 🛠 Tech Stack

### **Backend**
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Cache**: Redis (optional)
- **Authentication**: JWT (jsonwebtoken)
- **Email**: Resend API
- **File Upload**: Multer
- **Validation**: Zod
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Winston, Morgan

### **Frontend**
- **Framework**: React 18.3
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: TanStack Query (React Query)
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI
- **Icons**: Heroicons
- **Forms**: Native HTML5 + Custom Validation
- **Notifications**: React Hot Toast
- **Date Handling**: date-fns

### **DevOps**
- **Containerization**: Docker (optional)
- **Database Migrations**: Prisma Migrate
- **Environment Management**: dotenv

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **Redis** (optional, for caching) - [Download](https://redis.io/download)
- **Git** - [Download](https://git-scm.com/)
- **npm** or **yarn** package manager

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd hrms_entroprise_level
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

---

## ⚙️ Configuration

### Backend Configuration

1. **Create Environment File**

```bash
cd backend
cp .env.example .env
```

2. **Configure Environment Variables**

Edit `backend/.env` with your settings:

```env
# ─── Database ─────────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://username:password@localhost:5432/hrms_db?sslmode=prefer

# ─── Server ───────────────────────────────────────────────────────────────────
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# ─── Redis (Optional) ─────────────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ─── JWT ──────────────────────────────────────────────────────────────────────
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ─── Email (Resend) ───────────────────────────────────────────────────────────
RESEND_API_KEY=re_your_resend_api_key_here
EMAIL_FROM=HRMS <noreply@yourcompany.com>
FRONTEND_URL=http://localhost:3000
COMPANY_NAME=Your Company Name
```

### Frontend Configuration

The frontend uses environment variables for API configuration. Create `frontend/.env` (optional):

```env
VITE_API_URL=http://localhost:3001/api
```

If not set, it defaults to `/api` (relative path).

---

## 🗄️ Database Setup

### 1. Create PostgreSQL Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE hrms_db;

# Create user (optional)
CREATE USER hrms_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE hrms_db TO hrms_user;

# Exit
\q
```

### 2. Run Prisma Migrations

```bash
cd backend

# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations (for production)
npm run db:migrate
```

### 3. Seed Initial Data

```bash
npm run db:seed
```

This will create:
- **Platform Admin** account (for multi-tenant setup)
- Sample organization
- Default permissions
- Sample employees and data

**Default Credentials:**
- **Platform Admin**: `platform@admin.com` / `Admin@123`
- **Super Admin**: `admin@company.com` / `Admin@123`
- **HR**: `hr@company.com` / `Hr@123`
- **Manager**: `manager@company.com` / `Manager@123`
- **Employee**: `employee@company.com` / `Employee@123`

---

## 🏃 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend runs on: `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on: `http://localhost:3000`

### Production Mode

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

### Database Tools

**Prisma Studio** (Database GUI):
```bash
cd backend
npm run db:studio
```
Opens at: `http://localhost:5555`

---

## 📁 Project Structure

```
hrms_entroprise_level/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   └── seed.js                # Seed data
│   ├── src/
│   │   ├── config/                # Configuration files
│   │   ├── middlewares/           # Auth, RBAC, validation
│   │   ├── modules/               # Feature modules
│   │   │   ├── auth/
│   │   │   ├── employees/
│   │   │   ├── leaves/
│   │   │   ├── attendance/
│   │   │   ├── payroll/
│   │   │   ├── performance/
│   │   │   ├── documents/
│   │   │   ├── announcements/
│   │   │   ├── assets/
│   │   │   ├── pulse/
│   │   │   └── ... (24 modules total)
│   │   └── app.js                 # Express app setup
│   ├── uploads/                   # File uploads
│   ├── logs/                      # Application logs
│   ├── .env.example               # Environment template
│   ├── package.json
│   └── server.js                  # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── api/                   # API client
│   │   ├── components/            # Reusable components
│   │   │   └── common/
│   │   ├── contexts/              # React contexts (Auth)
│   │   ├── layouts/               # Layout components
│   │   ├── pages/                 # Page components
│   │   │   ├── dashboard/
│   │   │   ├── employees/
│   │   │   ├── leaves/
│   │   │   ├── attendance/
│   │   │   ├── payroll/
│   │   │   ├── announcements/
│   │   │   ├── assets/
│   │   │   ├── pulse/
│   │   │   └── ... (21 pages total)
│   │   ├── utils/                 # Utility functions
│   │   ├── App.jsx                # Main app component
│   │   └── main.jsx               # Entry point
│   ├── public/                    # Static assets
│   ├── package.json
│   └── vite.config.js
│
├── HRMS.postman_collection.json   # API collection
└── README.md                      # This file
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication
All protected endpoints require JWT token in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

### Multi-Tenant Header
For organization-specific requests:
```
X-Org-Id: <organisation_id>
```

### Available Endpoints

#### **Authentication**
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/change-password` - Change password

#### **Employees**
- `GET /api/employees` - List all employees
- `GET /api/employees/:id` - Get employee details
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee
- `POST /api/employees/import/preview` - Preview import
- `POST /api/employees/import/execute` - Execute import

#### **Leaves**
- `GET /api/leaves` - List leave applications
- `POST /api/leaves/apply` - Apply for leave
- `PATCH /api/leaves/:id/approve` - Approve leave
- `PATCH /api/leaves/:id/reject` - Reject leave
- `GET /api/leaves/balance` - Get leave balance
- `GET /api/leaves/types` - Get leave types

#### **Attendance**
- `POST /api/attendance/clock-in` - Clock in
- `POST /api/attendance/clock-out` - Clock out
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance/regularize` - Request regularization

#### **Payroll**
- `GET /api/payroll` - List payroll records
- `POST /api/payroll/process` - Process payroll
- `GET /api/payroll/my-payslips` - Get my payslips
- `GET /api/payroll/salary-structure/:empId` - Get salary structure

#### **Announcements**
- `GET /api/announcements` - List announcements
- `POST /api/announcements` - Create announcement
- `PUT /api/announcements/:id` - Update announcement
- `DELETE /api/announcements/:id` - Delete announcement

#### **Assets**
- `GET /api/assets` - List assets
- `POST /api/assets` - Create asset
- `PATCH /api/assets/:id/assign` - Assign asset
- `GET /api/assets/my` - Get my assets

#### **Pulse Survey**
- `GET /api/pulse` - List surveys
- `POST /api/pulse` - Create survey
- `POST /api/pulse/:id/respond` - Submit response
- `GET /api/pulse/:id/results` - Get results

#### **Audit Logs**
- `GET /api/audit-logs` - List audit logs
- `GET /api/audit-logs/modules` - Get available modules

**Full API Documentation**: Import `HRMS.postman_collection.json` into Postman

---

## 👤 User Roles & Permissions

### Role Hierarchy

1. **PLATFORM_ADMIN** - Super user for multi-tenant management
2. **SUPER_ADMIN** - Full organization control
3. **ADMIN** - Administrative access
4. **HR** - HR operations
5. **FINANCE** - Payroll and finance
6. **MANAGER** - Team management
7. **EMPLOYEE** - Basic access
8. **INTERN** - Limited access

### Custom Roles
Admins can create custom roles with granular permissions for specific modules and actions.

---

## 🚢 Deployment

### Using Docker (Recommended)

#### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+

#### Quick Start

1. **Copy environment file**
```bash
cp .env.docker.example .env
```

2. **Configure environment variables**
Edit `.env` and set:
- Strong JWT secrets (min 32 characters)
- Database credentials
- Email service credentials (Resend API key)
- Company details

3. **Start all services**
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database (port 5432)
- Redis cache (port 6379)
- Backend API (port 3001)
- Frontend app (port 3000)

4. **Check service status**
```bash
docker-compose ps
```

5. **View logs**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

6. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Health: http://localhost:3001/health

#### Development Mode

For development with hot reload:

```bash
# Set NODE_ENV to development
export NODE_ENV=development

# Start services
docker-compose up -d

# Backend will run with nodemon
# Frontend will run with Vite dev server
```

#### Production Mode

```bash
# Set NODE_ENV to production
export NODE_ENV=production

# Build and start
docker-compose up -d --build

# Frontend will be served via Nginx
# Backend will run with Node.js
```

#### Database Management

```bash
# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Seed database
docker-compose exec backend npx prisma db seed

# Open Prisma Studio
docker-compose exec backend npx prisma studio
```

#### Useful Commands

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v

# Rebuild services
docker-compose up -d --build

# Scale services
docker-compose up -d --scale backend=3

# Execute commands in containers
docker-compose exec backend sh
docker-compose exec postgres psql -U hrms_user -d hrms_db
```

#### Troubleshooting

**Port conflicts:**
```bash
# Change ports in .env file
POSTGRES_PORT=5433
BACKEND_PORT=3002
FRONTEND_PORT=3001
```

**Database connection issues:**
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Verify database is ready
docker-compose exec postgres pg_isready -U hrms_user
```

**Reset everything:**
```bash
docker-compose down -v
docker-compose up -d --build
```

### Manual Deployment

#### Backend (Node.js)

1. Set `NODE_ENV=production` in `.env`
2. Build and start:
```bash
cd backend
npm install --production
npm start
```

#### Frontend (Static Build)

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Serve the `dist` folder using:
   - Nginx
   - Apache
   - Vercel
   - Netlify
   - AWS S3 + CloudFront

#### Database

- Use managed PostgreSQL (AWS RDS, DigitalOcean, Supabase)
- Run migrations: `npm run db:migrate`
- Enable SSL connections

#### Environment Variables

Ensure all production environment variables are set:
- Strong JWT secrets
- Production database URL
- Email service credentials
- CORS origin (frontend URL)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- Built with ❤️ using modern web technologies
- Icons by [Heroicons](https://heroicons.com/)
- UI components inspired by [Tailwind UI](https://tailwindui.com/)

---

## 📞 Support

For support, email support@yourcompany.com or open an issue in the repository.

---

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Integration with third-party HR tools
- [ ] AI-powered resume screening
- [ ] Biometric attendance integration
- [ ] Multi-language support

---

**Made with ❤️ for modern HR teams**
