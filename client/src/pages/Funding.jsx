import React, { useState, useEffect } from 'react';
import { Wallet, ArrowDownLeft, ArrowUpRight, CreditCard, Building2, Bitcoin } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const PAYMENT_METHODS = [
  { id: 'bank_transfer', label: 'Bank Transfer', icon: Building2, fee: 'Free', time: '1-3 days' },
  { id: 'crypto', label: 'Crypto Deposit', icon: Bitcoin, fee: 'Free', time: 'Instant' },
  { id: 'card', label: 'Credit/Debit Card', icon: CreditCard, fee: '1.5%', time: 'Instant' },
];

const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000];

function TxRow({ tx }) {
  const isDeposit = tx.type === 'deposit' || tx.type === 'referral_bonus' || (tx.type === 'trade' && tx.amount > 0);
  return (
    <tr className="border-b border-gray-800 hover:bg-gray-800/30">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDeposit ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            {isDeposit ? <ArrowDownLeft size={14} className="text-green-400" /> : <ArrowUpRight size={14} className="text-red-400" />}
          </div>
          <span className="text-sm text-gray-300 capitalize">{tx.type.replace(/_/g, ' ')}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-gray-400 max-w-xs truncate">{tx.description}</td>
      <td className="py-3 px-4">
        <span className={`text-xs px-2 py-0.5 rounded font-semibold ${tx.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
          {tx.status}
        </span>
      </td>
      <td className={`py-3 px-4 text-right font-semibold ${isDeposit && tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
        {isDeposit && tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </td>
      <td className="py-3 px-4 text-right text-xs text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</td>
    </tr>
  );
}

export default function Funding() {
  const { user, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [tab, setTab] = useState('deposit');
  const [method, setMethod] = useState('bank_transfer');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    api.get('/funding/transactions').then(r => setTransactions(r.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const endpoint = tab === 'deposit' ? '/funding/deposit' : '/funding/withdraw';
      const res = await api.post(endpoint, { amount: parseFloat(amount), method });
      setMessage({ type: 'success', text: res.data.message });
      setAmount('');
      refreshUser();
      api.get('/funding/transactions').then(r => setTransactions(r.data));
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Transaction failed' });
    } finally { setLoading(false); }
  };

  const totalDeposited = transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawn = Math.abs(transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0));

  return (
    <div className="space-y-6 slide-up">
      <div>
        <h1 className="text-2xl font-black text-white">Funding</h1>
        <p className="text-gray-400 text-sm mt-0.5">Deposit or withdraw demo funds</p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card border-green-500/20">
          <p className="text-gray-400 text-sm">Available Balance</p>
          <p className="text-3xl font-black text-green-400">${user?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="stat-card">
          <p className="text-gray-400 text-sm">Total Deposited</p>
          <p className="text-2xl font-black text-white">${totalDeposited.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="stat-card">
          <p className="text-gray-400 text-sm">Total Withdrawn</p>
          <p className="text-2xl font-black text-white">${totalWithdrawn.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="card">
          {/* Tabs */}
          <div className="flex gap-2 mb-5">
            {['deposit', 'withdraw'].map(t => (
              <button key={t} onClick={() => { setTab(t); setMessage(null); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300'}`}>
                {t === 'deposit' ? '⬇ Deposit' : '⬆ Withdraw'}
              </button>
            ))}
          </div>

          {message && (
            <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Payment method (only for deposit) */}
            {tab === 'deposit' && (
              <div className="space-y-2">
                <label className="label">Payment Method</label>
                {PAYMENT_METHODS.map(({ id, label, icon: Icon, fee, time }) => (
                  <label key={id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${method === id ? 'border-green-500 bg-green-500/5' : 'border-gray-700 hover:border-gray-600'}`}>
                    <input type="radio" name="method" value={id} checked={method === id} onChange={() => setMethod(id)} className="accent-green-500" />
                    <Icon size={18} className="text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{label}</p>
                      <p className="text-xs text-gray-500">Fee: {fee} · {time}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="label">Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input type="number" className="input pl-8" placeholder="0.00" min={tab === 'deposit' ? '10' : '1'} max={tab === 'deposit' ? '100000' : user?.balance}
                  value={amount} onChange={e => setAmount(e.target.value)} required />
              </div>
            </div>

            {/* Quick amounts (deposit only) */}
            {tab === 'deposit' && (
              <div className="flex flex-wrap gap-2">
                {QUICK_AMOUNTS.map(a => (
                  <button key={a} type="button" onClick={() => setAmount(String(a))}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-all ${amount == a ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                    ${a.toLocaleString()}
                  </button>
                ))}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Processing...' : tab === 'deposit' ? `⬇ Deposit $${amount ? parseFloat(amount).toLocaleString() : '0'}` : `⬆ Withdraw $${amount ? parseFloat(amount).toLocaleString() : '0'}`}
            </button>

            <p className="text-xs text-gray-500 text-center">
              ⚠️ Demo platform — no real money is transferred
            </p>
          </form>
        </div>

        {/* Transactions */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="font-bold text-white">Transaction History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-900 text-gray-400 text-xs">
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">Description</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-right py-3 px-4">Amount</th>
                <th className="text-right py-3 px-4">Date</th>
              </tr></thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr><td colSpan="5" className="py-8 text-center text-gray-400">No transactions yet</td></tr>
                ) : transactions.map(tx => <TxRow key={tx.id} tx={tx} />)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
