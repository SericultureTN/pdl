import { useState } from 'react';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/auth.js';
import loginBg from '../assets/login-bg.png';
import gvtLogo from '../assets/gvt-logo.png';

const FEATURES = [
  'Monthly Wise Reporting',
  'AD Office Wise Management',
  'Real-time Analytics & Reports',
  'Secure & Role-based Access',
];

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
      const msg = err?.error || err?.message;
      setError(typeof msg === 'string' ? msg : 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  const inputBase = {
    width: '100%', padding: '11px 14px', borderRadius: '8px',
    border: '1px solid #d1d5db', background: '#fff',
    fontSize: '14px', color: '#111827', outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">

      {/* ══════ CARD ══════ */}
      <div className="w-full flex flex-col md:flex-row overflow-hidden rounded-2xl"
        style={{ maxWidth: '900px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>

        {/* ─── LEFT: Form ─── */}
        <div className="w-full md:w-[48%] bg-white flex flex-col px-10 py-12">

          {/* Logo */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="flex items-center justify-center mb-5"
              style={{ width: '120px', height: '120px' }}>
              <img src={gvtLogo} alt="Government of Tamil Nadu"
                style={{ width: '120px', height: '120px', objectFit: 'contain', display: 'block' }} />
            </div>
            {/* <h1 className="text-2xl font-black tracking-tight leading-tight" style={{ color: '#0B5D3B' }}>
              SILK SAMAGRA
            </h1> */}
            <h2 className="text-2xl font-black tracking-tight leading-tight" style={{ color: '#0B5D3B' }}>
              Periodicals Reports
            </h2>
            <p className="mt-2 text-sm text-gray-500">Department of Sericulture,</p>
            <p className="text-sm text-gray-500">Tamil Nadu - 636007</p>
          </div>

          {/* Divider */}
          <hr className="border-gray-200 mb-6" />

          {/* Form heading */}
          <p className="text-[15px] font-bold text-gray-800 mb-5">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1" noValidate>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
              <input
                name="email" type="email" required autoComplete="email"
                placeholder="Enter username"
                value={formData.email} onChange={handleChange}
                style={inputBase}
                onFocus={e => { e.currentTarget.style.borderColor = '#0B5D3B'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(11,93,59,0.12)'; }}
                onBlur={e  => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.boxShadow = ''; }}
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <button type="button" className="text-sm font-medium hover:underline"
                  style={{ color: '#2563eb' }}>
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  name="password" type={showPwd ? 'text' : 'password'} required
                  autoComplete="current-password" placeholder="Enter password"
                  value={formData.password} onChange={handleChange}
                  style={{ ...inputBase, paddingRight: '42px' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#0B5D3B'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(11,93,59,0.12)'; }}
                  onBlur={e  => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.boxShadow = ''; }}
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-lg text-xs font-medium"
                style={{ background: '#fff5f5', border: '1px solid #fecaca', color: '#dc2626' }}>
                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Sign In */}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-lg text-white font-bold text-sm tracking-wide transition-all duration-200 mt-1"
              style={{ background: loading ? '#4a9e75' : '#0B5D3B' }} 
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#094d31'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#0B5D3B'; }}>
              {loading
                ? <span className="flex items-center justify-center gap-2"><Loader2 size={15} className="animate-spin" />Signing in…</span>
                : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-[11px] text-gray-400 mt-8 leading-relaxed">
            © 2024 Sericulture Department, Government of Tamil Nadu<br />All rights reserved.
          </p>
        </div>

        {/* ─── RIGHT: Image + features ─── */}
        <div className="hidden md:flex md:w-[52%] flex-col relative overflow-hidden"
          style={{ background: 'linear-gradient(175deg, #0a5c3a 0%, #0B5D3B 40%, #083d26 100%)' }}>

          {/* Cocoon image — top portion */}
          <div className="flex-1 flex items-center justify-center pt-8 pb-2 px-6">
            <img src={loginBg} alt="Silk cocoon with mulberry leaves"
              className="object-contain w-full"
              style={{
                maxHeight: '320px',
                filter: 'drop-shadow(0 16px 40px rgba(0,0,0,0.5)) brightness(1.04) saturate(1.15)',
              }}
            />
          </div>

          {/* Portal name + features — bottom portion */}
          <div className="px-8 pb-10 pt-2">
            <h3 className="text-xl font-black text-white text-center tracking-wide mb-0.5">
              PDL
            </h3>
            <p className="text-center text-sm mb-5" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Periodicals Reporting System
            </p>
            <br></br>

            <div className="flex flex-col gap-3">
              {FEATURES.map(f => (
                <div key={f} className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="shrink-0" style={{ color: '#4ade80' }} />
                  <span className="text-sm font-medium text-white">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
