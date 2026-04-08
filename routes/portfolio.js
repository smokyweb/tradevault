const router = require('express').Router();
const { getDB } = require('../db/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', (req, res) => {
  const db = getDB();
  const user = db.prepare('SELECT id, name, email, balance, created_at FROM users WHERE id = ?').get(req.user.id);
  const positions = db.prepare('SELECT * FROM positions WHERE user_id = ?').all(req.user.id);
  const trades = db.prepare('SELECT SUM(profit_loss) as total FROM trades WHERE user_id = ? AND status = "filled"').get(req.user.id);
  const totalPL = trades?.total || 0;

  // Calculate open P&L with simulated current prices
  const openPL = positions.reduce((sum, pos) => {
    const drift = (Math.random() - 0.45) * pos.entry_price * 0.02;
    const currentPrice = pos.entry_price + drift;
    const pl = pos.side === 'long'
      ? (currentPrice - pos.entry_price) * pos.quantity
      : (pos.entry_price - currentPrice) * pos.quantity;
    return sum + pl;
  }, 0);

  const portfolioValue = user.balance + openPL;

  res.json({
    balance: user.balance,
    portfolioValue: Math.round(portfolioValue * 100) / 100,
    totalPL: Math.round((totalPL + openPL) * 100) / 100,
    openPL: Math.round(openPL * 100) / 100,
    realizedPL: Math.round(totalPL * 100) / 100,
    positionsCount: positions.length,
    positions: positions.map(p => {
      const drift = (Math.random() - 0.45) * p.entry_price * 0.02;
      const currentPrice = p.entry_price + drift;
      const pl = p.side === 'long'
        ? (currentPrice - p.entry_price) * p.quantity
        : (p.entry_price - currentPrice) * p.quantity;
      return { ...p, currentPrice: Math.round(currentPrice * 10000) / 10000, pnl: Math.round(pl * 100) / 100 };
    })
  });
});

router.get('/history', (req, res) => {
  const db = getDB();
  const history = db.prepare(`
    SELECT value, recorded_at FROM portfolio_history 
    WHERE user_id = ? ORDER BY recorded_at ASC LIMIT 90
  `).all(req.user.id);
  res.json(history);
});

router.get('/stats', (req, res) => {
  const db = getDB();
  const tradesTotal = db.prepare('SELECT COUNT(*) as cnt FROM trades WHERE user_id = ?').get(req.user.id);
  const profitable = db.prepare('SELECT COUNT(*) as cnt FROM trades WHERE user_id = ? AND profit_loss > 0').get(req.user.id);
  const activeBots = db.prepare('SELECT COUNT(*) as cnt FROM bots WHERE user_id = ? AND status = "active"').get(req.user.id);
  const totalDeposited = db.prepare('SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = "deposit"').get(req.user.id);
  const referralEarnings = db.prepare('SELECT SUM(reward) as total FROM referrals WHERE referrer_id = ? AND status = "paid"').get(req.user.id);

  res.json({
    totalTrades: tradesTotal?.cnt || 0,
    winRate: tradesTotal?.cnt > 0 ? Math.round((profitable?.cnt / tradesTotal?.cnt) * 100) : 0,
    activeBots: activeBots?.cnt || 0,
    totalDeposited: totalDeposited?.total || 0,
    referralEarnings: referralEarnings?.total || 0,
  });
});

module.exports = router;
