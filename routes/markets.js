const router = require('express').Router();

// Base prices with some volatility simulation
const basePrices = {
  forex: {
    'EUR/USD': { price: 1.0882, change: 0.0015, pct: 0.14 },
    'GBP/USD': { price: 1.2645, change: -0.0028, pct: -0.22 },
    'USD/JPY': { price: 149.85, change: 0.45, pct: 0.30 },
    'USD/CHF': { price: 0.9045, change: 0.0008, pct: 0.09 },
    'AUD/USD': { price: 0.6523, change: -0.0012, pct: -0.18 },
    'USD/CAD': { price: 1.3612, change: 0.0022, pct: 0.16 },
    'NZD/USD': { price: 0.6045, change: 0.0008, pct: 0.13 },
    'EUR/GBP': { price: 0.8605, change: 0.0005, pct: 0.06 },
    'EUR/JPY': { price: 163.20, change: 0.65, pct: 0.40 },
    'GBP/JPY': { price: 189.45, change: -0.35, pct: -0.18 },
  },
  crypto: {
    'BTC/USD': { price: 43250.00, change: 850.00, pct: 2.01 },
    'ETH/USD': { price: 2345.00, change: 45.00, pct: 1.96 },
    'SOL/USD': { price: 104.50, change: 3.20, pct: 3.16 },
    'BNB/USD': { price: 385.00, change: -8.50, pct: -2.16 },
    'XRP/USD': { price: 0.5425, change: 0.0215, pct: 4.12 },
    'ADA/USD': { price: 0.4820, change: -0.0120, pct: -2.43 },
    'DOGE/USD': { price: 0.0825, change: 0.0045, pct: 5.77 },
    'AVAX/USD': { price: 34.50, change: 1.20, pct: 3.60 },
    'DOT/USD': { price: 7.85, change: -0.25, pct: -3.09 },
    'LINK/USD': { price: 14.25, change: 0.85, pct: 6.35 },
  },
  futures: {
    'ES/USD': { price: 4885.00, change: 22.50, pct: 0.46 },
    'NQ/USD': { price: 17420.00, change: 145.00, pct: 0.84 },
    'GC/USD': { price: 2025.50, change: 8.30, pct: 0.41 },
    'CL/USD': { price: 78.45, change: -1.25, pct: -1.57 },
    'SI/USD': { price: 22.85, change: 0.45, pct: 2.01 },
    'ZB/USD': { price: 118.25, change: -0.65, pct: -0.55 },
    'YM/USD': { price: 38250.00, change: 180.00, pct: 0.47 },
    'RTY/USD': { price: 1985.50, change: -12.50, pct: -0.63 },
  }
};

// Add random walk to prices
function randomizePrice(base, volatility = 0.001) {
  const factor = 1 + (Math.random() - 0.5) * volatility * 2;
  return Math.round(base * factor * 10000) / 10000;
}

function getMarketData() {
  const result = {};
  for (const [market, pairs] of Object.entries(basePrices)) {
    result[market] = {};
    for (const [symbol, data] of Object.entries(pairs)) {
      const vol = market === 'crypto' ? 0.003 : market === 'futures' ? 0.002 : 0.0005;
      const newPrice = randomizePrice(data.price, vol);
      const change = newPrice - data.price;
      result[market][symbol] = {
        symbol,
        price: newPrice,
        change: Math.round(change * 10000) / 10000,
        pct: Math.round((change / data.price) * 10000) / 100,
        high24h: Math.round(data.price * 1.015 * 10000) / 10000,
        low24h: Math.round(data.price * 0.985 * 10000) / 10000,
        volume: Math.round(Math.random() * 1000000 + 500000),
      };
    }
  }
  return result;
}

router.get('/', (req, res) => {
  res.json(getMarketData());
});

router.get('/forex', (req, res) => {
  res.json(getMarketData().forex);
});

router.get('/crypto', (req, res) => {
  res.json(getMarketData().crypto);
});

router.get('/futures', (req, res) => {
  res.json(getMarketData().futures);
});

// Price history for charts (last 50 candles)
router.get('/history/:symbol', (req, res) => {
  const symbol = decodeURIComponent(req.params.symbol);
  let basePrice = 1.0882;
  
  // Find base price
  for (const market of Object.values(basePrices)) {
    if (market[symbol]) { basePrice = market[symbol].price; break; }
  }

  const candles = [];
  let price = basePrice * 0.95;
  for (let i = 49; i >= 0; i--) {
    const open = price;
    const change = (Math.random() - 0.48) * basePrice * 0.008;
    const close = open + change;
    const high = Math.max(open, close) * (1 + Math.random() * 0.003);
    const low = Math.min(open, close) * (1 - Math.random() * 0.003);
    const time = new Date(Date.now() - i * 3600000).toISOString();
    candles.push({ time, open: Math.round(open*10000)/10000, high: Math.round(high*10000)/10000, low: Math.round(low*10000)/10000, close: Math.round(close*10000)/10000 });
    price = close;
  }
  res.json(candles);
});

module.exports = router;
