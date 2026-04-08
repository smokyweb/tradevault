const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'tradevault.db');
let db;

function getDB() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDB() {
  const db = getDB();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      balance REAL DEFAULT 10000.00,
      referral_code TEXT UNIQUE,
      referred_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      market TEXT NOT NULL,
      symbol TEXT NOT NULL,
      type TEXT NOT NULL,
      quantity REAL NOT NULL,
      price REAL NOT NULL,
      close_price REAL,
      status TEXT DEFAULT 'filled',
      profit_loss REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      market TEXT NOT NULL,
      symbol TEXT NOT NULL,
      side TEXT NOT NULL,
      quantity REAL NOT NULL,
      entry_price REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS bots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      strategy TEXT NOT NULL,
      market TEXT NOT NULL,
      symbol TEXT NOT NULL,
      allocation REAL DEFAULT 1000.00,
      status TEXT DEFAULT 'inactive',
      profit_loss REAL DEFAULT 0,
      trades_count INTEGER DEFAULT 0,
      win_rate REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'completed',
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS referrals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      referrer_id INTEGER NOT NULL,
      referred_id INTEGER NOT NULL,
      reward REAL DEFAULT 50.00,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (referrer_id) REFERENCES users(id),
      FOREIGN KEY (referred_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS portfolio_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      value REAL NOT NULL,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  seedData(db);
  console.log('✅ Database initialized');
}

function seedData(db) {
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM users').get();
  if (existing.cnt > 0) return;

  const hash = bcrypt.hashSync('Demo@1234', 10);
  const { v4: uuidv4 } = require('uuid');

  // Create demo users
  const demoRef = uuidv4().slice(0, 8).toUpperCase();
  const user1 = db.prepare(`
    INSERT INTO users (name, email, password, balance, referral_code)
    VALUES (?, ?, ?, ?, ?)
  `).run('Demo User', 'demo@tradevault.com', hash, 25430.50, demoRef);

  const user2 = db.prepare(`
    INSERT INTO users (name, email, password, balance, referral_code, referred_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('Alice Trader', 'alice@tradevault.com', hash, 18200.00, uuidv4().slice(0, 8).toUpperCase(), user1.lastInsertRowid);

  const user3 = db.prepare(`
    INSERT INTO users (name, email, password, balance, referral_code, referred_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('Bob Investor', 'bob@tradevault.com', hash, 32100.00, uuidv4().slice(0, 8).toUpperCase(), user1.lastInsertRowid);

  const userId = user1.lastInsertRowid;

  // Seed trades for demo user
  const trades = [
    [userId, 'crypto', 'BTC/USD', 'buy', 0.15, 42500, 44200, 'filled', 255.00],
    [userId, 'crypto', 'ETH/USD', 'buy', 2.5, 2280, 2350, 'filled', 175.00],
    [userId, 'forex', 'EUR/USD', 'buy', 10000, 1.0850, 1.0920, 'filled', 70.00],
    [userId, 'forex', 'GBP/USD', 'sell', 5000, 1.2680, 1.2610, 'filled', 35.00],
    [userId, 'futures', 'ES/USD', 'buy', 1, 4820, 4890, 'filled', 3500.00],
    [userId, 'crypto', 'SOL/USD', 'buy', 20, 98.50, 105.20, 'filled', 134.00],
    [userId, 'forex', 'USD/JPY', 'sell', 10000, 149.50, 148.80, 'filled', 46.80],
    [userId, 'crypto', 'BTC/USD', 'sell', 0.1, 45800, 45800, 'filled', 0],
  ];

  const insertTrade = db.prepare(`
    INSERT INTO trades (user_id, market, symbol, type, quantity, price, close_price, status, profit_loss, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' days'))
  `);

  trades.forEach((t, i) => {
    insertTrade.run(...t, i + 1);
  });

  // Seed open positions
  const insertPos = db.prepare(`
    INSERT INTO positions (user_id, market, symbol, side, quantity, entry_price, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' hours'))
  `);
  insertPos.run(userId, 'crypto', 'BTC/USD', 'long', 0.25, 43100, 5);
  insertPos.run(userId, 'crypto', 'ETH/USD', 'long', 3.0, 2290, 12);
  insertPos.run(userId, 'forex', 'EUR/USD', 'long', 15000, 1.0870, 2);

  // Seed bots
  const insertBot = db.prepare(`
    INSERT INTO bots (user_id, name, strategy, market, symbol, allocation, status, profit_loss, trades_count, win_rate, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' days'))
  `);
  insertBot.run(userId, 'BTC MA Bot', 'MA_CROSSOVER', 'crypto', 'BTC/USD', 2000, 'active', 480.50, 24, 62.5, 14);
  insertBot.run(userId, 'EUR RSI Bot', 'RSI', 'forex', 'EUR/USD', 1500, 'active', 215.30, 18, 55.6, 10);
  insertBot.run(userId, 'ETH MACD Bot', 'MACD', 'crypto', 'ETH/USD', 1000, 'inactive', -85.20, 12, 41.7, 7);
  insertBot.run(userId, 'Gold Breakout', 'BREAKOUT', 'futures', 'GC/USD', 3000, 'active', 920.00, 31, 71.0, 21);

  // Seed transactions
  const insertTx = db.prepare(`
    INSERT INTO transactions (user_id, type, amount, status, description, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now', '-' || ? || ' days'))
  `);
  insertTx.run(userId, 'deposit', 10000, 'completed', 'Initial deposit', 30);
  insertTx.run(userId, 'deposit', 5000, 'completed', 'Bank transfer deposit', 20);
  insertTx.run(userId, 'referral_bonus', 50, 'completed', 'Referral bonus - Alice Trader', 15);
  insertTx.run(userId, 'deposit', 5000, 'completed', 'Crypto deposit', 10);
  insertTx.run(userId, 'referral_bonus', 50, 'completed', 'Referral bonus - Bob Investor', 5);
  insertTx.run(userId, 'trade', 480.50, 'completed', 'Bot trading profits', 3);
  insertTx.run(userId, 'deposit', 5000, 'completed', 'Bank transfer deposit', 1);

  // Seed referrals
  const insertRef = db.prepare(`
    INSERT INTO referrals (referrer_id, referred_id, reward, status, created_at)
    VALUES (?, ?, ?, ?, datetime('now', '-' || ? || ' days'))
  `);
  insertRef.run(userId, user2.lastInsertRowid, 50, 'paid', 15);
  insertRef.run(userId, user3.lastInsertRowid, 50, 'paid', 5);

  // Seed portfolio history (30 days)
  const insertHistory = db.prepare(`
    INSERT INTO portfolio_history (user_id, value, recorded_at)
    VALUES (?, ?, datetime('now', '-' || ? || ' days'))
  `);
  let val = 10000;
  for (let i = 29; i >= 0; i--) {
    val += (Math.random() - 0.4) * 300;
    val = Math.max(val, 8000);
    insertHistory.run(userId, Math.round(val * 100) / 100, i);
  }
  insertHistory.run(userId, 25430.50, 0);

  console.log('✅ Demo data seeded');
}

module.exports = { getDB, initDB };
