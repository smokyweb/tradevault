import React, { useState, useEffect } from 'react';
import { Users, Copy, CheckCircle, Gift, TrendingUp } from 'lucide-react';
import api from '../lib/api';

export default function Referrals() {
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get('/referrals').then(r => setData(r.data));
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(data.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(data.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!data) return <div className="flex items-center justify-center h-64 text-gray-400">Loading referrals...</div>;

  return (
    <div className="space-y-6 slide-up">
      <div>
        <h1 className="text-2xl font-black text-white">Referral Program</h1>
        <p className="text-gray-400 text-sm mt-0.5">Earn $50 for every trader you refer to TradeVault</p>
      </div>

      {/* How it works */}
      <div className="card bg-gradient-to-r from-green-900/20 to-yellow-900/10 border-green-500/20">
        <h2 className="font-bold text-white mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: '1', icon: Copy, title: 'Share Your Link', desc: 'Send your unique referral link to friends and traders.' },
            { step: '2', icon: Users, title: 'They Sign Up', desc: 'Your friend creates an account using your referral link or code.' },
            { step: '3', icon: Gift, title: 'You Both Earn', desc: 'You earn $50 and they get a $25 welcome bonus!' },
          ].map(({ step, icon: Icon, title, desc }) => (
            <div key={step} className="flex gap-4">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-black flex-shrink-0">{step}</div>
              <div>
                <p className="font-bold text-white mb-1">{title}</p>
                <p className="text-gray-400 text-sm">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-gray-400 text-sm">Total Referrals</p>
          <p className="text-2xl font-black text-white">{data.stats.total}</p>
        </div>
        <div className="stat-card">
          <p className="text-gray-400 text-sm">Paid</p>
          <p className="text-2xl font-black text-green-400">{data.stats.paid}</p>
        </div>
        <div className="stat-card">
          <p className="text-gray-400 text-sm">Earnings</p>
          <p className="text-2xl font-black text-yellow-400">${data.stats.totalEarned}</p>
        </div>
        <div className="stat-card">
          <p className="text-gray-400 text-sm">Per Referral</p>
          <p className="text-2xl font-black text-white">${data.stats.rewardPerReferral}</p>
        </div>
      </div>

      {/* Referral link */}
      <div className="card">
        <h2 className="font-bold text-white mb-4">Your Referral Details</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Referral Code</label>
            <div className="flex gap-2">
              <div className="input flex items-center font-mono text-green-400 text-lg font-bold flex-1">
                {data.referralCode}
              </div>
              <button onClick={copyCode} className="btn-secondary flex items-center gap-2 whitespace-nowrap">
                {copied ? <CheckCircle size={16} className="text-green-400" /> : <Copy size={16} />}
                Copy Code
              </button>
            </div>
          </div>
          <div>
            <label className="label">Referral Link</label>
            <div className="flex gap-2">
              <div className="input flex items-center text-gray-300 text-sm overflow-hidden flex-1 font-mono">
                <span className="truncate">{data.referralLink}</span>
              </div>
              <button onClick={copyLink} className="btn-primary flex items-center gap-2 whitespace-nowrap">
                {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                Copy Link
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Referred users */}
      <div className="card">
        <h2 className="font-bold text-white mb-4">Your Referrals ({data.referrals.length})</h2>
        {data.referrals.length === 0 ? (
          <div className="text-center py-10">
            <Users size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No referrals yet. Share your link to start earning!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-gray-400 text-xs border-b border-gray-700">
                <th className="text-left pb-3">Trader</th>
                <th className="text-left pb-3">Email</th>
                <th className="text-left pb-3">Joined</th>
                <th className="text-left pb-3">Status</th>
                <th className="text-right pb-3">Reward</th>
              </tr></thead>
              <tbody>
                {data.referrals.map(r => (
                  <tr key={r.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="py-3 font-semibold text-white">{r.referred_name}</td>
                    <td className="py-3 text-gray-400">{r.referred_email}</td>
                    <td className="py-3 text-gray-400 text-xs">{new Date(r.joined_at).toLocaleDateString()}</td>
                    <td className="py-3">
                      <span className={r.status === 'paid' ? 'badge-active' : 'badge-inactive'}>
                        {r.status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                      </span>
                    </td>
                    <td className="py-3 text-right font-semibold text-yellow-400">${r.reward}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Promo banner */}
      <div className="card bg-gradient-to-r from-yellow-900/20 to-green-900/20 border-yellow-500/20 text-center py-8">
        <TrendingUp size={36} className="text-yellow-400 mx-auto mb-3" />
        <h3 className="text-xl font-black text-white mb-2">Unlimited Earning Potential</h3>
        <p className="text-gray-400 max-w-md mx-auto">Refer as many traders as you want — there's no cap on referral earnings. Top referrers earn $500+ per month!</p>
      </div>
    </div>
  );
}
