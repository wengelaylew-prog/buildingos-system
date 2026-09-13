import React, { useState, useRef } from 'react';
import { ArrowLeft, Building2, Upload, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext.tsx';
import { api } from '../../../api/client.ts';

interface CheckoutViewProps {
  plan: 'MONTHLY' | 'BI_ANNUAL' | 'YEARLY';
  onBack: () => void;
  onDashboard: () => void;
}

export default function CheckoutView({ plan, onBack, onDashboard }: CheckoutViewProps) {
  const { t, locale: language, setLocale } = useLanguage();
  const [transactionCode, setTransactionCode] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getPrice = () => {
    if (plan === 'MONTHLY') return '1,500 ETB';
    if (plan === 'BI_ANNUAL') return '8,000 ETB';
    return '14,400 ETB';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError(language === 'en' ? 'Please upload the payment receipt' : 'እባክዎ የከፈሉበትን ደረሰኝ (Screenshot) ያስገቡ');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('plan', plan);
      formData.append('transactionCode', transactionCode);
      formData.append('receipt', file);

      // Note: We assume the user is logged in here (after registration and Firebase login step in App.tsx)
      const res = await fetch('/api/v1/subscriptions/checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Payment submission failed');
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white max-w-md p-10 rounded-3xl shadow-xl border border-slate-100 text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            {language === 'en' ? 'Payment Submitted!' : 'ክፍያዎ በተሳካ ሁኔታ ተልኳል!'}
          </h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            {language === 'en' 
              ? 'Thank you! Your payment receipt has been received. Our admin team will verify the transaction and activate your account shortly.' 
              : 'እናመሰግናለን! ያስገቡት ደረሰኝ እና መረጃ ደርሶናል። አድሚኖቻችን ክፍያውን አረጋግጠው አካውንትዎን በቅርቡ ክፍት (Active) ያደርጉታል።'}
          </p>
          <button onClick={onDashboard} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all">
            {language === 'en' ? 'Go to Dashboard' : 'ወደ ዳሽቦርድ ይግቡ'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 py-12">
      <button onClick={onBack} className="absolute top-6 left-6 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
        <ArrowLeft size={20} /> {language === 'en' ? 'Back' : 'ተመለስ'}
      </button>

      <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 p-8 text-center text-white">
          <h1 className="text-2xl font-bold mb-2">
            {language === 'en' ? 'Complete Your Payment' : 'ክፍያዎን ያጠናቅቁ'}
          </h1>
          <p className="text-blue-100 opacity-90">
            {language === 'en' ? `Plan: ${plan} — Total: ${getPrice()}` : `የመረጡት ፓኬጅ: ${plan} — ጠቅላላ ክፍያ: ${getPrice()}`}
          </p>
        </div>

        <div className="p-8">
          {/* Bank Info */}
          <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-4 text-center">
              {language === 'en' ? 'Transfer exact amount to:' : 'ከታች ወዳለው የባንክ አካውንት ክፍያዎን ይፈፅሙ፡'}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <span className="text-slate-500 text-sm">Bank (ባንክ)</span>
                <span className="font-bold text-slate-900">Commercial Bank of Ethiopia</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <span className="text-slate-500 text-sm">Account Name (ስም)</span>
                <span className="font-bold text-slate-900">BuildingOS Tech</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">Account No (አካውንት ቁጥር)</span>
                <span className="font-mono font-bold text-blue-600 text-lg">1000123456789</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {language === 'en' ? 'Transaction ID / Reference Code' : 'የትራንዛክሽን ኮድ (Transaction ID)'}
              </label>
              <input 
                type="text" required
                value={transactionCode}
                onChange={e => setTransactionCode(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-mono"
                placeholder="e.g. FT231..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {language === 'en' ? 'Upload Payment Screenshot' : 'የከፈሉበትን ደረሰኝ ምስል (Screenshot) ያስገቡ'}
              </label>
              
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  file ? 'border-green-500 bg-green-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                {file ? (
                  <div className="flex flex-col items-center text-green-700">
                    <CheckCircle2 size={32} className="mb-2" />
                    <span className="font-medium text-sm">{file.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-slate-500">
                    <Upload size={32} className="mb-2 text-blue-500" />
                    <span className="font-medium text-sm">
                      {language === 'en' ? 'Click to upload receipt image' : 'ምስል ለማስገባት እዚህ ይጫኑ'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full py-4 mt-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-70"
            >
              {loading ? (language === 'en' ? 'Submitting...' : 'እየተላከ ነው...') : (language === 'en' ? 'Submit Payment for Verification' : 'ክፍያውን አረጋግጥ እና ላክ')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

