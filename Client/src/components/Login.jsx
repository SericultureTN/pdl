import { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { authService } from '../services/auth.js';
import loginBg from '../assets/login-bg.png';
import gvtLogo from '../assets/gvt-logo.png';

const FOCUS = { boxShadow: '0 0 0 3px rgba(11,93,59,0.15)', borderColor: '#0B5D3B', background: '#fff' };
const BLUR  = { boxShadow: '', borderColor: '#e5e7eb', background: '#f9fafb' };

export default function Login({ onLogin }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleChange = (e) => {
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.trim())    { setError('Username is required.'); return; }
    if (!formData.password.trim()) { setError('Password is required.'); return; }
    setLoading(true); setError('');
    try {
      const result = await authService.login(formData.email, formData.password);
      if (result.ok) { onLogin(result.user); }
      else           { setError(result.error || 'Invalid credentials. Please try again.'); }
    } catch (err) {
      setError(err.error || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 md:p-8"
      style={{ background: 'linear-gradient(135deg, #072e1e 0%, #0B5D3B 50%, #0a4a2e 100%)' }}>

      {/* Background dot grid */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <svg className="w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="bg-dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#bg-dots)" />
        </svg>
      </div>
      {/* Radial glow top-right */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none" aria-hidden="true"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 65%)', transform: 'translate(25%,-25%)' }} />

      {/* ══════ CARD ══════ */}
      <div className="relative z-10 w-full max-w-4xl rounded-3xl overflow-hidden flex flex-col md:flex-row"
        style={{ boxShadow: '0 40px 100px rgba(0,0,0,0.5)', minHeight: '580px' }}>

        {/* ─── LEFT: Form panel ─── */}
        <div className="w-full md:w-[44%] bg-white flex flex-col px-9 py-10 md:px-11 md:py-12">

          {/* Branding block */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="p-2 rounded-2xl mb-4" style={{ background: '#f0faf5' }}>
              <img src={gvtLogo} alt="Government of Tamil Nadu"
                className="w-[88px] h-[88px] object-contain"
                style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))' }} />
            </div>
            <h1 className="text-[22px] font-black tracking-tight leading-tight" style={{ color: '#0B5D3B' }}>
              Periodicals Reports
            </h1>
            {/* Green accent underline */}
            <div className="mt-1.5 w-10 h-[3px] rounded-full" style={{ background: '#0B5D3B', opacity: 0.3 }} />
            <p className="mt-3 text-[13px] font-semibold text-gray-700">Department of Sericulture</p>
            <p className="text-[12px] text-gray-400">Tamil Nadu – 636007</p>
          </div>

          {/* Form heading */}
          <p className="text-[13px] font-bold text-gray-500 uppercase tracking-widest mb-5 text-center">
            — Sign in to your account —
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1" noValidate>

            {/* Username */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Username
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: '#9ca3af' }} />
                <input
                  name="email" type="email" required autoComplete="email"
                  placeholder="Enter your username"
                  value={formData.email} onChange={handleChange}
                  onFocus={e => Object.assign(e.currentTarget.style, FOCUS)}
                  onBlur={e  => Object.assign(e.currentTarget.style, BLUR)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm text-gray-800 placeholder-gray-300 outline-none transition-all"
                  style={{ borderColor: '#e5e7eb', background: '#f9fafb' }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Password</label>
                <button type="button" className="text-[11px] font-semibold hover:underline transition"
                  style={{ color: '#0B5D3B' }}>
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: '#9ca3af' }} />
                <input
                  name="password" type={showPwd ? 'text' : 'password'} required
                  autoComplete="current-password" placeholder="Enter your password"
                  value={formData.password} onChange={handleChange}
                  onFocus={e => Object.assign(e.currentTarget.style, FOCUS)}
                  onBlur={e  => Object.assign(e.currentTarget.style, BLUR)}
                  className="w-full pl-10 pr-11 py-3 rounded-xl border text-sm text-gray-800 placeholder-gray-300 outline-none transition-all"
                  style={{ borderColor: '#e5e7eb', background: '#f9fafb' }}
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition"
                  style={{ color: '#9ca3af' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#374151'}
                  onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}>
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium"
                style={{ background: '#fff5f5', border: '1px solid #fecaca', color: '#dc2626' }}>
                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Sign In button */}
            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 mt-1"
              style={{ background: loading ? '#4a9e75' : '#0B5D3B', boxShadow: '0 6px 20px rgba(11,93,59,0.38)' }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#094d31'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(11,93,59,0.45)'; } }}
              onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = '#0B5D3B'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(11,93,59,0.38)'; } }}>
              {loading
                ? <><Loader2 size={15} className="animate-spin" />Signing in…</>
                : <><span>Sign In</span><ArrowRight size={15} /></>}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-[11px] text-gray-400 mt-8 leading-relaxed">
            © 2026 Sericulture Department, Government of Tamil Nadu
          </p>
        </div>

        {/* ─── RIGHT: Image panel ─── */}
        <div className="hidden md:flex md:w-[56%] flex-col items-center justify-center relative overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #0a5c3a 0%, #0d7347 45%, #083d26 100%)' }}>

          {/* Dot overlay */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <svg className="w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="r-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.3" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#r-dots)" />
            </svg>
          </div>

          {/* Inner radial glow */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
            style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0.08) 0%, transparent 65%)' }} />

          {/* Cocoon image */}
          <img src={loginBg} alt="Silk cocoon with mulberry leaves"
            className="relative z-10 object-contain"
            style={{
              width: '80%',
              maxWidth: '380px',
              filter: 'drop-shadow(0 24px 56px rgba(0,0,0,0.55)) brightness(1.05) saturate(1.2)',
            }}
          />

          {/* Bottom label */}
          <div className="relative z-10 mt-6 px-5 py-2 rounded-full text-[11px] font-bold tracking-widest uppercase"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: 'rgba(255,255,255,0.55)',
              letterSpacing: '0.12em',
            }}>
            Sericulture · Tamil Nadu
          </div>
        </div>

      </div>
    </div>
  );
}
