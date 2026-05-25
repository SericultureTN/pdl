import { useState } from 'react';
import {
  Lock, Mail, Eye, EyeOff, ChevronDown, CheckCircle2,
  ShieldCheck, BarChart3, Users, FileText, Loader2, AlertCircle, CalendarDays
} from 'lucide-react';
import { authService } from '../services/auth.js';
import loginBg from '../assets/login-bg.png';
import gvtLogo from '../assets/gvt-logo.png';

const FINANCIAL_YEARS = ['2025-26', '2024-25', '2023-24', '2022-23'];

const FEATURES = [
  { icon: FileText,    label: 'Monthly MIS Reporting',        desc: 'Submit & track monthly data' },
  { icon: Users,       label: 'AD Office Management',          desc: 'Office-wise data control' },
  { icon: BarChart3,   label: 'Real-time Analytics',           desc: 'Live reports & insights' },
  { icon: ShieldCheck, label: 'Role-Based Access',             desc: 'Secure multi-level login' },
];

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
    if (!formData.email.trim())    { setError('Email address is required.'); return; }
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

  const focusStyle  = { boxShadow: '0 0 0 3px rgba(11,93,59,0.2)', borderColor: '#0B5D3B' };
  const blurStyle   = {};

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#eef3ef' }}>

      {/* ── Top header ── */}
      <header className="flex items-center justify-between px-6 py-2.5 bg-white border-b border-gray-100"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: '#0B5D3B' }}>
            <ShieldCheck size={15} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-bold tracking-wide text-gray-700 leading-none">SILK SAMAGRA MIS PORTAL</p>
            <p className="text-[10px] text-gray-400 leading-none mt-0.5">Department of Sericulture, Govt. of Tamil Nadu</p>
          </div>
        </div>

        {/* FY Dropdown */}
        <div className="relative">
          <button onClick={() => setFyOpen(o => !o)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold text-gray-700 bg-white transition hover:bg-gray-50"
            style={{ borderColor: '#d1d5db', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <CalendarDays size={13} className="text-gray-400" />
            <span className="text-[11px] text-gray-400 font-medium">FY</span>
            {selectedFY}
            <ChevronDown size={13} className={`text-gray-400 transition-transform duration-200 ${fyOpen ? 'rotate-180' : ''}`} />
          </button>
          {fyOpen && (
            <div className="absolute right-0 mt-1.5 w-32 bg-white rounded-xl border border-gray-100 z-50 overflow-hidden"
              style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
              {FINANCIAL_YEARS.map(fy => (
                <button key={fy} onClick={() => { setSelectedFY(fy); setFyOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium transition"
                  style={fy === selectedFY
                    ? { background: '#0B5D3B', color: '#fff' }
                    : { color: '#374151' }}
                  onMouseEnter={e => { if (fy !== selectedFY) e.currentTarget.style.background = '#f3f4f6'; }}
                  onMouseLeave={e => { if (fy !== selectedFY) e.currentTarget.style.background = ''; }}>
                  {fy}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ── Main split card ── */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-10">
        <div className="w-full max-w-5xl rounded-3xl overflow-hidden flex flex-col md:flex-row"
          style={{ minHeight: '620px', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}>

          {/* ════ LEFT PANEL ════ */}
          <div className="w-full md:w-[42%] bg-white flex flex-col px-8 py-10 md:px-10 md:py-10">

            {/* ── Branding ── */}
            <div className="flex flex-col items-center text-center mb-7">
              <img src={gvtLogo} alt="Govt of Tamil Nadu" className="w-24 h-24 object-contain mb-3"
                style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.12))' }} />
              <h1 className="text-[22px] font-black leading-tight tracking-tight"
                style={{ color: '#0B5D3B' }}>
                SILK SAMAGRA
              </h1>
              <h2 className="text-[19px] font-black leading-tight tracking-tight"
                style={{ color: '#0B5D3B' }}>
                MIS PORTAL
              </h2>
              <p className="mt-1.5 text-[13px] font-semibold text-gray-600">
                Sericulture Department
              </p>
              <p className="text-[12px] text-gray-400 font-medium">
                Government of Tamil Nadu
              </p>
              <span className="inline-flex items-center gap-1 mt-2.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide"
                style={{ background: '#e8f5ee', color: '#0B5D3B', border: '1px solid #c6e8d5' }}>
                Monthly MIS Reporting System
              </span>
            </div>

            {/* ── Divider ── */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-widest">Sign In</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* ── Form ── */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 flex-1" noValidate>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: '#9ca3af' }} />
                  <input
                    name="email" type="email" required autoComplete="email"
                    placeholder="your@email.com"
                    value={formData.email} onChange={handleChange}
                    onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                    onBlur={e  => Object.assign(e.currentTarget.style, blurStyle)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-300 outline-none transition-all"
                    style={{ borderColor: '#e5e7eb' }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: '#9ca3af' }} />
                  <input
                    name="password" type={showPassword ? 'text' : 'password'} required
                    autoComplete="current-password" placeholder="Enter your password"
                    value={formData.password} onChange={handleChange}
                    onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                    onBlur={e  => Object.assign(e.currentTarget.style, blurStyle)}
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-300 outline-none transition-all"
                    style={{ borderColor: '#e5e7eb' }}
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition"
                    style={{ color: '#9ca3af' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#4b5563'}
                    onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot */}
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => setRememberMe(v => !v)}
                  className="flex items-center gap-2 select-none cursor-pointer">
                  <div className="w-4 h-4 rounded-md flex items-center justify-center border-2 transition-all"
                    style={rememberMe
                      ? { background: '#0B5D3B', borderColor: '#0B5D3B' }
                      : { background: '#fff', borderColor: '#d1d5db' }}>
                    {rememberMe && <CheckCircle2 size={10} className="text-white" />}
                  </div>
                  <span className="text-xs text-gray-500 font-medium">Remember me</span>
                </button>
                <button type="button" className="text-xs font-semibold transition hover:underline"
                  style={{ color: '#0B5D3B' }}>
                  Forgot password?
                </button>
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl text-xs font-medium"
                  style={{ background: '#fff5f5', border: '1px solid #fca5a5', color: '#dc2626' }}>
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit button */}
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-white font-bold text-sm tracking-wide transition-all duration-200 shadow-md mt-1"
                style={{ background: loading ? '#4a9e75' : '#0B5D3B', boxShadow: '0 4px 16px rgba(11,93,59,0.3)' }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#094d31'; }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#0B5D3B'; }}>
                {loading
                  ? <span className="flex items-center justify-center gap-2"><Loader2 size={15} className="animate-spin" />Signing in…</span>
                  : 'Sign In to Portal'}
              </button>
            </form>

            {/* Footer */}
            <p className="text-center text-[11px] text-gray-400 mt-6 leading-relaxed">
              © 2026 Department of Sericulture<br />Government of Tamil Nadu
            </p>
          </div>

          {/* ════ RIGHT PANEL ════ */}
          <div className="hidden md:flex w-full md:w-[58%] flex-col relative overflow-hidden"
            style={{
              backgroundImage: `url(${loginBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}>

            {/* Multi-layer overlay for depth */}
            <div className="absolute inset-0" aria-hidden="true"
              style={{ background: 'linear-gradient(150deg, rgba(11,93,59,0.96) 0%, rgba(10,81,53,0.88) 40%, rgba(7,60,38,0.94) 100%)' }} />

            {/* Subtle radial highlight top-right */}
            <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none" aria-hidden="true"
              style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)' }} />

            {/* Dot grid */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
              <svg className="w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="g" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1.4" fill="white" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#g)" />
              </svg>
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-between h-full p-10">

              {/* Top — portal name + tagline */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-5"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <ShieldCheck size={12} className="text-white opacity-70" />
                  <span className="text-[11px] font-bold tracking-widest uppercase text-white opacity-70">
                    Government of Tamil Nadu
                  </span>
                </div>
                <h2 className="text-[32px] font-black text-white leading-tight">
                  Sericulture<br />
                  <span style={{ color: 'rgba(255,255,255,0.65)' }}>Data Management</span>
                </h2>
                <p className="mt-1 font-black text-[32px] text-white">Made Simple.</p>
                <p className="mt-3 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  A unified platform for real-time MIS reporting<br />across all AD offices in Tamil Nadu.
                </p>
              </div>

              {/* Center — cocoon image card */}
              <div className="flex items-center justify-center py-2">
                <div className="relative">
                  {/* Glow ring */}
                  <div className="absolute inset-0 rounded-3xl"
                    style={{ boxShadow: '0 0 60px rgba(255,255,255,0.12)', transform: 'scale(1.04)' }} />
                  <div className="rounded-3xl overflow-hidden"
                    style={{
                      width: '230px', height: '230px',
                      border: '2px solid rgba(255,255,255,0.22)',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                    }}>
                    <img src={loginBg} alt="Silk cocoon with mulberry leaves"
                      className="w-full h-full object-cover"
                      style={{ filter: 'brightness(1.08) saturate(1.15)' }} />
                  </div>
                  {/* Badge on image */}
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap"
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.25)',
                      color: 'rgba(255,255,255,0.9)',
                    }}>
                    Sericulture · Tamil Nadu
                  </div>
                </div>
              </div>

              {/* Bottom — glassmorphism feature card */}
              <div className="rounded-2xl p-5 mt-4"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.13)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                }}>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] mb-3.5"
                  style={{ color: 'rgba(255,255,255,0.4)' }}>Portal Features</p>
                <div className="grid grid-cols-2 gap-3">
                  {FEATURES.map(({ icon: Icon, label, desc }) => (
                    <div key={label} className="flex items-start gap-2.5">
                      <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5"
                        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)' }}>
                        <Icon size={14} className="text-white" />
                      </div>
                      <div>
                        <p className="text-[12px] font-bold leading-tight" style={{ color: 'rgba(255,255,255,0.88)' }}>
                          {label}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                          {desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
