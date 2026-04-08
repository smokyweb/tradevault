const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../db/database');
const { authenticate, JWT_SECRET } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

router.post('/register', (req, res) => {
  const { name, email, password, referralCode } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password too short' });

  const db = getDB();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(400).json({ error: 'Email already registered' });

  const hash = bcrypt.hashSync(password, 10);
  const myReferralCode = uuidv4().slice(0, 8).toUpperCase();

  let referrerId = null;
  if (referralCode) {
    const referrer = db.prepare('SELECT id FROM users WHERE referral_code = ?').get(referralCode);
    if (referrer) referrerId = referrer.id;
  }

  const result = db.prepare(`
    INSERT INTO users (name, email, password, balance, referral_code, referred_by)
    VALUES (?, ?, ?, 10000, ?, ?)
  `).run(name, email, hash, myReferralCode, referrerId);

  const userId = result.lastInsertRowid;

  // Give referral bonus
  if (referrerId) {
    db.prepare('INSERT INTO referrals (referrer_id, referred_id, reward, status) VALUES (?, ?, 50, "paid")').run(referrerId, userId);
    db.prepare('UPDATE users SET balance = balance + 50 WHERE id = ?').run(referrerId);
    db.prepare('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, "referral_bonus", 50, "Referral bonus")').run(referrerId);
    db.prepare('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, "referral_bonus", 25, "Sign-up referral bonus")').run(userId);
    db.prepare('UPDATE users SET balance = balance + 25 WHERE id = ?').run(userId);
  }

  // Seed initial portfolio history
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  db.prepare('INSERT INTO portfolio_history (user_id, value) VALUES (?, ?)').run(userId, user.balance);
  db.prepare('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, "deposit", 10000, "Welcome bonus - demo account funded")').run(userId);

  const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: userId, name, email, balance: user.balance, referralCode: myReferralCode } });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const db = getDB();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, balance: user.balance, referralCode: user.referral_code }
  });
});

router.get('/me', authenticate, (req, res) => {
  const db = getDB();
  const user = db.prepare('SELECT id, name, email, balance, referral_code, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

module.exports = router;
