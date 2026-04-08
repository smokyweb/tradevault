const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { getDB } = require('../db/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', (req, res) => {
  const db = getDB();
  const user = db.prepare('SELECT id, name, email, balance, referral_code, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

router.put('/', (req, res) => {
  const { name, email } = req.body;
  const db = getDB();

  if (email) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, req.user.id);
    if (existing) return res.status(400).json({ error: 'Email already in use' });
  }

  if (name) db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, req.user.id);
  if (email) db.prepare('UPDATE users SET email = ? WHERE id = ?').run(email, req.user.id);

  const user = db.prepare('SELECT id, name, email, balance, referral_code, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

router.put('/password', (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'New password too short' });

  const db = getDB();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  if (!bcrypt.compareSync(currentPassword, user.password)) {
    return res.status(401).json({ error: 'Current password incorrect' });
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, req.user.id);
  res.json({ success: true, message: 'Password updated successfully' });
});

module.exports = router;
