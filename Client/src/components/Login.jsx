import { useState } from 'react';
import {
  Lock, Mail, Eye, EyeOff, ChevronDown, CheckCircle2,
  ShieldCheck, BarChart3, Users, FileText, Loader2, AlertCircle
} from 'lucide-react';
import { authService } from '../services/auth.js';

const FINANCIAL_YEARS = ['2025-26', '2024-25', '2023-24', '2022-23'];

const FEATURES = [
  { icon: FileText,   text: 'Monthly MIS Reporting' },
  { icon: Users,      text: 'AD Office Wise Management' },
  { icon: BarChart3,  text: 'Real-time Analytics & Reports' },
  { icon: ShieldCheck,text: 'Secure Role-Based Access' },
];

function SilkIllustration() {
  return (
    <svg viewBox="0 0 520 420" fill="none" xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full opacity-90" aria-hidden="true">
      {/* Cocoon group */}
      <ellipse cx="260" cy="200" rx="72" ry="44" fill="white" fillOpacity="0.13" />
      <ellipse cx="260" cy="200" rx="56" ry="32" fill="white" fillOpacity="0.17" />
      <ellipse cx="260" cy="200" rx="38" ry="20" fill="white" fillOpacity="0.22" />
      {/* Silk thread spirals */}
      <path d="M188 200 Q220 160 260 200 Q300 240 332 200" stroke="white" strokeOpacity="0.35" strokeWidth="1.5" fill="none" />
      <path d="M192 208 Q224 168 260 208 Q296 248 328 208" stroke="white" strokeOpacity="0.25" strokeWidth="1" fill="none" />
      <path d="M196 192 Q228 152 260 192 Q292 232 324 192" stroke="white" strokeOpacity="0.25" strokeWidth="1" fill="none" />
      {/* Mulberry leaves left */}
      <path d="M80 280 Q95 240 130 255 Q115 295 80 280Z" fill="white" fillOpacity="0.12" />
      <path d="M70 310 Q90 270 125 290 Q105 330 70 310Z" fill="white" fillOpacity="0.10" />
      <path d="M95 260 Q115 225 148 238 Q128 275 95 260Z" fill="white" fillOpacity="0.09" />
      <line x1="80" y1="280" x2="148" y2="238" stroke="white" strokeOpacity="0.15" strokeWidth="1" />
      <line x1="112" y1="258" x2="112" y2="290" stroke="white" strokeOpacity="0.12" strokeWidth="0.8" />
      {/* Mulberry leaves right */}
      <path d="M400 150 Q415 110 450 125 Q435 165 400 150Z" fill="white" fillOpacity="0.12" />
      <path d="M390 180 Q410 140 445 160 Q425 200 390 180Z" fill="white" fillOpacity="0.10" />
      <path d="M415 130 Q435 95 468 108 Q448 145 415 130Z" fill="white" fillOpacity="0.09" />
      <line x1="400" y1="150" x2="468" y2="108" stroke="white" strokeOpacity="0.15" strokeWidth="1" />
      {/* Flowing silk ribbon */}
      <path d="M60 340 Q130 310 200 330 Q270 350 340 320 Q410 290 460 310"
        stroke="white" strokeOpacity="0.2" strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M60 350 Q130 322 200 342 Q270 362 340 332 Q410 302 460 322"
        stroke="white" strokeOpacity="0.12" strokeWidth="5" strokeLinecap="round" fill="none" />
      {/* Decorative dots */}
      {[80,160,240,320,400,450].map((x,i) => (
        <circle key={i} cx={x} cy={60 + (i % 3)*30} r="3" fill="white" fillOpacity="0.18" />
      ))}
      {/* Bottom decorative line */}
      <path d="M100 390 Q260 370 420 390" stroke="white" strokeOpacity="0.15" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function GovEmblem() {
  return (
    <div className="flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg"
      style={{ background: 'linear-gradient(135deg,#0B5D3B 0%,#0e7a4f 100%)' }}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
        <circle cx="20" cy="20" r="18" stroke="white" strokeOpacity="0.6" strokeWidth="1" fill="none" />
        <path d="M20 6 L22.5 14h8l-6.5 4.7 2.5 8L20 22l-6.5 4.7 2.5-8L9.5 14h8z"
          fill="white" fillOpacity="0.9" />
        <circle cx="20" cy="22" r="4" fill="white" fillOpacity="0.5" />
      </svg>
    </div>
  );
}

export default function Login({ onLogin }) {
  const [formData, setFormData]     = useState({ email: '', password: '' });
  const [showPassword, setShowPwd]  = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [fyOpen, setFyOpen]         = useState(false);
  const [selectedFY, setSelectedFY] = useState('2025-26');

  const handleChange = (e) => {
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.trim())    { setError('Email is required.'); return; }
    if (!formData.password.trim()) { setError('Password is required.'); return; }
    setLoading(true);
    setError('');
    try {
      const result = await authService.login(formData.email, formData.password);
      if (result.ok) { onLogin(result.user); }
      else           { setError(result.error || 'Invalid credentials. Please try again.'); }
    } catch (err) {
      setError(err.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f0f4f1' }}>

      {/* ── Top minimal header ───────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-3 bg-white shadow-sm border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: '#0B5D3B' }}>
            <ShieldCheck size={14} className="text-white" />
          </div>
          <span className="text-xs font-semibold tracking-widest uppercase text-gray-500"
            style={{ letterSpacing: '0.14em' }}>Silk Samagra MIS Portal</span>
        </div>

        {/* Financial Year picker */}
        <div className="relative">
          <button
            onClick={() => setFyOpen(o => !o)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition text-sm font-medium text-gray-700 shadow-sm"
          >
            <span className="text-xs text-gray-400 mr-1">FY</span>
            {selectedFY}
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${fyOpen ? 'rotate-180' : ''}`} />
          </button>
          {fyOpen && (
            <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
              {FINANCIAL_YEARS.map(fy => (
                <button key={fy}
                  onClick={() => { setSelectedFY(fy); setFyOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-sm transition ${
                    fy === selectedFY
                      ? 'font-semibold text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  style={fy === selectedFY ? { background: '#0B5D3B' } : {}}
                >
                  {fy}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ── Main split area ──────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
          style={{ minHeight: '600px' }}>

          {/* ── LEFT PANEL ────────────────────────────────────────────── */}
          <div className="w-full md:w-[42%] bg-white flex flex-col justify-between px-8 py-10 md:px-10 md:py-12">

            {/* Logo + brand */}
            <div className="flex flex-col items-center text-center gap-4 mb-8">
              <GovEmblem />
              <div>
                <h1 className="text-2xl font-black tracking-tight leading-tight"
                  style={{ color: '#0B5D3B' }}>
                  SILK SAMAGRA
                </h1>
                <h2 className="text-2xl font-black tracking-tight leading-tight"
                  style={{ color: '#0B5D3B' }}>
                  MIS PORTAL
                </h2>
                <p className="mt-1.5 text-sm font-medium text-gray-500">
                  Sericulture Department,<br />Government of Tamil Nadu
                </p>
                <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-semibold tracking-wide"
                  style={{ background: '#e8f5ee', color: '#0B5D3B' }}>
                  Monthly MIS Reporting System
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

              {/* Email */}
              <div className="relative">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 ml-1">Email Address</label>
                <div className="relative">
                  <Mail size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    name="email" type="email" required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': '#0B5D3B' }}
                    onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 3px rgba(11,93,59,0.18)'}
                    onBlur={e  => e.currentTarget.style.boxShadow = ''}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 ml-1">Password</label>
                <div className="relative">
                  <Lock size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    name="password" type={showPassword ? 'text' : 'password'} required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all"
                    onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 3px rgba(11,93,59,0.18)'}
                    onBlur={e  => e.currentTarget.style.boxShadow = ''}
                  />
                  <button type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot */}
              <div className="flex items-center justify-between mt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    onClick={() => setRememberMe(v => !v)}
                    className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                      rememberMe ? 'border-transparent' : 'border-gray-300 bg-white'
                    }`}
                    style={rememberMe ? { background: '#0B5D3B' } : {}}
                  >
                    {rememberMe && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                  <span className="text-xs text-gray-500">Remember me</span>
                </label>
                <button type="button"
                  className="text-xs font-medium transition hover:underline"
                  style={{ color: '#0B5D3B' }}>
                  Forgot password?
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm"
                  style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit" disabled={loading}
                className="relative w-full py-3.5 rounded-xl text-white font-bold text-sm tracking-wide shadow-lg transition-all duration-200 overflow-hidden"
                style={{ background: loading ? '#4a9e75' : '#0B5D3B' }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#0a5135'; }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#0B5D3B'; }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  'Sign In to Portal'
                )}
              </button>
            </form>

            {/* Footer */}
            <p className="text-center text-xs text-gray-400 mt-8">
              © 2026 Sericulture Department, Government of Tamil Nadu
            </p>
          </div>

          {/* ── RIGHT PANEL ───────────────────────────────────────────── */}
          <div
            className="hidden md:flex w-full md:w-[58%] flex-col justify-between p-10 relative overflow-hidden"
            style={{ background: 'linear-gradient(145deg,#0B5D3B 0%,#0e7a4f 45%,#0a5135 100%)' }}
          >
            {/* Radial glow blobs */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
              <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full"
                style={{ background: 'rgba(255,255,255,0.04)', filter: 'blur(60px)' }} />
              <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full"
                style={{ background: 'rgba(255,255,255,0.03)', filter: 'blur(80px)' }} />
              {/* Dot matrix pattern */}
              <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1.2" fill="white" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#dots)" />
              </svg>
            </div>

            {/* Brand headline */}
            <div className="relative z-10">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase"
                style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}>
                Government of Tamil Nadu
              </span>
              <h2 className="mt-4 text-3xl font-black text-white leading-snug">
                Sericulture<br />
                <span style={{ color: 'rgba(255,255,255,0.75)' }}>Data Management</span><br />
                Made Simple
              </h2>
              <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                A unified platform for real-time MIS reporting across all AD offices.
              </p>
            </div>

            {/* Silk illustration */}
            <div className="relative z-10 flex-1 flex items-center justify-center py-4">
              <div className="w-full max-w-xs opacity-80">
                <SilkIllustration />
              </div>
            </div>

            {/* Glassmorphism feature card */}
            <div className="relative z-10 rounded-2xl p-5"
              style={{
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: 'rgba(255,255,255,0.55)' }}>Portal Features</p>
              <div className="grid grid-cols-2 gap-2.5">
                {FEATURES.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2.5">
                    <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.13)' }}>
                      <Icon size={14} className="text-white" />
                    </div>
                    <span className="text-xs font-medium leading-tight"
                      style={{ color: 'rgba(255,255,255,0.82)' }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
