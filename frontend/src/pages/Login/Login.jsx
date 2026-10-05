import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Trophy, ArrowRight, Shield, UserCheck, Sparkles } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 text-white shadow-xl shadow-indigo-500/25 mb-4">
          <Trophy className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Sports Management System
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Sign in to access trials, dynamic registrations, and player selections
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-white/20">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials Quick Selector */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>One-Click Demo Credentials</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'admin123')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 text-left transition"
              >
                <div className="font-bold text-slate-800">Admin</div>
                <div className="text-[10px] text-slate-400">admin / admin123</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('sports1', 'sports123')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 text-left transition"
              >
                <div className="font-bold text-slate-800">Sports Coord</div>
                <div className="text-[10px] text-slate-400">sports1 / sports123</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('branch1', 'branch123')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 text-left transition"
              >
                <div className="font-bold text-slate-800">Branch Coord</div>
                <div className="text-[10px] text-slate-400">branch1 / branch123</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('student1', 'student123')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 text-left transition"
              >
                <div className="font-bold text-slate-800">Student Coord</div>
                <div className="text-[10px] text-slate-400">student1 / student123</div>
              </button>
            </div>
          </div>

          {/* Student public registration link */}
          <div className="mt-4 text-center">
            <a
              href="/public-trials"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
            >
              Are you a student? View open trials & submit registration →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
