const router = require('express').Router();
const { getDB } = require('../db/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

const PAYMENT_METHODS = ['bank_transfer', 'crypto', 'card'];

router.get('/transactions', (req, res) => {
  const db = getDB();
  const txs = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.user.id);
  res.json(txs);
});

router.post('/deposit', (req, res) => {
  const { amount, method = 'bank_transfer' } = req.body;
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid deposit amount' });
  }
  if (!PAYMENT_METHODS.includes(method)) {
    return res.status(400).json({ error: 'Invalid payment method' });
  }
  if (amount > 100000) return res.status(400).json({ error: 'Maximum deposit is $100,000' });
  if (amount < 10) return res.status(400).json({ error: 'Minimum deposit is $10' });

  const db = getDB();
  const deposited = parseFloat(amount);

  db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(deposited, req.user.id);

  const methodLabel = { bank_transfer: 'Bank Transfer', crypto: 'Crypto Deposit', card: 'Card Deposit' }[method];
  db.prepare(`
    INSERT INTO transactions (user_id, type, amount, status, description)
    VALUES (?, 'deposit', ?, 'completed', ?)
  `).run(req.user.id, deposited, `${methodLabel} - $${deposited.toFixed(2)}`);

  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);

  // Add portfolio history point
  db.prepare('INSERT INTO portfolio_history (user_id, value) VALUES (?, ?)').run(req.user.id, user.balance);

  res.json({ success: true, deposited, newBalance: user.balance, message: `Successfully deposited $${deposited.toFixed(2)} via ${methodLabel}` });
});

router.post('/withdraw', (req, res) => {
  const { amount, method = 'bank_transfer' } = req.body;
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid withdrawal amount' });
  }

  const db = getDB();
  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
  const withdrawAmount = parseFloat(amount);

  if (withdrawAmount > user.balance) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(withdrawAmount, req.user.id);
  db.prepare(`
    INSERT INTO transactions (user_id, type, amount, status, description)
    VALUES (?, 'withdrawal', ?, 'processing', ?)
  `).run(req.user.id, -withdrawAmount, `Withdrawal - $${withdrawAmount.toFixed(2)} (processing)`);

  const updatedUser = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
  res.json({ success: true, withdrawn: withdrawAmount, newBalance: updatedUser.balance, message: `Withdrawal of $${withdrawAmount.toFixed(2)} is being processed` });
});

module.exports = router;
