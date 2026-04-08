import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Bot, Plus, Play, Pause, Trash2, TrendingUp, Activity } from 'lucide-react';
import api from '../lib/api';

const MARKETS = ['crypto', 'forex', 'futures'];
const SYMBOLS = {
  crypto: ['BTC/USD', 'ETH/USD', 'SOL/USD', 'BNB/USD'],
  forex: ['EUR/USD', 'GBP/USD', 'USD/JPY'],
  futures: ['ES/USD', 'NQ/USD', 'GC/USD'],
};

export default function Bots() {
  const [bots, setBots] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [creating, setCreating] = useState(false);
  const [selectedBot, setSelectedBot] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [form, setForm] = useState({ name: '', strategy: '', market: 'crypto', symbol: 'BTC/USD', allocation: 1000 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchBots = async () => {
    const res = await api.get('/bots');
    setBots(res.data);
  };

  useEffect(() => {
    fetchBots();
    api.get('/bots/strategies').then(r => setStrategies(r.data));
  }, []);

  useEffect(() => {
    if (selectedBot) {
      api.get(`/bots/${selectedBot.id}/performance`).then(r => setPerformance(r.data));
    }
  }, [selectedBot]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await api.post('/bots', form);
      setCreating(false);
      setForm({ name: '', strategy: '', market: 'crypto', symbol: 'BTC/USD', allocation: 1000 });
      fetchBots();
      setMessage({ type: 'success', text: 'Bot created successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to create bot' });
    } finally { setLoading(false); }
  };

  const toggleBot = async (bot) => {
    const newStatus = bot.status === 'active' ? 'inactive' : 'active';
    await api.put(`/bots/${bot.id}`, { status: newStatus });
    fetchBots();
    if (selectedBot?.id === bot.id) setSelectedBot({ ...selectedBot, status: newStatus });
  };

  const deleteBot = async (id) => {
    if (!confirm('Delete this bot?')) return;
    await api.delete(`/bots/${id}`);
    if (selectedBot?.id === id) setSelectedBot(null);
    fetchBots();
  };

  const totalPL = bots.reduce((sum, b) => sum + (b.profit_loss || 0), 0);
  const activeBots = bots.filter(b => b.status === 'active').length;

  return (
    <div className="space-y-6 slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Trading Bots</h1>
          <p className="text-gray-400 text-sm mt-0.5">Automate your strategy with algorithmic trading bots</p>
        </div>
        <button onClick={() => setCreating(!creating)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Bot
        </button>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
          {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-gray-400 text-sm">Total Bots</p>
          <p className="text-2xl font-black text-white">{bots.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-gray-400 text-sm">Active</p>
          <p className="text-2xl font-black text-green-400">{activeBots}</p>
        </div>
        <div className="stat-card">
          <p className="text-gray-400 text-sm">Total Bot P&L</p>
          <p className={`text-2xl font-black ${totalPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalPL >= 0 ? '+' : ''}${totalPL.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Create Bot Form */}
      {creating && (
        <div className="card border-green-500/30">
          <h2 className="font-bold text-white mb-4 flex items-center gap-2"><Bot size={18} className="text-green-400" /> Create New Bot</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Bot Name</label>
              <input className="input" placeholder="My Awesome Bot" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Strategy</label>
              <select className="input" value={form.strategy} onChange={e => setForm(f => ({ ...f, strategy: e.target.value }))} required>
                <option value="">Select strategy...</option>
                {strategies.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Market</label>
              <select className="input" value={form.market} onChange={e => setForm(f => ({ ...f, market: e.target.value, symbol: SYMBOLS[e.target.value][0] }))}>
                {MARKETS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Symbol</label>
              <select className="input" value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))}>
                {SYMBOLS[form.market].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Allocation ($)</label>
              <input type="number" className="input" min="100" max="50000" value={form.allocation} onChange={e => setForm(f => ({ ...f, allocation: e.target.value }))} />
            </div>
            <div className="flex items-end gap-3">
              <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Creating...' : 'Create Bot'}</button>
              <button type="button" onClick={() => setCreating(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bots List */}
        <div className="lg:col-span-2 space-y-3">
          {bots.length === 0 ? (
            <div className="card text-center py-12">
              <Bot size={48} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No bots yet. Create your first trading bot!</p>
            </div>
          ) : bots.map(bot => (
            <div
              key={bot.id}
              onClick={() => setSelectedBot(bot)}
              className={`card cursor-pointer transition-all hover:border-green-500/40 ${selectedBot?.id === bot.id ? 'border-green-500/50' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bot.status === 'active' ? 'bg-green-500/20' : 'bg-gray-700'}`}>
                    <Bot size={20} className={bot.status === 'active' ? 'text-green-400' : 'text-gray-400'} />
                  </div>
                  <div>
                    <p className="font-bold text-white">{bot.name}</p>
                    <p className="text-xs text-gray-400">{bot.strategyLabel} · {bot.symbol}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={bot.status === 'active' ? 'badge-active' : 'badge-inactive'}>
                    {bot.status === 'active' ? '● ACTIVE' : '○ INACTIVE'}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); toggleBot(bot); }}
                    className={`p-1.5 rounded-lg transition-all ${bot.status === 'active' ? 'text-yellow-400 hover:bg-yellow-500/10' : 'text-green-400 hover:bg-green-500/10'}`}>
                    {bot.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteBot(bot.id); }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 mt-3 pt-3 border-t border-gray-700">
                <div>
                  <p className="text-xs text-gray-400">P&L</p>
                  <p className={`text-sm font-bold ${bot.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {bot.profit_loss >= 0 ? '+' : ''}${bot.profit_loss?.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Trades</p>
                  <p className="text-sm font-bold text-white">{bot.trades_count}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Win Rate</p>
                  <p className="text-sm font-bold text-white">{bot.win_rate?.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Allocation</p>
                  <p className="text-sm font-bold text-white">${bot.allocation?.toLocaleString()}</p>
                </div>
              </div>
              {bot.status === 'active' && bot.last_signal && (
                <div className="mt-2 text-xs text-gray-400">
                  Last signal: <span className={bot.last_signal === 'BUY' ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>{bot.last_signal}</span> · {bot.last_trade_ago}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bot Performance */}
        <div className="card">
          {selectedBot ? (
            <>
              <h2 className="font-bold text-white mb-1">{selectedBot.name}</h2>
              <p className="text-xs text-gray-400 mb-4">{selectedBot.strategyLabel}</p>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total P&L</span>
                  <span className={`font-semibold ${selectedBot.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedBot.profit_loss >= 0 ? '+' : ''}${selectedBot.profit_loss?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Win Rate</span>
                  <span className="text-white font-semibold">{selectedBot.win_rate?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Trades</span>
                  <span className="text-white font-semibold">{selectedBot.trades_count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Market</span>
                  <span className="text-white font-semibold capitalize">{selectedBot.market}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Symbol</span>
                  <span className="text-white font-semibold">{selectedBot.symbol}</span>
                </div>
              </div>
              {performance.length > 0 && (
                <>
                  <p className="text-xs text-gray-400 mb-2">30-Day Performance</p>
                  <ResponsiveContainer width="100%" height={120}>
                    <LineChart data={performance}>
                      <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 9 }} tickLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '6px' }} formatter={v => [`$${v.toFixed(2)}`, 'P&L']} />
                      <Line type="monotone" dataKey="pnl" stroke="#22c55e" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Activity size={36} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Select a bot to view performance</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
