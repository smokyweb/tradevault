import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import api from '../lib/api';

const TABS = ['all', 'crypto', 'forex', 'futures'];

function PriceRow({ symbol, data, onClick, selected }) {
  const positive = data.pct >= 0;
  return (
    <tr
      onClick={() => onClick(symbol)}
      className={`border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors ${selected ? 'bg-gray-800/80' : ''}`}
    >
      <td className="py-3 px-4 font-semibold text-white">{symbol}</td>
      <td className="py-3 px-4 font-mono text-white">${data.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
      <td className={`py-3 px-4 font-mono ${positive ? 'text-green-400' : 'text-red-400'}`}>
        {positive ? '+' : ''}{data.change?.toFixed(4)}
      </td>
      <td className={`py-3 px-4 ${positive ? 'text-green-400' : 'text-red-400'}`}>
        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${positive ? 'bg-green-500/15' : 'bg-red-500/15'}`}>
          {positive ? '▲' : '▼'} {Math.abs(data.pct)?.toFixed(2)}%
        </span>
      </td>
      <td className="py-3 px-4 text-gray-400 text-sm">{data.volume?.toLocaleString()}</td>
    </tr>
  );
}

export default function Markets() {
  const [markets, setMarkets] = useState({});
  const [tab, setTab] = useState('all');
  const [selected, setSelected] = useState('BTC/USD');
  const [history, setHistory] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchMarkets = useCallback(async () => {
    try {
      const res = await api.get('/markets');
      setMarkets(res.data);
      setLastUpdate(new Date());
    } catch {}
  }, []);

  const fetchHistory = useCallback(async (symbol) => {
    setLoadingHistory(true);
    try {
      const res = await api.get(`/markets/history/${encodeURIComponent(symbol)}`);
      setHistory(res.data.map(c => ({ time: new Date(c.time).toLocaleTimeString(), price: c.close })));
    } catch {}
    finally { setLoadingHistory(false); }
  }, []);

  useEffect(() => {
    fetchMarkets();
    const interval = setInterval(fetchMarkets, 3000);
    return () => clearInterval(interval);
  }, [fetchMarkets]);

  useEffect(() => {
    fetchHistory(selected);
  }, [selected, fetchHistory]);

  const allPairs = Object.entries(markets).flatMap(([market, pairs]) =>
    Object.entries(pairs).map(([symbol, data]) => ({ symbol, market, data }))
  );

  const filtered = tab === 'all' ? allPairs : allPairs.filter(p => p.market === tab);

  const selectedData = allPairs.find(p => p.symbol === selected);

  return (
    <div className="space-y-6 slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Markets</h1>
          <p className="text-gray-400 text-sm mt-0.5">Live simulated prices — updates every 3 seconds</p>
        </div>
        <div className="flex items-center gap-2 text-gray-400 text-xs">
          <RefreshCw size={12} className="animate-spin" style={{ animationDuration: '3s' }} />
          Updated {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {/* Selected symbol chart */}
      {selectedData && (
        <div className="card">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-black text-white">{selected}</h2>
              <p className="text-3xl font-black mt-1 text-white">
                ${selectedData.data.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </p>
              <p className={`text-sm mt-0.5 ${selectedData.data.pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {selectedData.data.pct >= 0 ? '▲' : '▼'} {Math.abs(selectedData.data.pct)?.toFixed(2)}% today
              </p>
            </div>
            <div className="text-right text-sm text-gray-400">
              <div>High: <span className="text-white">${selectedData.data.high24h?.toLocaleString()}</span></div>
              <div>Low: <span className="text-white">${selectedData.data.low24h?.toLocaleString()}</span></div>
              <div>Vol: <span className="text-white">{selectedData.data.volume?.toLocaleString()}</span></div>
            </div>
          </div>
          {!loadingHistory && history.length > 0 && (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} tickFormatter={v => `$${v.toLocaleString()}`} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  formatter={v => [`$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Price']}
                />
                <Line type="monotone" dataKey="price" stroke={selectedData.data.pct >= 0 ? '#22c55e' : '#ef4444'} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Pairs table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-900 text-gray-400 text-xs">
              <th className="text-left py-3 px-4">Symbol</th>
              <th className="text-left py-3 px-4">Price</th>
              <th className="text-left py-3 px-4">Change</th>
              <th className="text-left py-3 px-4">% Change</th>
              <th className="text-left py-3 px-4">Volume</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ symbol, data }) => (
              <PriceRow key={symbol} symbol={symbol} data={data} onClick={setSelected} selected={symbol === selected} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
