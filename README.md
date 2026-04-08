# TradeVault 🏦

**Demo Fintech Automated Trading-as-a-Service Platform**

> ⚠️ This is a **demo application** — no real money is used or at risk. All trading is simulated.

## 🎮 Demo Credentials

| Email | Password |
|-------|----------|
| `demo@tradevault.com` | `Demo@1234` |

## Features

- **Multi-Market Trading** — Forex, Crypto, and Futures with simulated live prices
- **Algorithmic Trading Bots** — MA Crossover, RSI, MACD, Breakout, Mean Reversion, Momentum
- **Real-time Markets** — Prices update every 3 seconds across 28+ pairs
- **Portfolio Dashboard** — P&L charts, position tracking, performance analytics
- **Referral System** — Earn $50 per referred trader (demo rewards)
- **Funding** — Deposit/withdraw demo funds via Bank Transfer, Crypto, or Card
- **JWT Authentication** — Secure login/signup with bcrypt password hashing

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + Recharts
- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **Auth**: JWT (7-day expiry) + bcrypt

## Getting Started

```bash
# Install dependencies
npm install
cd client && npm install && cd ..

# Development
npm run dev          # Backend (port 3000)
cd client && npm run dev  # Frontend (port 5173, proxies to backend)

# Production build
npm run build
npm start
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `JWT_SECRET` | `tradevault-super-secret-key-2024` | JWT signing key |
| `DATA_DIR` | `./data` | SQLite database directory |
| `BASE_URL` | `https://fintech.bluesapps.com` | Referral link base URL |

## Docker

```bash
docker build -t tradevault .
docker run -p 3000:3000 -v $(pwd)/data:/app/data tradevault
```

## Database

SQLite database at `/app/data/tradevault.db` (in Docker) or `./data/tradevault.db` (local).

On first startup, demo data is automatically seeded:
- 3 demo users
- 8 trade history records
- 3 open positions
- 4 trading bots
- Transaction history
- 30-day portfolio history chart data

## Demo Account Details

The `demo@tradevault.com` account comes pre-loaded with:
- **$25,430.50** balance
- Active trading bots (BTC MA Bot, EUR RSI Bot, Gold Breakout)
- Open positions in BTC, ETH, EUR/USD
- 2 referred users and $100 in referral earnings
- 30 days of portfolio history
