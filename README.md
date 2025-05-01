# Monday Sage FX

A production-ready SaaS application that augments Monday.com for Sage FX Foundation & Construction.

## 🚀 Features

- Full-stack monorepo with pnpm workspaces and Turborepo
- Next.js 14 frontend with React Server Components
- NestJS backend with TypeScript
- PostgreSQL database with Prisma ORM
- OAuth 2.0 authentication (Monday.com + Google)
- Role-based access control (RBAC)
- SMS automation with Twilio
- PDF generation and storage
- Audit logging
- Mobile-responsive UI with shadcn/ui

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React Server Components, Tailwind CSS, shadcn/ui
- **Backend**: NestJS, TypeScript, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: OAuth 2.0, JWT
- **Messaging**: Twilio Programmable SMS
- **PDF Generation**: @react-pdf/renderer
- **Job Queue**: BullMQ + Redis
- **Testing**: Vitest, Supertest, Playwright
- **Code Quality**: ESLint, Prettier, Husky, commitlint

## 📦 Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.15.3
- PostgreSQL >= 14
- Redis >= 6
- Docker and Docker Compose (optional)

## 🚀 Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/mondaysagefx.git
   cd mondaysagefx
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Copy the environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your credentials:
   - Monday.com OAuth credentials
   - Google OAuth credentials
   - Twilio credentials
   - Database connection string
   - JWT secrets

5. Start the development environment:
   ```bash
   pnpm dev
   ```

## 🏗 Project Structure

```
mondaysagefx/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # NestJS backend
├── packages/
│   ├── config/       # Shared configuration
│   ├── database/     # Prisma schema and client
│   ├── ui/           # Shared UI components
│   └── utils/        # Shared utilities
├── docker/           # Docker configuration
└── docs/            # Documentation
```

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Database Schema](./docs/database.md)
- [Authentication Flow](./docs/auth.md)
- [Deployment Guide](./docs/deployment.md)

## 🧪 Testing

Run the test suite:
```bash
pnpm test
```

Run end-to-end tests:
```bash
pnpm test:e2e
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 