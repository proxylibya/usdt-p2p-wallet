# 🚀 USDT P2P Project - Startup Guide & Analysis Report

## 📋 Project Status: READY for Real Testing
After a deep inspection of your Monorepo (Web + API + Admin), I can confirm the following:

1.  **Architecture**: The project is a correctly structured Monorepo.
    *   **Backend (`apps/api`)**: NestJS + Prisma + PostgreSQL. **Fully connected to real Database.**
    *   **Frontend (`apps/web`)**: React + Vite + Capacitor (Mobile). **configured to use Real API.**
    *   **Admin (`apps/admin`)**: React Dashboard. **Connected to Real API.**

2.  **Database**:
    *   **PostgreSQL** is connected.
    *   **Schema** includes Users, Wallets, P2P, Transactions, Staking, etc.
    *   **Migrations** are applied.
    *   **Seed Data** is injected (Admin User + Demo User).

3.  **Cleanliness**:
    *   Old "Mock Data" (like `WALLETS` array in constants) is present in code but **NOT USED**. The app fetches real data from the backend.
    *   API Clients are configured to point to `http://localhost:3002`.

---

## 🛠️ How to Start (Real Experience)

Since you have PostgreSQL and Prisma installed, follow these exact steps to launch the full system:

### 1. Start the Database & Backend
Open your terminal in `C:\USDT-P2P-PROJECT` and run:

```powershell
# 1. Install dependencies (if not already done)
npm install

# 2. Ensure Database is synced
npm run prisma:migrate:prod -w apps/api

# 3. Seed initial data (Admin & Demo User)
npm run prisma:seed -w apps/api
```

### 2. Run the Full Stack
You can run everything with one command:

```powershell
npm run dev:all
```

This will start:
*   **Backend API**: `http://localhost:3002` (Swagger Docs: `/docs`)
*   **Mobile App (Web)**: `http://localhost:5173`
*   **Admin Dashboard**: `http://localhost:3001`

---

## 📱 Testing the Mobile App
Since this is a wrapped mobile app (Capacitor):
1.  Open Chrome and go to `http://localhost:5173`.
2.  **Press F12** to open Developer Tools.
3.  **Press Ctrl+Shift+M** (or Cmd+Shift+M) to toggle **Device Toolbar**.
4.  Select **iPhone 12 Pro** or **Pixel 5** from the dropdown.
5.  Refresh the page.

**Login Credentials (Seeded):**
*   **Phone**: `218912345678` (Libya)
*   **Password**: `ChangeMe123!`
*   *Or Register a new user (OTP is simulated in dev mode/console).*

## 🔐 Accessing Admin Dashboard
1.  Go to `http://localhost:3001`.
2.  **Email**: `admin@usdt-p2p.local`
3.  **Password**: `000000`

---

## ⚠️ Notes & Recommendations
*   **Real Data**: Any trade, deposit, or P2P offer you create will now be saved to your local PostgreSQL database.
*   **Mobile Build**: To build the actual `.apk` for Android:
    ```powershell
    cd apps/web
    npx cap add android
    npx cap sync
    npx cap open android
    ```
    *(Requires Android Studio)*
