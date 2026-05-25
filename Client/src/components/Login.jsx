import { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { authService } from '../services/auth.js';
import loginBg from '../assets/login-bg.png';
import gvtLogo from '../assets/gvt-logo.png';

const FOCUS = { boxShadow: '0 0 0 3px rgba(11,93,59,0.18)', borderColor: '#0B5D3B' };
const BLUR  = { boxShadow: '', borderColor: '#e5e7eb' };

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
    setLoading(true);
    setError('');
    try {
      const result = await authService.login(formData.email, formData.password);
      if (result.ok) { onLogin(result.user); }
      else           { setError(result.error || 'Invalid credentials. Please try again.'); }
    } catch (err) {
      setError(err.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 md:p-8"
      style={{ background: 'linear-gradient(145deg, #0B5D3B 0%, #0e7a4f 45%, #094d31 100%)' }}>

      {/* Subtle radial glow on background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
        style={{ background: 'radial-gradient(ellipse at 70% 30%, rgba(255,255,255,0.06) 0%, transparent 60%)' }} />

      {/* ══════ ONE CARD ══════ */}
      <div className="relative z-10 w-full max-w-4xl rounded-3xl overflow-hidden flex flex-col md:flex-row"
        style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.4)', minHeight: '560px' }}>

        {/* ── LEFT: Form ── */}
        <div className="w-full md:w-[42%] bg-white flex flex-col justify-between px-8 py-10 md:px-10">

          {/* Branding */}
          <div className="flex flex-col items-center text-center">
            <img src={gvtLogo} alt="Government of Tamil Nadu"
              className="w-20 h-20 object-contain mb-4"
              style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.10))' }} />
            <h1 className="text-xl font-black tracking-tight" style={{ color: '#0B5D3B' }}>
              Periodicals Reports
            </h1>
            <p className="mt-1 text-sm font-semibold text-gray-600">Department of Sericulture</p>
            <p className="text-xs text-gray-400 font-medium">Tamil Nadu – 636007</p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Sign In</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 flex-1" noValidate>

            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: '#9ca3af' }} />
              <input
                name="email" type="email" required autoComplete="email"
                placeholder="Username"
                value={formData.email} onChange={handleChange}
                onFocus={e => Object.assign(e.currentTarget.style, FOCUS)}
                onBlur={e  => Object.assign(e.currentTarget.style, BLUR)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-gray-50 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all"
                style={{ borderColor: '#e5e7eb' }}
              />
            </div>

            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: '#9ca3af' }} />
              <input
                name="password" type={showPwd ? 'text' : 'password'} required
                autoComplete="current-password" placeholder="Password"
                value={formData.password} onChange={handleChange}
                onFocus={e => Object.assign(e.currentTarget.style, FOCUS)}
                onBlur={e  => Object.assign(e.currentTarget.style, BLUR)}
                className="w-full pl-10 pr-11 py-2.5 rounded-xl border bg-gray-50 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all"
                style={{ borderColor: '#e5e7eb' }}
              />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition"
                style={{ color: '#9ca3af' }}
                onMouseEnter={e => e.currentTarget.style.color = '#374151'}
                onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}>
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <div className="text-right -mt-1">
              <button type="button" className="text-xs font-semibold hover:underline transition"
                style={{ color: '#0B5D3B' }}>
                Forgot Password?
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium"
                style={{ background: '#fff5f5', border: '1px solid #fca5a5', color: '#dc2626' }}>
                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-white font-bold text-sm tracking-wide transition-all duration-200"
              style={{ background: loading ? '#4a9e75' : '#0B5D3B', boxShadow: '0 4px 14px rgba(11,93,59,0.35)' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#094d31'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#0B5D3B'; }}>
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <Loader2 size={15} className="animate-spin" />Signing in…
                  </span>
                : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-[11px] text-gray-400 mt-6 leading-relaxed">
            © 2026 Sericulture Department,<br />Government of Tamil Nadu
          </p>
        </div>

        {/* ── RIGHT: Image ── */}
        <div className="hidden md:flex md:w-[58%] items-center justify-center relative overflow-hidden"
          style={{ background: 'linear-gradient(145deg, #0a5135 0%, #0d7347 50%, #094d31 100%)' }}>

          {/* Subtle inner glow */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
            style={{ background: 'radial-gradient(ellipse at 55% 40%, rgba(255,255,255,0.07) 0%, transparent 65%)' }} />

          {/* Cocoon image — large, centered, clean */}
          <img src={loginBg} alt="Silk cocoon with mulberry leaves"
            className="relative z-10 object-contain"
            style={{
              width: '78%',
              maxWidth: '400px',
              filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.5)) brightness(1.06) saturate(1.15)',
            }}
          />
        </div>

      </div>
    </div>
  );
}
