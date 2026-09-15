import React, { useState } from 'react';
import { ArrowLeft, Building2, User, Mail, Lock } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext.tsx';

interface RegistrationViewProps {
  plan: 'RENTAL' | 'BUILDING' | 'REAL_ESTATE';
  onBack: () => void;
  onSuccess: () => void; // Proceed to checkout
}

export default function RegistrationView({ plan, onBack, onSuccess }: RegistrationViewProps) {
  const { t, locale: language, setLocale } = useLanguage();
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', organizationName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // 1. Register in our PostgreSQL database using custom JWT auth
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, plan })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      
      // Save the returned token
      if (data.data?.token) {
        localStorage.setItem('buildingos_token', data.data.token);
      }
      
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <button onClick={onBack} className="absolute top-6 left-6 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
        <ArrowLeft size={20} /> {language === 'en' ? 'Back' : 'ተመለስ'}
      </button>

      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
            B
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {language === 'en' ? 'Create Your Account' : 'አዲስ አካውንት ይክፈቱ'}
          </h1>
          <p className="text-slate-500 mt-2">
            {language === 'en' 
              ? `Selected Package: ${plan === 'RENTAL' ? 'Rental Houses' : plan === 'BUILDING' ? 'Commercial Building' : 'Real Estate'}` 
              : `የተመረጠው ፓኬጅ: ${plan === 'RENTAL' ? 'የሚከራዩ ቤቶች' : plan === 'BUILDING' ? 'ህንፃ አስተዳደር' : 'ሪልስቴት አስተዳደር'}`}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {language === 'en' ? 'Full Name' : 'ሙሉ ስም'}
            </label>
            <div className="relative">
              <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" required
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                placeholder={language === 'en' ? 'John Doe' : 'አበበ በሶበላ'}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {language === 'en' ? 'Email Address' : 'ኢሜይል (Email)'}
            </label>
            <div className="relative">
              <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="email" required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                placeholder="admin@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {language === 'en' ? 'Password' : 'የይለፍ ቃል (Password)'}
            </label>
            <div className="relative">
              <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="password" required minLength={6}
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {language === 'en' ? 'Building / Organization Name' : 'የህንፃው / የድርጅቱ ስም'}
            </label>
            <div className="relative">
              <Building2 size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" required
                value={formData.organizationName}
                onChange={e => setFormData({...formData, organizationName: e.target.value})}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                placeholder={language === 'en' ? 'Apex Tower' : 'አፔክስ ህንፃ'}
              />
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full py-4 mt-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? (language === 'en' ? 'Creating...' : 'እየተፈጠረ ነው...') : (language === 'en' ? 'Create Account & Continue' : 'አካውንት ይክፈቱ እና ይቀጥሉ')}
          </button>
        </form>
      </div>
    </div>
  );
}

