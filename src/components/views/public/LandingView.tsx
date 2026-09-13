import React, { useEffect } from 'react';
import { Building2, Check, ArrowRight, Box, ShieldCheck, TrendingUp, Users, Phone } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext.tsx';

interface LandingViewProps {
  onLogin: () => void;
  onSelectPlan: (plan: 'MONTHLY' | 'BI_ANNUAL' | 'YEARLY') => void;
}

export default function LandingView({ onLogin, onSelectPlan }: LandingViewProps) {
  const { t, locale: language, setLocale } = useLanguage();

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg && tg.initData) {
      tg.ready();
      tg.expand();
      document.documentElement.style.setProperty('--tg-theme-bg-color', tg.backgroundColor || '#f8fafc');
      document.documentElement.style.setProperty('--tg-theme-text-color', tg.textColor || '#0f172a');
    }
  }, []);

  return (
    <div className="min-h-screen bg-[var(--tg-theme-bg-color,#f8fafc)] text-[var(--tg-theme-text-color,#0f172a)] font-sans">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            B
          </div>
          <span className="text-xl font-bold tracking-tight">BuildingOS</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setLocale(language === 'en' ? 'am' : 'en')}
            className="text-sm font-medium hover:text-indigo-600 transition-colors"
          >
            {language === 'en' ? 'አማርኛ' : 'English'}
          </button>
          <button onClick={onLogin} className="text-sm font-medium text-blue-600 hover:text-blue-700">
            {language === 'en' ? 'Log in' : 'ግባ (Log in)'}
          </button>
          <button 
            onClick={() => onSelectPlan('MONTHLY')}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            {language === 'en' ? 'Get Started' : 'አሁን ይጀምሩ'}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        <div className="absolute inset-0 bg-blue-50/50 -z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-100/50 blur-3xl rounded-full -z-10" />
        
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mb-6">
          {language === 'en' 
            ? 'The Ultimate Platform to Manage Your Buildings & Tenants' 
            : 'የህንፃ እና የተከራይ አስተዳደርን የሚያዘምን ዘመናዊ ሲስተም'}
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mb-10">
          {language === 'en'
            ? 'Streamline billing, track maintenance, communicate with tenants, and visualize your properties in stunning 3D. Everything you need in one place.'
            : 'ክፍያዎችን ለመሰብሰብ፣ ጥገናዎችን ለመከታተል እና ህንፃዎን በ 3D (ባለ 3-ልኬት) ቴክኖሎጂ ለማስተዳደር የተሰራ።'}
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => onSelectPlan('MONTHLY')}
            className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 hover:scale-105"
          >
            {language === 'en' ? 'Start Your Property Today' : 'የህንፃዎን አስተዳደር አሁን ይጀምሩ'} <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Premium Features Highlight (3D) */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold mb-6">
              <Box size={16} /> {language === 'en' ? 'Premium Feature' : 'ልዩ ቴክኖሎጂ (Premium)'}
            </div>
            <h2 className="text-3xl font-bold mb-4">
              {language === 'en' ? 'Immersive 3D Building Viewer' : 'የህንፃዎን ክፍሎች በ 3D ይመልከቱ'}
            </h2>
            <p className="text-slate-600 text-lg mb-6 leading-relaxed">
              {language === 'en'
                ? 'Get a bird\'s eye view of your property. Click on floors and units in a fully interactive 3D model to see occupancy status, pending payments, and maintenance alerts instantly.'
                : 'ከወረቀት እና ከተራ ሪፖርት አልፈው ህንፃዎን በ 3D (3-Dimensional) ቴክኖሎጂ ያስተዳድሩ። ባዶ ክፍሎችን፣ የክፍያ ሁኔታን እና የጥገና ጥያቄዎችን በህንፃው ሞዴል ላይ በቀጥታ ይቆጣጠሩ።'}
            </p>
            <ul className="space-y-3">
              {['Real-time occupancy coloring', 'Interactive floor-by-floor breakdown', 'Instant financial overview per unit'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                  <Check size={20} className="text-green-500" /> 
                  {language === 'am' && i === 0 ? 'ባዶ እና የተከራዩ ክፍሎችን በከለር መለየት' : 
                   language === 'am' && i === 1 ? 'እያንዳንዱን ወለል (Floor) ለየብቻ ማየት' : 
                   language === 'am' && i === 2 ? 'የእያንዳንዱን ክፍል የገንዘብ እና ክፍያ መረጃ' : item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-slate-100 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 h-[400px] flex items-center justify-center relative">
            {/* Mock 3D Viewer Image / Placeholder */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-900 to-indigo-900 opacity-90 flex items-center justify-center flex-col text-white">
               <Box size={64} className="mb-4 opacity-50" />
               <span className="text-xl font-bold opacity-75">Interactive 3D Engine</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Packages */}
      <section className="py-24 bg-slate-50" id="pricing">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              {language === 'en' ? 'Simple, Transparent Pricing' : 'ግልፅ እና ተመጣጣኝ የዋጋ ፓኬጆች'}
            </h2>
            <p className="text-lg text-slate-600">
              {language === 'en' ? 'Choose the plan that fits your property management needs.' : 'ለእርስዎ ህንፃ አስተዳደር የሚስማማውን ፓኬጅ ይምረጡ።'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Monthly */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{language === 'en' ? 'Monthly' : 'ወርሃዊ'}</h3>
              <p className="text-slate-500 mb-6">{language === 'en' ? 'Perfect for testing the platform.' : 'ሲስተሙን ለመሞከር እና ለአጭር ጊዜ'}</p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-slate-900">1,500</span>
                <span className="text-slate-500 font-medium"> ETB / {language === 'en' ? 'mo' : 'ወር'}</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3"><Check size={20} className="text-blue-600 shrink-0" /> <span className="text-slate-700">All Core Features</span></li>
                <li className="flex items-start gap-3"><Check size={20} className="text-blue-600 shrink-0" /> <span className="text-slate-700">3D Building Viewer</span></li>
                <li className="flex items-start gap-3"><Check size={20} className="text-blue-600 shrink-0" /> <span className="text-slate-700">Tenant Telegram Bot</span></li>
                <li className="flex items-start gap-3"><Check size={20} className="text-blue-600 shrink-0" /> <span className="text-slate-700">Email Support</span></li>
              </ul>
              <button onClick={() => onSelectPlan('MONTHLY')} className="w-full py-3 rounded-xl font-bold border-2 border-slate-200 text-slate-900 hover:border-blue-600 hover:text-blue-600 transition-colors">
                {language === 'en' ? 'Select Monthly' : 'ወርሃዊን ይምረጡ'}
              </button>
            </div>

            {/* Yearly (Highlighted) */}
            <div className="bg-blue-600 rounded-3xl p-8 shadow-xl shadow-blue-200 border border-blue-600 flex flex-col relative transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider shadow-sm">
                {language === 'en' ? 'Best Value' : 'አዋጭ ፓኬጅ'}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{language === 'en' ? '1 Year Plan' : 'የ 1 አመት ፓኬጅ'}</h3>
              <p className="text-blue-100 mb-6">{language === 'en' ? 'Save 20% for long-term management.' : '20% ቅናሽ ያግኙ! ለረጅም ጊዜ አስተዳደር'}</p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-white">14,400</span>
                <span className="text-blue-200 font-medium"> ETB / {language === 'en' ? 'yr' : 'አመት'}</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3"><Check size={20} className="text-blue-300 shrink-0" /> <span className="text-white">All Core Features</span></li>
                <li className="flex items-start gap-3"><Check size={20} className="text-blue-300 shrink-0" /> <span className="text-white font-bold">Advanced 3D Building Viewer</span></li>
                <li className="flex items-start gap-3"><Check size={20} className="text-blue-300 shrink-0" /> <span className="text-white font-bold">Upcoming AI Assistant</span></li>
                <li className="flex items-start gap-3"><Check size={20} className="text-blue-300 shrink-0" /> <span className="text-white">Priority 24/7 Support</span></li>
              </ul>
              <button onClick={() => onSelectPlan('YEARLY')} className="w-full py-3 rounded-xl font-bold bg-white text-blue-600 hover:bg-slate-50 transition-colors">
                {language === 'en' ? 'Select Yearly' : 'የአመት ፓኬጅ ይምረጡ'}
              </button>
            </div>

            {/* 6 Months */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{language === 'en' ? '6 Months' : 'የ 6 ወር'}</h3>
              <p className="text-slate-500 mb-6">{language === 'en' ? 'Balance commitment and cost.' : 'መካከለኛ ቅናሽ ያለው ፓኬጅ'}</p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-slate-900">8,000</span>
                <span className="text-slate-500 font-medium"> ETB / 6 {language === 'en' ? 'mo' : 'ወር'}</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3"><Check size={20} className="text-blue-600 shrink-0" /> <span className="text-slate-700">All Core Features</span></li>
                <li className="flex items-start gap-3"><Check size={20} className="text-blue-600 shrink-0" /> <span className="text-slate-700">3D Building Viewer</span></li>
                <li className="flex items-start gap-3"><Check size={20} className="text-blue-600 shrink-0" /> <span className="text-slate-700">Standard Support</span></li>
              </ul>
              <button onClick={() => onSelectPlan('BI_ANNUAL')} className="w-full py-3 rounded-xl font-bold border-2 border-slate-200 text-slate-900 hover:border-blue-600 hover:text-blue-600 transition-colors">
                {language === 'en' ? 'Select 6 Months' : 'የ 6 ወር ይምረጡ'}
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-slate-900 py-12 text-center text-slate-400">
        <p>powered by wengel aylew. &copy; {new Date().getFullYear()} BuildingOS. All rights reserved.</p>
      </footer>
    </div>
  );
}

