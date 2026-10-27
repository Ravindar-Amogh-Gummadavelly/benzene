import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Building,
  CheckCircle2,
  Users,
  Award,
  FileSpreadsheet,
} from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || json.status !== 'ok') {
        throw new Error(json.message || 'Invalid email or password.');
      }

      onLoginSuccess(json.data.user, json.data.token);
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail, demoPass = 'password123') => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10">
        {/* Brand Card Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20 mb-3 border border-blue-400/20">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            AICTE Security Deposit Portal
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium tracking-wide uppercase">
            Bureau of Regulation &bull; FDR &amp; Lien Management System
          </p>
        </div>

        {/* Login Form Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
          <div className="mb-6 pb-4 border-b border-slate-800">
            <h2 className="text-lg font-bold text-slate-100">Portal Authentication</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Sign in with your authorized AICTE or Institution credentials
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 flex items-start gap-2.5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs animate-shake">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Authorized Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@aicte-india.org"
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-slate-950/70 border border-slate-750 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-slate-950/70 border border-slate-750 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Access */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Demo Evaluation Roles
              </span>
              <span className="text-[10px] text-blue-400 font-mono">pass: password123</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('institution@aicte-india.org')}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-750 border border-slate-700/60 text-slate-300 hover:text-white transition-all text-left group"
              >
                <Building className="h-3.5 w-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <div className="truncate">
                  <div className="font-semibold truncate">Institution User</div>
                  <div className="text-[10px] text-slate-400 truncate">IIT Bombay Scope</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('officer@aicte-india.org')}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-750 border border-slate-700/60 text-slate-300 hover:text-white transition-all text-left group"
              >
                <Award className="h-3.5 w-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
                <div className="truncate">
                  <div className="font-semibold truncate">AICTE Officer</div>
                  <div className="text-[10px] text-slate-400 truncate">Verification Review</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('approver@aicte-india.org')}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-750 border border-slate-700/60 text-slate-300 hover:text-white transition-all text-left group"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                <div className="truncate">
                  <div className="font-semibold truncate">Approver</div>
                  <div className="text-[10px] text-slate-400 truncate">Release / NOC Signoff</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('admin@aicte-india.org')}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-750 border border-slate-700/60 text-slate-300 hover:text-white transition-all text-left group"
              >
                <Users className="h-3.5 w-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                <div className="truncate">
                  <div className="font-semibold truncate">Portal Admin</div>
                  <div className="text-[10px] text-slate-400 truncate">Full RBAC &amp; Settings</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-slate-500">
          <p>All sessions and operations are audited under Government of India regulation.</p>
          <p className="text-[11px] text-slate-600 mt-1">
            Compliant with AICTE Approval Process Handbook (APH) guidelines.
          </p>
        </div>
      </div>
    </div>
  );
}
