import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useTheme } from '../components/theme-provider';
import { Sun, Moon } from 'lucide-react';

export const Login: React.FC = () => {
  const [userId, setUserId] = useState('OP1001');
  const [password, setPassword] = useState('pass123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!userId.trim() || !password.trim()) {
      setError('Please provide Operator / Manager ID and Password');
      return;
    }

    setLoading(true);
    try {
      const res = await login(userId.trim(), password.trim());
      if (res.success && res.user) {
        if (res.user.role === 'manager') {
          navigate('/manager');
        } else {
          navigate('/operator');
        }
      } else {
        setError(res.error || 'Invalid credentials');
      }
    } catch {
      setError('Connection failure. Verify backend or try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (id: string, pass: string) => {
    setUserId(id);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col justify-between p-4 sm:p-6 relative">
      {/* Top Bar with Brand & Field Light Toggle */}
      <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded bg-[#FFC300] flex items-center justify-center font-black text-[#211E1C]">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#211E1C]">
              <polygon points="12,3 2,21 22,21" />
            </svg>
          </div>
          <div>
            <span className="font-industrial text-2xl font-black tracking-wider text-text-primary">
              CATMATE
            </span>
            <div className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold">
              Heavy Equipment Shift Portal
            </div>
          </div>
        </div>

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle Screen Theme"
          className="btn-touch p-2.5 rounded border border-border bg-surface hover:border-[#FFC300] text-text-primary transition flex items-center justify-center"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-[#FFC300]" /> : <Moon className="w-5 h-5 text-stone-700" />}
        </button>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-8">
        <div className="bg-surface border-2 border-border rounded p-6 sm:p-8 shadow-sm">
          {/* Header */}
          <div className="mb-6 border-b border-border pb-4">
            <div className="text-xs uppercase font-industrial tracking-wider text-text-secondary font-bold">
              In-Cab Tablet &amp; Terminal Auth
            </div>
            <h1 className="font-industrial text-3xl font-black uppercase tracking-tight text-text-primary mt-1">
              Operator Sign In
            </h1>
            <p className="text-xs text-text-secondary mt-1 font-medium">
              Enter your equipment badge ID and password to initialize shift telemetry.
            </p>
          </div>

          {/* Inline Error State Toast */}
          {error && (
            <div
              role="alert"
              className="mb-4 bg-[#D63C2E]/15 border border-[#D63C2E]/40 text-[#D63C2E] dark:text-[#E5564A] p-3 rounded flex items-center gap-2.5 text-xs font-bold uppercase animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="user-id-input"
                className="block text-xs uppercase font-industrial font-bold text-text-secondary mb-1.5"
              >
                Badge / User ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="user-id-input"
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="e.g. OP1001 or MGR01"
                  required
                  className="w-full btn-touch pl-10 pr-3 rounded bg-bg border border-border text-base text-text-primary font-bold tracking-wide focus:outline-none focus:border-[#FFC300]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password-input"
                className="block text-xs uppercase font-industrial font-bold text-text-secondary mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full btn-touch pl-10 pr-3 rounded bg-bg border border-border text-base text-text-primary font-bold tracking-wide focus:outline-none focus:border-[#FFC300]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-touch mt-4 py-3 rounded bg-[#FFC300] hover:bg-[#E5AF00] text-[#211E1C] font-industrial font-black text-lg uppercase tracking-wider flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying Session...</span>
                </>
              ) : (
                <>
                  <span>Log In to Shift</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Pre-fill Links for Reviewers */}
          <div className="mt-6 pt-4 border-t border-border">
            <span className="text-[11px] font-industrial uppercase font-bold text-text-secondary block mb-2">
              Quick Shift Switcher (Field Demo):
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('OP1001', 'pass123')}
                className="btn-touch p-2 rounded bg-bg border border-border hover:border-[#FFC300] text-left transition"
              >
                <div className="text-xs font-bold text-text-primary">Rahul Singh</div>
                <div className="text-[10px] text-text-secondary uppercase font-industrial">Operator (OP1001)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('MGR01', 'pass123')}
                className="btn-touch p-2 rounded bg-bg border border-border hover:border-[#FFC300] text-left transition"
              >
                <div className="text-xs font-bold text-text-primary">Anita Roy</div>
                <div className="text-[10px] text-text-secondary uppercase font-industrial">Site Manager (MGR01)</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Notice Footer */}
      <div className="text-center text-xs text-text-secondary py-2 font-medium">
        CatMate Telemetry Platform • Caterpillar Heavy Equipment Compliance &amp; Wellness
      </div>
    </div>
  );
};
