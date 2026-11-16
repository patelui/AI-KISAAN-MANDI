import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { setAuthSession } from '../utils/api';

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('farmer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const toggleMode = () => {
    setIsLogin((prev) => !prev);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin ? { email, password } : { email, password, role };

      const { data } = await api.post(endpoint, payload);

      setAuthSession(data.token, data.user);

      if (data.user.role === 'farmer') {
        navigate('/farmer-dashboard');
      } else {
        navigate('/buyer-dashboard');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Something went wrong';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-900 via-slate-950 to-slate-900 px-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900/80 border border-emerald-500/30 shadow-xl shadow-emerald-900/30 p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-emerald-300 tracking-tight">
            AI-Kisaan Mandi
          </h1>
          <p className="text-sm text-slate-300">
            Smart marketplace for <span className="font-medium">Farmers</span> and{' '}
            <span className="font-medium">Buyers</span>
          </p>
        </div>

        <div className="flex bg-slate-800 rounded-xl p-1 text-sm">
          <button
            type="button"
            className={`flex-1 py-2 rounded-lg transition ${
              isLogin
                ? 'bg-emerald-500 text-slate-950 font-semibold'
                : 'text-slate-200'
            }`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button
            type="button"
            className={`flex-1 py-2 rounded-lg transition ${
              !isLogin
                ? 'bg-emerald-500 text-slate-950 font-semibold'
                : 'text-slate-200'
            }`}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="font-medium">Select Role</span>
          <div className="inline-flex rounded-full bg-slate-800 p-1">
            <button
              type="button"
              className={`px-3 py-1 rounded-full transition ${
                role === 'farmer'
                  ? 'bg-emerald-500 text-slate-950 font-semibold'
                  : 'text-slate-200'
              }`}
              onClick={() => setRole('farmer')}
              disabled={isLogin}
            >
              Farmer
            </button>
            <button
              type="button"
              className={`px-3 py-1 rounded-full transition ${
                role === 'buyer'
                  ? 'bg-emerald-500 text-slate-950 font-semibold'
                  : 'text-slate-200'
              }`}
              onClick={() => setRole('buyer')}
              disabled={isLogin}
            >
              Buyer
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-200">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/80 focus:border-transparent"
              placeholder="farmer@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-200">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/80 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-950/40 border border-red-500/40 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center rounded-lg bg-emerald-500 text-slate-950 text-sm font-semibold py-2.5 shadow-lg shadow-emerald-900/50 hover:bg-emerald-400 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : isLogin ? 'Login' : `Sign up as ${role}`}
          </button>
        </form>

        <p className="text-[11px] text-slate-400 text-center">
          By continuing, you agree to the{' '}
          <span className="text-emerald-300">AI-Kisaan Mandi</span> terms.
        </p>
      </div>
    </div>
  );
}

export default AuthPage;

