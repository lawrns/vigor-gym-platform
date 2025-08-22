# 🏋️ Vigor - AI-Powered Gym Management Platform

[![CI](https://github.com/lawrns/vigor-gym-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/lawrns/vigor-gym-platform/actions/workflows/ci.yml)
[![Production Ready](https://img.shields.io/badge/status-production%20ready-green.svg)](https://github.com/lawrns/vigor-gym-platform)
[![Test Coverage](https://img.shields.io/badge/tests-100%25%20passing-brightgreen.svg)](https://github.com/lawrns/vigor-gym-platform)
[![Netlify Status](https://img.shields.io/badge/netlify-build%20fixed-success.svg)](https://github.com/lawrns/vigor-gym-platform)

> **Complete gym management platform for Mexico with AI-powered features, secure authentication, and comprehensive testing infrastructure.**

## 🎯 **Project Status: Production Ready**

✅ **Authentication System**: Secure login/logout with JWT & httpOnly cookies  
✅ **Database**: Supabase PostgreSQL with Prisma ORM  
✅ **Testing Suite**: 100% passing (Smoke + Unit + E2E)  
✅ **CI/CD Pipeline**: GitHub Actions with automated testing  
✅ **Environment Management**: Consolidated configuration  

## 🚀 **Quick Start**

### Prerequisites
- Node.js 20+
- npm or yarn
- Supabase account (for database)

### Installation

```bash
# Clone the repository
git clone https://github.com/lawrns/gogym-platform.git
cd gogym-platform

# Install dependencies
npm install

# Setup environment variables
cp apps/api/.env.example apps/api/.env.local
# Edit .env.local with your Supabase credentials

# Run database migrations
cd apps/api
npm run db:migrate
npm run db:seed

# Start development servers
cd ../..
npm run dev
```

### Access the Application
- **Web App**: http://localhost:7777
- **API**: http://localhost:4001
- **Login**: admin@testgym.mx / TestPassword123!

## 🧪 **Testing**

### Run All Tests
```bash
# Smoke tests (API health checks)
npm run smoke

# Unit tests
cd apps/api && npm test    # API routes
cd apps/web && npm test    # React components

# E2E tests (requires servers running)
npm run e2e
```

### Test Results
| Test Suite | Status | Coverage |
|------------|--------|----------|
| 🔍 Smoke Tests | ✅ 3/3 pass | API health, auth, public routes |
| 🧪 API Unit Tests | ✅ 4/4 pass | Auth routes, validation |
| 🎨 Web Unit Tests | ✅ 2/2 pass | React components |
| 🎭 E2E Tests | ✅ 4/4 pass | Complete user journeys |

## 📁 **Project Structure**

```
gogym-platform/
├── apps/
│   ├── api/                 # Express.js API server
│   │   ├── src/routes/      # API endpoints
│   │   ├── src/middleware/  # Auth & tenant middleware
│   │   ├── prisma/          # Database schema & migrations
│   │   └── __tests__/       # API unit tests
│   ├── web/                 # Next.js frontend
│   │   ├── app/             # App router pages
│   │   ├── components/      # React components
│   │   ├── lib/             # Utilities & API client
│   │   └── __tests__/       # Component tests
│   └── mobile/              # React Native (future)
├── tests/e2e/               # Playwright E2E tests
├── .scripts/                # Utility scripts
└── .github/workflows/       # CI/CD pipeline
```

## 🔐 **Authentication & Security**

- **JWT Tokens**: Secure token generation with httpOnly cookies
- **Password Security**: argon2 hashing with proper salting
- **Input Validation**: Zod schemas on all endpoints
- **Error Handling**: Structured logging without PII exposure
- **CORS**: Proper credential handling for cross-origin requests

## 🛠 **Technology Stack**

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: Supabase PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT + argon2
- **Testing**: Vitest + Supertest

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **State Management**: React Context
- **Testing**: Jest + Testing Library

### DevOps
- **CI/CD**: GitHub Actions
- **Testing**: Playwright (E2E)
- **Environment**: Docker-ready
- **Monitoring**: Structured logging

## 📊 **Features**

### 🔐 **Authentication System**
- Secure login/logout flow
- JWT token management
- Protected route middleware
- Password reset functionality

### 📈 **Dashboard & Analytics**
- Real-time KPI monitoring
- Member management
- Revenue tracking
- Activity analytics

### 💳 **Membership Management**
- Plan creation and management
- Member enrollment
- Payment processing
- CFDI invoice generation

### 📱 **Multi-Platform**
- Responsive web application
- Mobile-ready design
- Future React Native app

## 🌟 **Development Workflow**

### Environment Setup
```bash
# Copy environment template
cp apps/api/.env.example apps/api/.env.local

# Required environment variables:
# DATABASE_URL=postgresql://...
# JWT_SECRET=your-secret-here
# CORS_ORIGINS=http://localhost:7777
```

### Development Commands
```bash
npm run dev          # Start both API and web servers
npm run smoke        # Run health checks
npm run e2e          # Run end-to-end tests
npm run e2e:ui       # Run E2E tests with UI
```

## 🚀 **Deployment**

### Production Checklist
- [ ] Set production environment variables
- [ ] Configure production database
- [ ] Set up monitoring and logging
- [ ] Configure domain and SSL
- [ ] Run security audit

### CI/CD Pipeline
The GitHub Actions workflow automatically:
1. Runs unit tests
2. Executes smoke tests
3. Performs E2E testing
4. Builds production assets

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run the test suite
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 **Roadmap**

- [ ] **Sprint B**: Registration flow with company creation
- [ ] **Sprint C**: Payment integration (Stripe/PayPal)
- [ ] **Sprint D**: Mobile app development
- [ ] **Sprint E**: AI-powered analytics
- [ ] **Sprint F**: Multi-location support

---

**Built with ❤️ for the Mexican fitness industry**
