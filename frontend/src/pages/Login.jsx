import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('email', data.email);
      onLogin(data.email);
      navigate('/');
    } catch {
      setError('Network error — is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-400" />
          <div className="absolute bottom-[-30%] right-[-15%] w-[500px] h-[500px] rounded-full bg-blue-500" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="18" fill="#001463" />
              <polygon points="18,8 22,14 30,14 24,19 26,27 18,23 10,27 12,19 6,14 14,14" fill="white" />
            </svg>
            <span className="text-white text-xl font-bold tracking-tight">starcircle</span>
          </div>

          <div>
            <h1 className="text-white text-4xl font-bold leading-tight mb-4">
              The Hiring Engine,<br />
              <span className="text-sky-400">built for growth.</span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-md">
              Screen candidates faster, hire smarter. AI-powered screening questions tailored to every role.
            </p>

            <div className="mt-8 flex gap-6">
              <div className="bg-slate-800 border border-slate-700 rounded-xl px-5 py-4">
                <p className="text-sky-400 text-2xl font-bold">6x</p>
                <p className="text-slate-400 text-xs mt-0.5">Faster screening</p>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-xl px-5 py-4">
                <p className="text-sky-400 text-2xl font-bold">50%</p>
                <p className="text-slate-400 text-xs mt-0.5">Better candidates</p>
              </div>
            </div>
          </div>

          <p className="text-slate-600 text-xs">© 2026 Starcircle. All rights reserved.</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="18" fill="#001463" />
              <polygon points="18,8 22,14 30,14 24,19 26,27 18,23 10,27 12,19 6,14 14,14" fill="white" />
            </svg>
            <span className="text-slate-800 text-lg font-bold">starcircle</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-1">Welcome back</h2>
          <p className="text-slate-500 text-sm mb-8">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-shadow"
                placeholder="you@starcircle.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-shadow"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-slate-900 text-white rounded-lg font-semibold text-sm hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-sky-600 font-semibold hover:text-sky-700">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
