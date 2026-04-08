import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, X } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const SYMBOLS = {
  crypto: ['BTC/USD', 'ETH/USD', 'SOL/USD', 'BNB/USD', 'XRP/USD', 'ADA/USD', 'DOGE/USD'],
  forex: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD'],
  futures: ['ES/USD', 'NQ/USD', 'GC/USD', 'CL/USD', 'SI/USD', 'YM/USD'],
};

export default function Trading() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ market: 'crypto', symbol: 'BTC/USD', type: 'buy', quantity: '', price: '' });
  const [currentPrice, setCurrentPrice] = useState(null);
  const [trades, setTrades] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [tab, setTab] = useState('order');

  const fetchPrice = async () => {
    try {
      const res = await api.get(`/markets/${form.market}`);
      const p = res.data[form.symbol]?.price;
      if (p) { setCurrentPrice(p); if (!form.price) setForm(f => ({ ...f, price: p.toFixed(4) })); }
    } catch {}
  };

  const fetchTrades = async () => {
    const [tradesRes, posRes] = await Promise.all([api.get('/trades'), api.get('/trades/positions')]);
    setTrades(tradesRes.data);
    setPositions(posRes.data);
  };

  useEffect(() => { fetchTrades(); }, []);
  useEffect(() => { fetchPrice(); const i = setInterval(fetchPrice, 3000); return () => clearInterval(i); }, [form.market, form.symbol]);

  const handleMarketChange = (market) => {
    const firstSymbol = SYMBOLS[market][0];
    setForm(f => ({ ...f, market, symbol: firstSymbol, price: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.quantity || !form.price) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.post('/trades', {
        market: form.market,
        symbol: form.symbol,
        type: form.type,
        quantity: parseFloat(form.quantity),
        price: parseFloat(form.price),
      });
      setMessage({ type: 'success', text: `Order filled! ${form.type.toUpperCase()} ${form.quantity} ${form.symbol} @ $${parseFloat(form.price).toLocaleString()}` });
      setForm(f => ({ ...f, quantity: '' }));
      fetchTrades();
      refreshUser();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Order failed' });
    } finally { setLoading(false); }
  };

  const closePosition = async (id) => {
    try {
      const res = await api.delete(`/trades/positions/${id}`);
      setMessage({ type: 'success', text: `Position closed. P&L: ${res.data.pnl >= 0 ? '+' : ''}$${res.data.pnl?.toFixed(2)}` });
      fetchTrades();
      refreshUser();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to close position' });
    }
  };

  const cost = parseFloat(form.quantity) * parseFloat(form.price) || 0;

  return (
    <div className="space-y-6 slide-up">
      <div>
        <h1 className="text-2xl font-black text-white">Trading</h1>
        <p className="text-gray-400 text-sm mt-0.5">Place simulated buy/sell orders across all markets</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Form */}
        <div className="card">
          <h2 className="font-bold text-white mb-4">Place Order</h2>

          {message && (
            <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Market */}
            <div>
              <label className="label">Market</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.keys(SYMBOLS).map(m => (
                  <button key={m} type="button" onClick={() => handleMarketChange(m)}
                    className={`py-2 rounded-lg text-xs font-semibold capitalize transition-all ${form.market === m ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Symbol */}
            <div>
              <label className="label">Symbol</label>
              <select className="input" value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value, price: '' }))}>
                {SYMBOLS[form.market].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Current price */}
            {currentPrice && (
              <div className="bg-gray-900 rounded-lg px-3 py-2 flex justify-between items-center">
                <span className="text-gray-400 text-xs">Market Price</span>
                <span className="text-green-400 font-mono font-semibold text-sm">${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
              </div>
            )}

            {/* Type */}
            <div>
              <label className="label">Order Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setForm(f => ({ ...f, type: 'buy' }))}
                  className={`py-2.5 rounded-lg font-semibold text-sm transition-all ${form.type === 'buy' ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300'}`}>
                  <TrendingUp size={14} className="inline mr-1" /> BUY
                </button>
                <button type="button" onClick={() => setForm(f => ({ ...f, type: 'sell' }))}
                  className={`py-2.5 rounded-lg font-semibold text-sm transition-all ${form.type === 'sell' ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300'}`}>
                  <TrendingDown size={14} className="inline mr-1" /> SELL
                </button>
              </div>
            </div>

            <div>
              <label className="label">Quantity</label>
              <input type="number" className="input" placeholder="0.00" step="0.001" min="0.001"
                value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} required />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="label mb-0">Price (USD)</label>
                {currentPrice && (
                  <button type="button" onClick={() => setForm(f => ({ ...f, price: currentPrice.toFixed(4) }))}
                    className="text-green-400 text-xs hover:underline">Use market price</button>
                )}
              </div>
              <input type="number" className="input" placeholder="0.00" step="0.0001" min="0.0001"
                value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
            </div>

            {cost > 0 && (
              <div className="bg-gray-900 rounded-lg px-3 py-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Order Value</span>
                  <span className="text-white font-semibold">${cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Available Balance</span>
                  <span className={`font-semibold ${user?.balance >= cost ? 'text-green-400' : 'text-red-400'}`}>
                    ${user?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading}
              className={`w-full py-3 rounded-lg font-bold text-white transition-all ${form.type === 'buy' ? 'bg-green-500 hover:bg-green-400' : 'bg-red-500 hover:bg-red-400'}`}>
              {loading ? 'Processing...' : `${form.type === 'buy' ? '▲ BUY' : '▼ SELL'} ${form.symbol}`}
            </button>
          </form>
        </div>

        {/* Positions & History */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex gap-2">
            {['positions', 'history'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                {t === 'positions' ? `Positions (${positions.length})` : 'Order History'}
              </button>
            ))}
          </div>

          {tab === 'positions' && (
            <div className="card p-0 overflow-hidden">
              {positions.length === 0 ? (
                <p className="text-gray-400 p-6 text-center">No open positions</p>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-900 text-gray-400 text-xs">
                    <th className="text-left py-3 px-4">Symbol</th>
                    <th className="text-left py-3 px-4">Side</th>
                    <th className="text-right py-3 px-4">Qty</th>
                    <th className="text-right py-3 px-4">Entry</th>
                    <th className="text-right py-3 px-4">Current</th>
                    <th className="text-right py-3 px-4">P&L</th>
                    <th className="py-3 px-4" />
                  </tr></thead>
                  <tbody>
                    {positions.map(pos => (
                      <tr key={pos.id} className="border-b border-gray-800">
                        <td className="py-3 px-4 font-semibold text-white">{pos.symbol}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${pos.side === 'long' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{pos.side.toUpperCase()}</span>
                        </td>
                        <td className="py-3 px-4 text-right text-gray-300">{pos.quantity}</td>
                        <td className="py-3 px-4 text-right font-mono text-gray-300">${pos.entry_price?.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-mono text-white">${pos.currentPrice?.toLocaleString()}</td>
                        <td className={`py-3 px-4 text-right font-semibold ${pos.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {pos.pnl >= 0 ? '+' : ''}${pos.pnl?.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <button onClick={() => closePosition(pos.id)} className="text-gray-400 hover:text-red-400 transition-colors">
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'history' && (
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-900 text-gray-400 text-xs">
                  <th className="text-left py-3 px-4">Symbol</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-right py-3 px-4">Qty</th>
                  <th className="text-right py-3 px-4">Price</th>
                  <th className="text-right py-3 px-4">P&L</th>
                  <th className="text-right py-3 px-4">Date</th>
                </tr></thead>
                <tbody>
                  {trades.slice(0, 20).map(t => (
                    <tr key={t.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                      <td className="py-3 px-4 font-semibold text-white">{t.symbol}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${t.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{t.type.toUpperCase()}</span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-300">{t.quantity}</td>
                      <td className="py-3 px-4 text-right font-mono text-gray-300">${t.price?.toLocaleString()}</td>
                      <td className={`py-3 px-4 text-right font-semibold ${t.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {t.profit_loss > 0 ? '+' : ''}{t.profit_loss?.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-500 text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
