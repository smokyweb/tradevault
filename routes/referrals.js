const router = require('express').Router();
const { getDB } = require('../db/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', (req, res) => {
  const db = getDB();
  const user = db.prepare('SELECT referral_code FROM users WHERE id = ?').get(req.user.id);
  const referrals = db.prepare(`
    SELECT r.*, u.name as referred_name, u.email as referred_email, u.created_at as joined_at
    FROM referrals r
    JOIN users u ON u.id = r.referred_id
    WHERE r.referrer_id = ?
    ORDER BY r.created_at DESC
  `).all(req.user.id);

  const totalEarned = referrals.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.reward, 0);
  const pending = referrals.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.reward, 0);

  const baseUrl = process.env.BASE_URL || 'https://fintech.bluesapps.com';
  const referralLink = `${baseUrl}/signup?ref=${user.referral_code}`;

  res.json({
    referralCode: user.referral_code,
    referralLink,
    referrals,
    stats: {
      total: referrals.length,
      paid: referrals.filter(r => r.status === 'paid').length,
      pending: referrals.filter(r => r.status === 'pending').length,
      totalEarned,
      pendingEarnings: pending,
      rewardPerReferral: 50,
    }
  });
});

module.exports = router;
