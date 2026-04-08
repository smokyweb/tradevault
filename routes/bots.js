const router = require('express').Router();
const { getDB } = require('../db/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

const STRATEGIES = ['MA_CROSSOVER', 'RSI', 'MACD', 'BREAKOUT', 'MEAN_REVERSION', 'MOMENTUM'];
const STRATEGY_LABELS = {
  MA_CROSSOVER: 'Moving Average Crossover',
  RSI: 'RSI Oscillator',
  MACD: 'MACD Divergence',
  BREAKOUT: 'Breakout Strategy',
  MEAN_REVERSION: 'Mean Reversion',
  MOMENTUM: 'Momentum Trading',
};

router.get('/strategies', (req, res) => {
  res.json(STRATEGIES.map(s => ({ id: s, label: STRATEGY_LABELS[s] })));
});

router.get('/', (req, res) => {
  const db = getDB();
  const bots = db.prepare('SELECT * FROM bots WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  // Add simulated live metrics for active bots
  const enriched = bots.map(b => ({
    ...b,
    strategyLabel: STRATEGY_LABELS[b.strategy] || b.strategy,
    last_signal: b.status === 'active' ? (Math.random() > 0.5 ? 'BUY' : 'SELL') : null,
    last_trade_ago: b.status === 'active' ? `${Math.floor(Math.random() * 60)} min ago` : null,
  }));
  res.json(enriched);
});

router.post('/', (req, res) => {
  const { name, strategy, market, symbol, allocation } = req.body;
  if (!name || !strategy || !market || !symbol) {
    return res.status(400).json({ error: 'Name, strategy, market, and symbol are required' });
  }
  if (!STRATEGIES.includes(strategy)) return res.status(400).json({ error: 'Invalid strategy' });

  const db = getDB();
  const alloc = parseFloat(allocation) || 1000;

  const result = db.prepare(`
    INSERT INTO bots (user_id, name, strategy, market, symbol, allocation, status)
    VALUES (?, ?, ?, ?, ?, ?, 'inactive')
  `).run(req.user.id, name, strategy, market, symbol, alloc);

  const bot = db.prepare('SELECT * FROM bots WHERE id = ?').get(result.lastInsertRowid);
  res.json({ ...bot, strategyLabel: STRATEGY_LABELS[bot.strategy] });
});

router.put('/:id', (req, res) => {
  const db = getDB();
  const bot = db.prepare('SELECT * FROM bots WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!bot) return res.status(404).json({ error: 'Bot not found' });

  const { status, name, allocation } = req.body;

  if (status && ['active', 'inactive'].includes(status)) {
    db.prepare('UPDATE bots SET status = ? WHERE id = ?').run(status, bot.id);
  }
  if (name) db.prepare('UPDATE bots SET name = ? WHERE id = ?').run(name, bot.id);
  if (allocation) db.prepare('UPDATE bots SET allocation = ? WHERE id = ?').run(parseFloat(allocation), bot.id);

  // Simulate bot activity: if activating, run a few simulated trades
  if (status === 'active' && bot.status === 'inactive') {
    const pl = (Math.random() - 0.4) * 200;
    db.prepare('UPDATE bots SET profit_loss = profit_loss + ?, trades_count = trades_count + ? WHERE id = ?').run(
      Math.round(pl * 100) / 100, Math.floor(Math.random() * 3) + 1, bot.id
    );
  }

  const updated = db.prepare('SELECT * FROM bots WHERE id = ?').get(bot.id);
  res.json({ ...updated, strategyLabel: STRATEGY_LABELS[updated.strategy] });
});

router.delete('/:id', (req, res) => {
  const db = getDB();
  const bot = db.prepare('SELECT * FROM bots WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!bot) return res.status(404).json({ error: 'Bot not found' });
  db.prepare('DELETE FROM bots WHERE id = ?').run(bot.id);
  res.json({ success: true });
});

// Bot performance history
router.get('/:id/performance', (req, res) => {
  const db = getDB();
  const bot = db.prepare('SELECT * FROM bots WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!bot) return res.status(404).json({ error: 'Bot not found' });

  // Simulate performance history
  const history = [];
  let val = 0;
  for (let i = 29; i >= 0; i--) {
    val += (Math.random() - 0.4) * 50;
    history.push({
      date: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
      pnl: Math.round(val * 100) / 100
    });
  }
  res.json(history);
});

module.exports = router;
