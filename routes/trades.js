const router = require('express').Router();
const { getDB } = require('../db/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Get trade history
router.get('/', (req, res) => {
  const db = getDB();
  const trades = db.prepare(`
    SELECT * FROM trades WHERE user_id = ? ORDER BY created_at DESC LIMIT 100
  `).all(req.user.id);
  res.json(trades);
});

// Get open positions
router.get('/positions', (req, res) => {
  const db = getDB();
  const positions = db.prepare('SELECT * FROM positions WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  const withPL = positions.map(p => {
    const drift = (Math.random() - 0.45) * p.entry_price * 0.015;
    const currentPrice = p.entry_price + drift;
    const pl = p.side === 'long'
      ? (currentPrice - p.entry_price) * p.quantity
      : (p.entry_price - currentPrice) * p.quantity;
    return { ...p, currentPrice: Math.round(currentPrice * 10000) / 10000, pnl: Math.round(pl * 100) / 100, pnlPct: Math.round((pl / (p.entry_price * p.quantity)) * 10000) / 100 };
  });
  res.json(withPL);
});

// Place a trade
router.post('/', (req, res) => {
  const { market, symbol, type, quantity, price } = req.body;
  if (!market || !symbol || !type || !quantity || !price) {
    return res.status(400).json({ error: 'All fields required' });
  }
  if (!['buy', 'sell'].includes(type)) return res.status(400).json({ error: 'Invalid type' });
  if (quantity <= 0 || price <= 0) return res.status(400).json({ error: 'Invalid quantity or price' });

  const db = getDB();
  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
  const cost = quantity * price;

  if (type === 'buy' && user.balance < cost) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  // Simulate slight slippage
  const slippage = (Math.random() - 0.5) * price * 0.0005;
  const executedPrice = Math.round((price + slippage) * 10000) / 10000;
  const executedCost = quantity * executedPrice;

  // Record trade
  const trade = db.prepare(`
    INSERT INTO trades (user_id, market, symbol, type, quantity, price, status, profit_loss)
    VALUES (?, ?, ?, ?, ?, ?, 'filled', 0)
  `).run(req.user.id, market, symbol, type, quantity, executedPrice);

  if (type === 'buy') {
    // Deduct balance and open position
    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(executedCost, req.user.id);
    db.prepare(`
      INSERT INTO positions (user_id, market, symbol, side, quantity, entry_price)
      VALUES (?, ?, ?, 'long', ?, ?)
    `).run(req.user.id, market, symbol, quantity, executedPrice);
    db.prepare('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, "trade", ?, ?)').run(req.user.id, -executedCost, `Buy ${quantity} ${symbol} @ ${executedPrice}`);
  } else {
    // Close matching position if exists, or open short
    const pos = db.prepare('SELECT * FROM positions WHERE user_id = ? AND symbol = ? AND side = "long" LIMIT 1').get(req.user.id, symbol);
    let pnl = 0;
    if (pos) {
      pnl = (executedPrice - pos.entry_price) * Math.min(quantity, pos.quantity);
      db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(executedCost + pnl, req.user.id);
      db.prepare('UPDATE trades SET profit_loss = ? WHERE id = ?').run(Math.round(pnl * 100) / 100, trade.lastInsertRowid);
      if (quantity >= pos.quantity) {
        db.prepare('DELETE FROM positions WHERE id = ?').run(pos.id);
      } else {
        db.prepare('UPDATE positions SET quantity = quantity - ? WHERE id = ?').run(quantity, pos.id);
      }
      db.prepare('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, "trade", ?, ?)').run(req.user.id, pnl, `Sell ${quantity} ${symbol} @ ${executedPrice} (P&L: ${pnl > 0 ? '+' : ''}${Math.round(pnl*100)/100})`);
    } else {
      // Short position
      db.prepare(`INSERT INTO positions (user_id, market, symbol, side, quantity, entry_price) VALUES (?, ?, ?, 'short', ?, ?)`).run(req.user.id, market, symbol, quantity, executedPrice);
    }
  }

  // Add portfolio history point
  const updatedUser = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
  db.prepare('INSERT INTO portfolio_history (user_id, value) VALUES (?, ?)').run(req.user.id, updatedUser.balance);

  const updatedTrade = db.prepare('SELECT * FROM trades WHERE id = ?').get(trade.lastInsertRowid);
  res.json({ success: true, trade: updatedTrade, newBalance: updatedUser.balance });
});

// Close position
router.delete('/positions/:id', (req, res) => {
  const db = getDB();
  const pos = db.prepare('SELECT * FROM positions WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!pos) return res.status(404).json({ error: 'Position not found' });

  const drift = (Math.random() - 0.45) * pos.entry_price * 0.015;
  const closePrice = pos.entry_price + drift;
  const pnl = pos.side === 'long'
    ? (closePrice - pos.entry_price) * pos.quantity
    : (pos.entry_price - closePrice) * pos.quantity;

  const proceeds = pos.quantity * closePrice;
  db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(proceeds, req.user.id);
  db.prepare(`INSERT INTO trades (user_id, market, symbol, type, quantity, price, close_price, status, profit_loss) VALUES (?, ?, ?, ?, ?, ?, ?, 'filled', ?)`).run(req.user.id, pos.market, pos.symbol, pos.side === 'long' ? 'sell' : 'buy', pos.quantity, pos.entry_price, Math.round(closePrice * 10000) / 10000, Math.round(pnl * 100) / 100);
  db.prepare('DELETE FROM positions WHERE id = ?').run(pos.id);
  db.prepare('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, "trade", ?, ?)').run(req.user.id, Math.round(pnl * 100) / 100, `Close ${pos.symbol} position`);

  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
  res.json({ success: true, pnl: Math.round(pnl * 100) / 100, newBalance: user.balance });
});

module.exports = router;
