# 🚀 USDT Wallet Backend

Enterprise-grade Backend API for USDT Wallet Mobile Application.

## 📋 Tech Stack

- **Framework:** NestJS 10
- **Language:** TypeScript 5
- **Database:** PostgreSQL 16
- **Cache:** Redis 7
- **ORM:** Prisma 5
- **Auth:** JWT + Refresh Tokens
- **Docs:** Swagger/OpenAPI

## 🏗️ Architecture

```
src/
├── api/                    # API Layer (Controllers, DTOs)
│   ├── auth/              # Authentication
│   ├── users/             # User Management
│   ├── wallets/           # Wallet Operations
│   ├── p2p/               # P2P Trading
│   ├── market/            # Market Data
│   ├── notifications/     # Notifications
│   └── health/            # Health Check
├── infrastructure/         # Infrastructure Layer
│   ├── database/          # Prisma Service
│   └── cache/             # Redis Service
└── shared/                # Shared utilities
```

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 22+
- Docker & Docker Compose

### 2. Setup

```bash
# Clone and install
cd usdt-wallet-backend
npm install

# Start database services
docker-compose up -d

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Start development server
npm run start:dev
```

### 3. Access

- **API:** http://localhost:3001/api/v1
- **Swagger Docs:** http://localhost:3001/docs
- **Health Check:** http://localhost:3001/api/v1/health

## 📁 Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start:prod` | Start production server |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run prisma:migrate` | Run database migrations |
| `npm run docker:up` | Start Docker services |
| `npm run docker:down` | Stop Docker services |

## 🔐 API Endpoints

### Auth
- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Request login OTP
- `POST /api/v1/auth/verify-otp` - Verify OTP
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/profile` - Get profile

### Wallets
- `GET /api/v1/wallets` - Get user wallets
- `POST /api/v1/wallets/transfer` - Internal transfer
- `GET /api/v1/wallets/transactions` - Transaction history

### P2P
- `GET /api/v1/p2p/offers` - List offers
- `POST /api/v1/p2p/offers` - Create offer
- `POST /api/v1/p2p/trades` - Start trade
- `POST /api/v1/p2p/trades/:id/confirm-payment` - Confirm payment
- `POST /api/v1/p2p/trades/:id/release` - Release crypto

### Market
- `GET /api/v1/market/coins` - Get market data
- `GET /api/v1/market/prices` - Get live prices

## 🔒 Environment Variables

See `.env.example` for all available configuration options.

## 📜 License

MIT
