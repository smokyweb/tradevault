import React, { useState, useEffect } from 'react';
import { User, Shield, Bell, Key, CheckCircle } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [profileMsg, setProfileMsg] = useState(null);
  const [passMsg, setPassMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/profile').then(r => {
      setProfile(r.data);
      setProfileForm({ name: r.data.name, email: r.data.email });
    });
  }, []);

  const updateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setProfileMsg(null);
    try {
      const res = await api.put('/profile', profileForm);
      setProfile(res.data);
      const updated = { ...user, name: res.data.name, email: res.data.email };
      setUser(updated);
      localStorage.setItem('tv_user', JSON.stringify(updated));
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.error || 'Update failed' });
    } finally { setLoading(false); }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirm) {
      return setPassMsg({ type: 'error', text: 'Passwords do not match' });
    }
    if (passForm.newPassword.length < 6) {
      return setPassMsg({ type: 'error', text: 'Password must be at least 6 characters' });
    }
    setLoading(true);
    setPassMsg(null);
    try {
      await api.put('/profile/password', { currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      setPassMsg({ type: 'success', text: 'Password changed successfully!' });
      setPassForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setPassMsg({ type: 'error', text: err.response?.data?.error || 'Password change failed' });
    } finally { setLoading(false); }
  };

  if (!profile) return <div className="flex items-center justify-center h-64 text-gray-400">Loading profile...</div>;

  return (
    <div className="space-y-6 slide-up max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-white">Profile & Settings</h1>
        <p className="text-gray-400 text-sm mt-0.5">Manage your account information and security</p>
      </div>

      {/* Avatar + overview */}
      <div className="card flex items-center gap-5">
        <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center text-3xl font-black text-green-400 flex-shrink-0">
          {profile.name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="text-xl font-black text-white">{profile.name}</p>
          <p className="text-gray-400 text-sm">{profile.email}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="badge-active">Demo Account</span>
            <span className="text-gray-500 text-xs">Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-sm">Balance</p>
          <p className="text-2xl font-black text-green-400">${profile.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Profile Info */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <User size={18} className="text-green-400" />
          <h2 className="font-bold text-white">Account Information</h2>
        </div>

        {profileMsg && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${profileMsg.type === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
            {profileMsg.type === 'success' && <CheckCircle size={16} />}
            {profileMsg.text}
          </div>
        )}

        <form onSubmit={updateProfile} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Email Address</label>
            <input type="email" className="input" value={profileForm.email} onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Referral Code</label>
            <input className="input" value={profile.referral_code} readOnly className="input bg-gray-900 text-gray-400 cursor-not-allowed font-mono" />
            <p className="text-xs text-gray-500 mt-1">Share this code to earn $50 per referral</p>
          </div>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving...' : 'Save Changes'}</button>
        </form>
      </div>

      {/* Password */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <Key size={18} className="text-green-400" />
          <h2 className="font-bold text-white">Change Password</h2>
        </div>

        {passMsg && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${passMsg.type === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
            {passMsg.type === 'success' && <CheckCircle size={16} />}
            {passMsg.text}
          </div>
        )}

        <form onSubmit={updatePassword} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input type="password" className="input" placeholder="••••••••" value={passForm.currentPassword} onChange={e => setPassForm(f => ({ ...f, currentPassword: e.target.value }))} required />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input" placeholder="Min 6 characters" value={passForm.newPassword} onChange={e => setPassForm(f => ({ ...f, newPassword: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" className="input" placeholder="••••••••" value={passForm.confirm} onChange={e => setPassForm(f => ({ ...f, confirm: e.target.value }))} required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Updating...' : 'Update Password'}</button>
        </form>
      </div>

      {/* Security info */}
      <div className="card border-yellow-500/20">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={18} className="text-yellow-400" />
          <h2 className="font-bold text-white">Security Notes</h2>
        </div>
        <div className="space-y-2">
          {[
            'This is a demo platform — no real money or data is at risk',
            'JWT authentication with 7-day session tokens',
            'Passwords are encrypted with bcrypt (10 rounds)',
            'All trading is simulated — no real market orders are placed',
          ].map(note => (
            <div key={note} className="flex items-start gap-2 text-sm text-gray-400">
              <CheckCircle size={14} className="text-green-400 flex-shrink-0 mt-0.5" />
              {note}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
