# Project Policy (Monorepo) — USDT-P2P-PROJECT

## 1) Official Project Identity

- Official project root (single source of truth): `C:\USDT-P2P-PROJECT`
- Monorepo structure:
  - Frontend (React + TypeScript + Vite + Capacitor): `C:\USDT-P2P-PROJECT\apps\web`
  - Backend (NestJS + TypeScript + Prisma): `C:\USDT-P2P-PROJECT\apps\api`

## 2) Strict Rules (Must Follow)

### 2.1 Database Rules

- Allowed:
  - PostgreSQL 15+ (primary database)
  - Prisma ORM 5+ (database access)
  - Redis 7+ (optional for dev)
- Strictly forbidden:
  - SQLite
  - MySQL
  - MongoDB
  - JSON files as a database

### 2.2 Connection Rules

- Real integration only:
  - No mock data in production
  - No hardcoded data replacing real DB/API flows
- Backend must stay:
  - NestJS connected to PostgreSQL
  - Prisma is the only DB access layer

### 2.3 UI/Design Rules

- Do not change the current design without explicit approval.
- Mobile-first, full RTL support, and current dark theme must remain.
- Do not remove/replace existing UI components.
- Do not add new UI libraries without a clear necessity.

### 2.4 Security Rules

- JWT authentication is required.
- Password hashing must use `bcrypt` (salt rounds 12+).
- Rate limiting and input validation are required.
- CORS must be restricted to allowed origins.
- Forbidden:
  - Storing API keys in source code
  - Disabling CORS in production
  - Writing direct SQL queries (use Prisma)

### 2.5 Testing Rules

- Required: unit + integration + e2e for critical flows.
- Forbidden: shipping without tests, deleting existing tests, disabling CI checks.

### 2.6 Code Rules

- TypeScript strict mode.
- ESLint + Prettier.
- Meaningful naming.
- Avoid `any` except for critical necessity.
- No `console.log` in production.
- No unused imports/vars.

## 3) Runtime / Environments

### 3.1 Local Development Ports

- Frontend: `3001` (example)
- Backend: `3002`
- PostgreSQL: `5432`
- Redis: `6379` (optional)
- Backend docs: `http://localhost:3002/docs`

### 3.2 Environment Files

- Frontend env: `apps/web/.env`
  - `VITE_API_URL=http://localhost:3002/api/v1`
- Backend env: `apps/api/.env`
  - `DATABASE_URL="postgresql://..."`

## 4) Monorepo Commands (Root Level)

Run commands from: `C:\USDT-P2P-PROJECT`

- Install dependencies (workspaces):
  - `npm install`
- Start frontend + backend together:
  - `npm run dev`
- Start only one service:
  - `npm run dev:web`
  - `npm run dev:api`

### Prisma (Local PostgreSQL, No Docker)

- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:migrate:prod`
- `npm run prisma:studio`
- `npm run prisma:seed`

## 5) Hard Constraints / Notes

- Docker is not allowed for local development on this machine.
- The project must work with a locally installed PostgreSQL instance.
- Any references to legacy project paths are considered invalid; only the monorepo paths above are valid.
