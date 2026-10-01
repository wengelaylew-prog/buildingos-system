import React, { useState } from 'react';
import { ArrowLeft, Lock, Mail, KeyRound } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext.tsx';
import { useAuth } from '../../../context/AuthContext.tsx';

interface LoginViewProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function LoginView({ onBack, onSuccess }: LoginViewProps) {
  const { locale: language } = useLanguage();
  const { requestOtp, verifyOtp } = useAuth();
  
  const [stage, setStage] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await requestOtp(email);
      setStage('OTP');
    } catch (err: any) {
      setError(err.message || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await verifyOtp(email, otp);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
        <button 
          onClick={() => {
            if (stage === 'OTP') setStage('EMAIL');
            else onBack();
          }} 
          className="text-slate-400 hover:text-slate-600 mb-6 flex items-center gap-2 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>{language === 'en' ? 'Back' : 'ተመለስ'}</span>
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl shadow-lg shadow-blue-200">
            B
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {language === 'en' ? 'Welcome Back' : 'እንኳን ደህና መጡ'}
          </h1>
          <p className="text-slate-500 mt-2">
            {stage === 'EMAIL' 
              ? (language === 'en' ? 'Login with your email' : 'በኢሜልዎ ወደ ሲስተሙ ይግቡ') 
              : (language === 'en' ? 'Enter the code sent to your email' : 'ወደ ኢሜልዎ የተላከውን ኮድ ያስገቡ')}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100">
            {error}
          </div>
        )}

        {stage === 'EMAIL' ? (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {language === 'en' ? 'Email Address' : 'ኢሜል (Email)'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-blue-200 mt-4"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  {language === 'en' ? 'Sending Code...' : 'ኮድ በመላክ ላይ...'}
                </span>
              ) : (
                language === 'en' ? 'Send Code' : 'ኮድ ላክ (Send Code)'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {language === 'en' ? '6-Digit Code' : 'የማረጋገጫ ኮድ (6-Digit OTP)'}
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-center font-mono text-xl tracking-widest"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-blue-200 mt-4"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  {language === 'en' ? 'Verifying...' : 'በማረጋገጥ ላይ...'}
                </span>
              ) : (
                language === 'en' ? 'Login' : 'ግባ (Login)'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

