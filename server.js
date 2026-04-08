const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const { initDB } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize DB
initDB();

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/portfolio', require('./routes/portfolio'));
app.use('/api/markets', require('./routes/markets'));
app.use('/api/trades', require('./routes/trades'));
app.use('/api/bots', require('./routes/bots'));
app.use('/api/funding', require('./routes/funding'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/api/profile', require('./routes/profile'));

// Serve React build
const clientBuild = path.join(__dirname, 'client', 'dist');
app.use(express.static(clientBuild));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuild, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 TradeVault server running on port ${PORT}`);
});
