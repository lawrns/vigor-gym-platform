# GoGym API - Database Setup and API Implementation

This document provides setup instructions for the GoGym gym management platform database and API implementation.

## Overview

The API implements a complete membership management system with:
- Companies and member management
- Subscription plans and memberships
- Gym locations and visit tracking
- Class booking system
- Billing and payment tracking
- Audit logging

## Database Schema

The database uses PostgreSQL with the following main entities:
- **Companies**: Business entities that manage members
- **Members**: Individual users with gym memberships
- **Plans**: Subscription plans (TP ON, TP PRO, TP+)
- **Memberships**: Active subscriptions linking members to plans
- **Gyms**: Physical gym locations
- **Visits**: Check-in/check-out records
- **Classes**: Scheduled fitness classes
- **Bookings**: Class reservations
- **Invoices**: Billing records
- **Payments**: Payment transactions
- **AuditLogs**: System activity tracking

## Setup Instructions

### 1. Environment Configuration

1. Copy the `.env.local` file and update the database password:
   ```bash
   # In apps/api/.env.local, replace [YOUR_PASSWORD] with your Supabase database password
   DATABASE_URL="postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.rsyngqfzbwlzawrtvunt.supabase.co:5432/postgres"
   ```

2. Get your Supabase database password:
   - Go to your Supabase project dashboard
   - Navigate to Settings > Database
   - Copy the connection string and extract the password

### 2. Database Migration

1. Generate Prisma client:
   ```bash
   npm run db:generate
   ```

2. Run database migrations:
   ```bash
   npm run db:migrate
   ```

3. Seed the database with initial data:
   ```bash
   npm run db:seed
   ```

### 3. Development Server

Start the API server:
```bash
npm run dev
```

The API will be available at `http://localhost:4001`

## API Endpoints

### Members
- `GET /v1/members?companyId={uuid}` - List members for a company
- `POST /v1/members` - Create a new member
- `PATCH /v1/members/:id` - Update member details

### Plans
- `GET /v1/plans` - List all available plans

### Memberships
- `POST /v1/memberships` - Create a new membership

### KPI Overview
- `GET /v1/kpi/overview` - Get key performance indicators

### Health Check
- `GET /health` - API health status

## Database Commands

- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data
- `npm run db:reset` - Reset database (WARNING: destroys all data)
- `npm run db:studio` - Open Prisma Studio for database management

## Seed Data

The seed script creates:
- 1 demo company: "Empresa Demo"
- 3 subscription plans: TP ON, TP PRO, TP+
- 5 sample members
- 2 sample gym locations

## Rollback Strategy

To rollback database changes:

1. **Soft rollback** (recommended):
   ```bash
   npm run db:reset
   npm run db:migrate
   npm run db:seed
   ```

2. **Hard rollback** (if needed):
   - Use Supabase dashboard to restore from backup
   - Or manually drop tables and re-run migrations

## Security Notes

- JWT authentication is implemented as placeholder for development
- Use environment variables for all sensitive configuration
- Never commit actual passwords or API keys to version control
- The service role key should only be used server-side

## Troubleshooting

### Database Connection Issues
1. Verify DATABASE_URL is correct
2. Check Supabase project is active
3. Ensure database password is correct

### Migration Failures
1. Check database connectivity
2. Verify Prisma schema syntax
3. Review migration logs for specific errors

### Seed Failures
1. Ensure migrations have run successfully
2. Check for unique constraint violations
3. Verify all required environment variables are set

## Production Deployment

For production deployment:
1. Update environment variables in `.env.production`
2. Use connection pooling for better performance
3. Enable SSL for database connections
4. Implement proper JWT authentication
5. Add rate limiting and security middleware
