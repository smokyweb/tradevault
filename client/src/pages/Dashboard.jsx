import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Activity, Bot, BarChart3, ArrowRight } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

function StatCard({ label, value, sub, positive, icon: Icon, color = 'green' }) {
  const colorMap = { green: 'text-green-400 bg-green-500/10', yellow: 'text-yellow-400 bg-yellow-500/10', blue: 'text-blue-400 bg-blue-500/10' };
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <p className="text-gray-400 text-sm">{label}</p>
        {Icon && <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[color]}`}><Icon size={16} className={colorMap[color].split(' ')[0]} /></div>}
      </div>
      <p className="text-2xl font-black text-white mt-1">{value}</p>
      {sub && <p className={`text-xs mt-1 ${positive === true ? 'text-green-400' : positive === false ? 'text-red-400' : 'text-gray-400'}`}>{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [portRes, histRes, statsRes, tradesRes] = await Promise.all([
          api.get('/portfolio'),
          api.get('/portfolio/history'),
          api.get('/portfolio/stats'),
          api.get('/trades'),
        ]);
        setPortfolio(portRes.data);
        setHistory(histRes.data.map((h, i) => ({
          day: `Day ${i + 1}`,
          value: h.value,
          date: new Date(h.recorded_at).toLocaleDateString(),
        })));
        setStats(statsRes.data);
        setTrades(tradesRes.data.slice(0, 5));
      } catch (e) {}
      finally { setLoading(false); }
    };
    load();
    refreshUser();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading dashboard...</div>;

  const plPositive = (portfolio?.totalPL || 0) >= 0;

  return (
    <div className="space-y-6 slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">Welcome back, {user?.name?.split(' ')[0]}! Here's your portfolio overview.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-1.5">
          🎮 Demo Mode
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Portfolio Value"
          value={`$${(portfolio?.portfolioValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={Wallet}
          color="green"
        />
        <StatCard
          label="Total P&L"
          value={`${plPositive ? '+' : ''}$${Math.abs(portfolio?.totalPL || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub={plPositive ? '▲ Overall gain' : '▼ Overall loss'}
          positive={plPositive}
          icon={plPositive ? TrendingUp : TrendingDown}
          color={plPositive ? 'green' : 'green'}
        />
        <StatCard
          label="Win Rate"
          value={`${stats?.winRate || 0}%`}
          sub={`${stats?.totalTrades || 0} total trades`}
          icon={Activity}
          color="blue"
        />
        <StatCard
          label="Active Bots"
          value={stats?.activeBots || 0}
          sub="Running strategies"
          icon={Bot}
          color="yellow"
        />
      </div>

      {/* Chart + Positions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* P&L Chart */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white">Portfolio Performance</h2>
            <span className={`text-sm font-semibold ${plPositive ? 'text-green-400' : 'text-red-400'}`}>
              {plPositive ? '+' : ''}{portfolio?.totalPL?.toFixed(2)}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#9ca3af', fontSize: '12px' }}
                formatter={v => [`$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Portfolio']}
              />
              <Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Open Positions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white">Open Positions</h2>
            <Link to="/trading" className="text-green-400 text-xs hover:underline">View all</Link>
          </div>
          {portfolio?.positions?.length === 0 ? (
            <p className="text-gray-400 text-sm">No open positions</p>
          ) : (
            <div className="space-y-3">
              {portfolio?.positions?.slice(0, 4).map(pos => (
                <div key={pos.id} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-white">{pos.symbol}</p>
                    <p className="text-xs text-gray-500">{pos.side.toUpperCase()} · {pos.quantity}</p>
                  </div>
                  <span className={`text-sm font-semibold ${pos.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {pos.pnl >= 0 ? '+' : ''}${pos.pnl?.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Link to="/trading" className="mt-4 flex items-center justify-center gap-1 text-gray-400 hover:text-white text-xs transition-colors">
            Trade markets <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white">Recent Trades</h2>
          <Link to="/trading" className="text-green-400 text-xs hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs border-b border-gray-700">
                <th className="text-left pb-3">Symbol</th>
                <th className="text-left pb-3">Market</th>
                <th className="text-left pb-3">Type</th>
                <th className="text-right pb-3">Qty</th>
                <th className="text-right pb-3">Price</th>
                <th className="text-right pb-3">P&L</th>
                <th className="text-right pb-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {trades.map(t => (
                <tr key={t.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                  <td className="py-3 font-semibold text-white">{t.symbol}</td>
                  <td className="py-3 text-gray-400 capitalize">{t.market}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${t.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {t.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 text-right text-gray-300">{t.quantity}</td>
                  <td className="py-3 text-right font-mono text-gray-300">${t.price?.toLocaleString()}</td>
                  <td className={`py-3 text-right font-semibold ${t.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {t.profit_loss > 0 ? '+' : ''}{t.profit_loss?.toFixed(2)}
                  </td>
                  <td className="py-3 text-right text-gray-500 text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Trade Markets', path: '/trading', icon: TrendingUp, color: 'green' },
          { label: 'View Markets', path: '/markets', icon: BarChart3, color: 'blue' },
          { label: 'Manage Bots', path: '/bots', icon: Bot, color: 'yellow' },
          { label: 'Deposit Funds', path: '/funding', icon: Wallet, color: 'green' },
        ].map(({ label, path, icon: Icon, color }) => (
          <Link key={path} to={path} className="card hover:border-green-500/40 flex items-center gap-3 transition-all">
            <Icon size={20} className={`text-${color === 'green' ? 'green' : color === 'yellow' ? 'yellow' : 'blue'}-400`} />
            <span className="text-sm font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
