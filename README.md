# iTransfer (iTransfr) - Remittance MVP

A Next.js 14+ application for international money transfers with client and admin portals.

## Features

- **Client Portal**: User registration, KYC submission, wallet management, deposits, swaps, and payouts
- **Admin Console**: KYC review, transaction management, deposit confirmations, swap executions, and payout processing
- **Authentication**: Supabase Auth with role-based access control
- **Database**: PostgreSQL with Prisma ORM
- **UI**: Tailwind CSS with custom component library

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL + Prisma
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **TypeScript**: Full type safety

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)
- Supabase project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd itransfr
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DATABASE_URL=your_postgres_connection_string
```

4. Set up the database:
```bash
# Run the FINAL PROJECT SETUP in Supabase SQL Editor (one time only)
# This creates EVERYTHING: tables, functions, policies, security, and admin user
# Execute: database/FINAL_PROJECT_SETUP.sql
#
# Includes:
# ✅ Production base tables (users, transactions, wallets)
# ✅ Complete onboarding flow (8 steps)
# ✅ Admin authentication system with default admin user
# ✅ AMLBot & Infinitus integrations
# ✅ All security policies and functions
# ✅ Default admin: admin / SecurePass123!
```

5. Run the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Admin Setup

### Admin User Created Automatically

The `FINAL_PROJECT_SETUP.sql` automatically creates the default admin user during setup.

### Admin Login

- **URL**: `/admin-login`
- **Default Credentials**:
  - Username: `admin`
  - Password: `SecurePass123!`

⚠️ **Important**: Change the default password immediately after first login!

### Admin Features

- **Client Management**: View, add, and manage client accounts (`/admin/clients`)
- **KYC Review**: Review and approve/reject KYC applications (`/admin/kyc-review`)
- **Transaction Monitoring**: View and manage all transactions (`/admin/transactions`)
- **Payout Management**: Handle payout requests (`/admin/payouts`)
- **Audit Logs**: Track admin actions and system events

### Admin Security Features

- **Password Hashing**: SHA-256 with salt
- **Account Lockout**: 5 failed attempts = 15-minute lock
- **Session Management**: 24-hour expiry with secure tokens
- **Login Auditing**: All attempts logged with IP/user agent
- **Role-Based Access**: Super admin, admin, compliance officer, support agent roles

## Database Schema

The application uses the following main tables:

- `users` - User accounts with roles (client/admin)
- `wallets` - User currency wallets
- `transactions` - All financial transactions
- `ledger_entries` - Double-entry bookkeeping
- `kyc_status` - KYC verification status
- `fx_orders` - Currency exchange orders
- `payout_requests` - International payout details
- `audit_log` - Admin action tracking

## Project Structure

```
src/
├── app/
│   ├── (public)/          # Public routes (login, signup)
│   ├── (client)/          # Client portal routes
│   ├── (admin)/           # Admin console routes
│   └── api/               # API routes
├── components/
│   ├── ui/               # Reusable UI components
│   ├── layout/           # Layout components
│   └── client|admin/     # Portal-specific components
├── lib/
│   ├── auth/             # Authentication helpers
│   ├── db.ts             # Database connection
│   ├── supabaseClient.ts # Supabase client
│   ├── utils.ts          # Utility functions
│   └── statusEngine.ts   # Transaction status management
└── middleware.ts         # Route protection
```

## Authentication Flow

1. Users sign up with email/password
2. Supabase creates auth user
3. Database trigger creates user record with `pending_kyc` status
4. Users complete KYC to become `active`
5. Role-based middleware protects routes

## Development Roadmap

### Phase 1 (Current) ✅
- Basic project setup with Next.js 14+
- Supabase authentication integration
- Database schema with Prisma
- Basic UI components and layouts
- Client and admin portals with navigation

### Phase 2 (Next Steps)
- Complete status engine implementation
- Ledger service with double-entry bookkeeping
- Integration stubs for AMLBot, Bitso, Infinitus
- Full API route implementations
- Email and PDF generation
- Complete client portal features
- Complete admin console features

### Phase 3 (Future)
- Real integration implementations
- Advanced security features
- Performance optimizations
- Multi-currency support
- Advanced reporting and analytics

## Environment Variables

Required environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database
DATABASE_URL=

# Integrations (for future implementation)
AML_BOT_API_KEY=
BITSO_API_KEY=
BITSO_API_SECRET=
TURNKEY_API_KEY=
INFINITUS_API_KEY=

# Email
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=

# Platform
PDF_BASE_URL=
PLATFORM_BANK_NAME=
PLATFORM_ACCOUNT_NUMBER=
PLATFORM_ROUTING_NUMBER=
PLATFORM_SWIFT_CODE=
PLATFORM_ACCOUNT_NAME=
```

## API Routes

### Client APIs
- `GET /api/me` - User profile and status
- `GET /api/wallets` - User wallets
- `GET /api/transactions` - Transaction history
- `POST /api/kyc/upload` - KYC document upload
- `GET /api/kyc/status` - KYC verification status
- `POST /api/deposits` - Create deposit request
- `POST /api/swaps` - Request currency swap
- `POST /api/payouts` - Request international payout

### Admin APIs
- `GET /api/admin/transactions/list` - List all transactions
- `POST /api/admin/transactions/mark-received` - Confirm deposit
- `POST /api/admin/transactions/execute-swap` - Execute FX swap
- `POST /api/admin/transactions/send-payout` - Process payout
- `GET /api/admin/kyc/list` - List pending KYC
- `POST /api/admin/kyc/approve` - Approve KYC
- `POST /api/admin/kyc/reject` - Reject KYC

## Contributing

1. Create a feature branch
2. Make your changes
3. Run linting: `npm run lint`
4. Test your changes
5. Submit a pull request

## License

This project is part of the iTransfer remittance platform MVP.
