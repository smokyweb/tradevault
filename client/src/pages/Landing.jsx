import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Bot, Globe, Shield, Zap, BarChart3, Users, Wallet, ArrowRight, CheckCircle } from 'lucide-react';

const features = [
  { icon: BarChart3, title: 'Multi-Market Trading', desc: 'Trade Forex, Crypto, and Futures all from one platform.' },
  { icon: Bot, title: 'Algorithmic Bots', desc: 'Deploy AI-powered bots with proven strategies like MA Crossover, RSI, and MACD.' },
  { icon: Globe, title: 'Global Forex Access', desc: 'Access 10+ currency pairs with live simulated pricing updates.' },
  { icon: Zap, title: 'Lightning Execution', desc: 'Simulated instant order fills with realistic slippage modeling.' },
  { icon: Users, title: 'Referral Rewards', desc: 'Earn $50 for every friend you refer to TradeVault.' },
  { icon: Shield, title: 'Risk Management', desc: 'Built-in position sizing, stop-loss, and portfolio tracking.' },
];

const stats = [
  { label: 'Active Traders', value: '12,400+' },
  { label: 'Daily Volume', value: '$4.2B' },
  { label: 'Trading Pairs', value: '28+' },
  { label: 'Uptime', value: '99.9%' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <TrendingUp size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold">Trade<span className="text-green-400">Vault</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Sign In</Link>
            <Link to="/signup" className="btn-primary text-sm">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-24 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-transparent to-yellow-900/10 pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full pulse-green" />
            <span className="text-green-400 text-sm font-medium">Demo Platform — No Real Money Required</span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-black mb-6 leading-tight">
            Automate Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-yellow-400">
              Trading Empire
            </span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            TradeVault gives you institutional-grade algorithmic trading tools. Deploy bots, trade Forex, Crypto, and Futures — all in a risk-free demo environment.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/signup" className="btn-primary flex items-center justify-center gap-2 text-base px-8 py-3.5">
              Start Trading Free <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-secondary flex items-center justify-center gap-2 text-base px-8 py-3.5">
              Sign In
            </Link>
          </div>

          {/* Demo credentials */}
          <div className="inline-flex flex-col sm:flex-row items-center gap-3 bg-gray-800 border border-gray-700 rounded-xl px-6 py-4">
            <span className="text-yellow-400 font-semibold text-sm">🎮 Try Demo Account:</span>
            <code className="text-green-400 text-sm bg-gray-900 px-3 py-1 rounded font-mono">demo@tradevault.com</code>
            <span className="text-gray-500 hidden sm:block">/</span>
            <code className="text-green-400 text-sm bg-gray-900 px-3 py-1 rounded font-mono">Demo@1234</code>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-800 bg-gray-900/50 py-10">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-black text-white mb-1">{s.value}</p>
              <p className="text-gray-400 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-4">Everything You Need to Trade</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">Professional tools in a demo environment. Learn, test strategies, and build confidence.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card hover:border-green-500/40 transition-all duration-200 group">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
                  <Icon size={24} className="text-green-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Markets preview */}
      <section className="py-20 px-6 bg-gray-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">Live Markets Dashboard</h2>
            <p className="text-gray-400">Real-time simulated prices across all major asset classes</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[
              { label: 'Cryptocurrency', pairs: ['BTC/USD $43,250', 'ETH/USD $2,345', 'SOL/USD $104.50'], color: 'green' },
              { label: 'Forex', pairs: ['EUR/USD 1.0882', 'GBP/USD 1.2645', 'USD/JPY 149.85'], color: 'yellow' },
              { label: 'Futures', pairs: ['ES/USD 4,885', 'NQ/USD 17,420', 'GC/USD 2,025'], color: 'blue' },
            ].map(market => (
              <div key={market.label} className="card">
                <h3 className={`font-bold text-${market.color === 'green' ? 'green' : market.color === 'yellow' ? 'yellow' : 'blue'}-400 mb-3`}>{market.label}</h3>
                {market.pairs.map(p => (
                  <div key={p} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
                    <span className="text-sm text-gray-300">{p.split(' ')[0]}</span>
                    <span className="text-sm font-mono font-semibold text-white">{p.split(' ').slice(1).join(' ')}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-4">Ready to Trade Smarter?</h2>
          <p className="text-gray-400 mb-8">Join thousands of traders using TradeVault's algorithmic tools. Start with $10,000 demo capital — completely free.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="btn-primary flex items-center justify-center gap-2 px-8 py-4 text-base">
              Create Free Account <ArrowRight size={18} />
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-8 text-gray-500 text-sm">
            {['No credit card', 'Instant access', '$10,000 demo funds', 'All features free'].map(item => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-green-500" /> {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-6 bg-gray-900/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
              <TrendingUp size={14} className="text-white" />
            </div>
            <span className="font-bold">TradeVault</span>
            <span className="text-gray-500 text-sm ml-2">© 2024</span>
          </div>
          <p className="text-gray-500 text-sm text-center">
            ⚠️ TradeVault is a <strong className="text-yellow-400">demo platform</strong>. No real money is used or at risk. For educational purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
}
