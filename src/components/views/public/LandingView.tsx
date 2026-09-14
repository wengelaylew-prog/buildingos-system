import React, { useEffect } from 'react';
import { Building2, Check, ArrowRight, Box, ShieldCheck, TrendingUp, Users, Phone, Home, DoorOpen } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2.5 rounded-xl">
              <Building2 className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">BuildingOS</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setLocale(language === 'en' ? 'am' : 'en')}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              {language === 'en' ? 'አማርኛ' : 'English'}
            </button>
            <button 
              onClick={onLogin}
              className="hidden sm:block text-slate-600 hover:text-slate-900 font-medium px-4 py-2"
            >
              {language === 'en' ? 'Login' : 'ግባ'}
            </button>
            <button 
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
            >
              {language === 'en' ? 'Get Started' : 'ጀምር'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 max-w-7xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight max-w-4xl mx-auto mb-6">
          {language === 'en' ? 
            'The Ultimate Property Management Platform' : 
            'የንብረት አስተዳደርዎን ወደ ላቀ ደረጃ ያሳድጉ'}
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12">
          {language === 'en' ? 
            'Manage everything in one place. Perfect for commercial buildings, real estate developments, and rental houses.' : 
            'በአንድ ሲስተም ብቻ! ህንፃ፣ ሪልስቴት እና የሚከራዩ ቤቶችን በዘመናዊ መልኩ ያስተዳድሩ። ጊዜዎን ይቆጥቡ፣ ገቢዎን ያሳድጉ።'}
        </p>

        {/* 3 Categories Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left mb-16">
          {/* Card 1: Building Management */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <Building2 className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              {language === 'en' ? 'Commercial Buildings' : '1. ህንፃ አስተዳደር'}
            </h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              {language === 'en' ? 
                'Manage multi-story commercial buildings, offices, shops, and complex tenant structures.' : 
                'ለንግድ ህንፃዎች፣ ለቢሮዎች እና ለሱቆች የተዘጋጀ። የተወሳሰቡ የኪራይ ውሎችን እና ወርሃዊ ክፍያዎችን በቀላሉ ይቆጣጠሩ።'}
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-sm text-slate-700">
                <Check className="w-4 h-4 text-green-500" /> {language === 'en' ? 'Floor-by-floor mapping' : 'የወለል በወለል ካርታ (3D)'}
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-700">
                <Check className="w-4 h-4 text-green-500" /> {language === 'en' ? 'Shop & Office leasing' : 'የሱቅ እና ቢሮ ኪራይ አስተዳደር'}
              </li>
            </ul>
          </div>

          {/* Card 2: Real Estate Management */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">POPULAR</div>
            <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
              <Box className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              {language === 'en' ? 'Real Estate' : '2. ሪልስቴት አስተዳደር'}
            </h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              {language === 'en' ? 
                'Perfect for large apartment complexes, residential developments, and property portfolios.' : 
                'ለሰፋፊ የአፓርትመንት ህንፃዎች እና ለሪልስቴት አልሚዎች። የብዙ ቤቶችን እና የነዋሪዎችን መረጃ በአንድ ቦታ ይያዙ።'}
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-sm text-slate-700">
                <Check className="w-4 h-4 text-green-500" /> {language === 'en' ? 'Apartment unit tracking' : 'የአፓርትመንት ቤቶች ክትትል'}
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-700">
                <Check className="w-4 h-4 text-green-500" /> {language === 'en' ? 'Maintenance requests' : 'የጥገና እና የጥበቃ ሪፖርት'}
              </li>
            </ul>
          </div>

          {/* Card 3: Rental Houses Management */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-14 h-14 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center mb-6">
              <Home className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              {language === 'en' ? 'Rental Houses' : '3. ቤቶች አስተዳደር'}
            </h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              {language === 'en' ? 
                'Manage individual rental houses, villas, and compounds with ease and transparency.' : 
                'ለግል የሚከራዩ ቤቶች፣ ቪላዎች፣ ጊቢዎች እና ኮንዶሚኒየሞች። የውሃ፣ የመብራት እና የኪራይ ክፍያዎችን በቴሌግራም ያስታውሱ።'}
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-sm text-slate-700">
                <Check className="w-4 h-4 text-green-500" /> {language === 'en' ? 'Utility bills splitting' : 'የውሃ እና መብራት ክፍያ'}
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-700">
                <Check className="w-4 h-4 text-green-500" /> {language === 'en' ? 'Telegram Bot integration' : 'በቴሌግራም ቦት ማሳሰቢያ'}
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2 group"
          >
            {language === 'en' ? 'Start Free Trial' : 'አሁኑኑ ይጀምሩ'} 
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={onLogin}
            className="w-full sm:w-auto bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-colors flex items-center justify-center"
          >
            {language === 'en' ? 'Login to Dashboard' : 'ወደ ዳሽቦርድ ይግቡ'}
          </button>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="py-12 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-extrabold text-slate-900 mb-1">AI</div>
            <div className="text-sm text-slate-500">{language === 'en' ? 'Smart Assistant' : 'የ ቻት ረዳት'}</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 mb-1">3D</div>
            <div className="text-sm text-slate-500">{language === 'en' ? 'Building Mapping' : 'የህንፃ ካርታ'}</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 mb-1">Bot</div>
            <div className="text-sm text-slate-500">{language === 'en' ? 'Telegram Native' : 'የቴሌግራም ቦት'}</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 mb-1">100%</div>
            <div className="text-sm text-slate-500">{language === 'en' ? 'Secure Data' : 'የተጠበቀ መረጃ'}</div>
          </div>
        </div>
      </section>

      {/* Pricing Packages */}
      <section className="py-24 bg-slate-50" id="pricing">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              {language === 'en' ? 'Simple, Transparent Pricing' : 'ቀላል እና ግልፅ የክፍያ አማራጮች'}
            </h2>
            <p className="text-lg text-slate-600">
              {language === 'en' ? 'Choose the plan that fits your property management needs.' : 'ለእርስዎ ድርጅት የሚስማማውን እቅድ ይምረጡ።'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Monthly */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{language === 'en' ? 'Monthly' : 'ወርሃዊ'}</h3>
              <p className="text-slate-500 mb-6">{language === 'en' ? 'Perfect for testing the platform.' : 'ሲስተሙን ለመሞከር እና ለትንሽ ጊዜ'}
              </p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-slate-900">1,500</span>
                <span className="text-slate-500 font-medium"> ETB / {language === 'en' ? 'mo' : 'በወር'}</span>
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
                {language === 'en' ? 'Best Value' : 'በጣም ተመራጭ'}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{language === 'en' ? '1 Year Plan' : 'የ 1 አመት እቅድ'}</h3>
              <p className="text-blue-100 mb-6">{language === 'en' ? 'Save 20% for long-term management.' : '20% ቅናሽ ያገኛሉ! ለረጅም ጊዜ ስራ'}
              </p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-white">14,400</span>
                <span className="text-blue-200 font-medium"> ETB / {language === 'en' ? 'yr' : 'በአመት'}</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3"><Check size={20} className="text-blue-300 shrink-0" /> <span className="text-white">All Core Features</span></li>
                <li className="flex items-start gap-3"><Check size={20} className="text-blue-300 shrink-0" /> <span className="text-white font-bold">Advanced 3D Building Viewer</span></li>
                <li className="flex items-start gap-3"><Check size={20} className="text-blue-300 shrink-0" /> <span className="text-white font-bold">Upcoming AI Assistant</span></li>
                <li className="flex items-start gap-3"><Check size={20} className="text-blue-300 shrink-0" /> <span className="text-white">Priority 24/7 Support</span></li>
              </ul>
              <button onClick={() => onSelectPlan('YEARLY')} className="w-full py-3 rounded-xl font-bold bg-white text-blue-600 hover:bg-slate-50 transition-colors">
                {language === 'en' ? 'Select Yearly' : 'የአመቱን ይምረጡ'}
              </button>
            </div>

            {/* 6 Months */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{language === 'en' ? '6 Months' : 'የ 6 ወር'}</h3>
              <p className="text-slate-500 mb-6">{language === 'en' ? 'Balance commitment and cost.' : 'አማካኝ ቅናሽ ያለው እቅድ'}
              </p>
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
                {language === 'en' ? 'Select 6 Months' : 'የ 6 ወሩን ይምረጡ'}
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
