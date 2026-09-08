import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../api/client.ts';

export function TelegramLinkView({ initData, onLinked }: { initData: string | null; onLinked: () => void }) {
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginAndLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initData) return;
    setLoading(true);
    setError('');
    
    try {
      // 1. Login to BuildingOS (Firebase)
      await login(email, password);
      
      // 2. We now have a standard BuildingOS session (api client uses Bearer token).
      // Call the linking endpoint with initData.
      await api.linkTelegramAccount(initData);
      
      // Successfully linked!
      onLinked();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[var(--tg-theme-bg-color,#f8fafc)] text-[var(--tg-theme-text-color,#000000)]">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-xl font-bold text-center mb-2">Connect BuildingOS</h2>
        <p className="text-sm text-slate-500 text-center mb-6">
          Sign in to your BuildingOS tenant account to connect it with Telegram.
        </p>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleLoginAndLink} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-[var(--tg-theme-button-color,#3b82f6)] focus:border-transparent outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-[var(--tg-theme-button-color,#3b82f6)] focus:border-transparent outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[var(--tg-theme-button-color,#3b82f6)] text-[var(--tg-theme-button-text-color,#ffffff)] rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Connecting...' : 'Connect Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
