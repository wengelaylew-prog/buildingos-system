import React, { useEffect } from 'react';
import { Building2, Check, ArrowRight, Box, ShieldCheck, TrendingUp, Users, Phone, Building, DoorOpen } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext.tsx';

interface LandingViewProps {
  onLogin: () => void;
  onSelectPlan: (plan: 'RENTAL' | 'BUILDING' | 'REAL_ESTATE') => void;
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
              onClick={() => document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth' })}
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

        
        {/* Services Marquee / Moving Images */}
        <div className="relative flex overflow-hidden mb-16 w-full max-w-7xl mx-auto group">
          <style>
            {`
              @keyframes marquee {
                0% { transform: translateX(0%); }
                100% { transform: translateX(-100%); }
              }
              .animate-marquee {
                animation: marquee 35s linear infinite;
              }
              .group:hover .animate-marquee {
                animation-play-state: paused;
              }
            `}
          </style>
          
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-6 px-3 animate-marquee shrink-0">
               <div className="relative rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                 <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=400" className="w-64 h-44 object-cover" alt="Modern Office" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                   <span className="text-white font-bold text-sm">{language === 'en' ? 'Smart Offices' : 'ዘመናዊ ቢሮዎች'}</span>
                 </div>
               </div>
               <div className="relative rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                 <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=400" className="w-64 h-44 object-cover" alt="Real Estate" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                   <span className="text-white font-bold text-sm">{language === 'en' ? 'Real Estate' : 'ሪል ስቴት'}</span>
                 </div>
               </div>
               <div className="relative rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                 <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400" className="w-64 h-44 object-cover" alt="Commercial Building" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                   <span className="text-white font-bold text-sm">{language === 'en' ? 'Commercial Buildings' : 'የንግድ ህንፃዎች'}</span>
                 </div>
               </div>
               <div className="relative rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                 <img src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=400" className="w-64 h-44 object-cover" alt="Apartment Complex" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                   <span className="text-white font-bold text-sm">{language === 'en' ? 'Apartments' : 'አፓርታማዎች'}</span>
                 </div>
               </div>
               <div className="relative rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                 <img src="https://images.unsplash.com/photo-1416331108676-a22ccb276eac?auto=format&fit=crop&q=80&w=400" className="w-64 h-44 object-cover" alt="Rental Villa" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                   <span className="text-white font-bold text-sm">{language === 'en' ? 'Rental Villas' : 'የሚከራዩ ቪላዎች'}</span>
                 </div>
               </div>
               <div className="relative rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                 <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=400" className="w-64 h-44 object-cover" alt="Modern House" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                   <span className="text-white font-bold text-sm">{language === 'en' ? 'Residential Homes' : 'የመኖሪያ ቤቶች'}</span>
                 </div>
               </div>
            </div>
          ))}

          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none"></div>
        </div>

          {/* Pricing Packages Embedded in Hero */}
        <div id="packages" className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left mb-16">
            {/* Building Management (Highlighted) */}
            <div className="bg-blue-600 rounded-3xl p-8 shadow-xl shadow-blue-200 border border-blue-600 flex flex-col relative transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider shadow-sm">
                {language === 'en' ? 'Most Popular' : 'በጣም ተመራጭ'}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{language === 'en' ? 'Commercial Building' : 'ህንፃ አስተዳደር'}</h3>
              <p className="text-blue-100 mb-6">{language === 'en' ? 'For multi-story commercial buildings and offices.' : 'ለንግድ ህንፃዎች፣ ለቢሮዎች እና ለሱቆች የተዘጋጀ'}
              </p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-white">20,000</span>
                <span className="text-blue-200 font-medium"> ETB / {language === 'en' ? 'mo' : 'በወር'}</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3"><Check size={20} className="text-blue-300 shrink-0" /> <span className="text-white">All Core Features</span></li>
                <li className="flex items-start gap-3"><Check size={20} className="text-blue-300 shrink-0" /> <span className="text-white font-bold">Interactive 3D Viewer</span></li>
                <li className="flex items-start gap-3"><Check size={20} className="text-blue-300 shrink-0" /> <span className="text-white font-bold">Smart AI Assistant</span></li>
                <li className="flex items-start gap-3"><Check size={20} className="text-blue-300 shrink-0" /> <span className="text-white">Priority 24/7 Support</span></li>
              </ul>
              <button onClick={() => onSelectPlan('BUILDING')} className="w-full py-3 rounded-xl font-bold bg-white text-blue-600 hover:bg-slate-50 transition-colors">
                {language === 'en' ? 'Select Building Package' : 'ይህንን ይምረጡ'}
              </button>
            </div>

            {/* Real Estate */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{language === 'en' ? 'Real Estate' : 'ሪልስቴት አስተዳደር'}</h3>
              <p className="text-slate-500 mb-6">{language === 'en' ? 'For apartment complexes and real estate developers.' : 'ለሰፋፊ የአፓርትመንት ህንፃዎች እና ለሪልስቴት አልሚዎች'}
              </p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-slate-900">30,000</span>
                <span className="text-slate-500 font-medium"> ETB / {language === 'en' ? 'mo' : 'በወር'}</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3"><Check size={20} className="text-green-500 shrink-0" /> <span className="text-slate-700">All Core Features</span></li>
                <li className="flex items-start gap-3"><Check size={20} className="text-green-500 shrink-0" /> <span className="text-slate-700">Advanced 3D & AI</span></li>
                <li className="flex items-start gap-3"><Check size={20} className="text-green-500 shrink-0" /> <span className="text-slate-700">Multi-Property Support</span></li>
                <li className="flex items-start gap-3"><Check size={20} className="text-green-500 shrink-0" /> <span className="text-slate-700">Dedicated Account Manager</span></li>
              </ul>
              <button onClick={() => onSelectPlan('REAL_ESTATE')} className="w-full py-3 rounded-xl font-bold border-2 border-slate-200 text-slate-900 hover:border-blue-600 hover:text-blue-600 transition-colors">
                {language === 'en' ? 'Select Real Estate Package' : 'ይህንን ይምረጡ'}
              </button>
            </div>
          {/* Rental Houses */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{language === 'en' ? 'Rental Houses' : 'የሚከራዩ ቤቶች'}</h3>
              <p className="text-slate-500 mb-6">{language === 'en' ? 'For individual residential houses and villas.' : 'ለግል የሚከራዩ ቤቶች፣ ቪላዎች እና ጊቢዎች'}
              </p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-slate-900">5,000</span>
                <span className="text-slate-500 font-medium"> ETB / {language === 'en' ? 'mo' : 'በወር'}</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3"><Check size={20} className="text-green-500 shrink-0" /> <span className="text-slate-700">All Core Features</span></li>
                <li className="flex items-start gap-3"><Check size={20} className="text-green-500 shrink-0" /> <span className="text-slate-700">Telegram Bot Integration</span></li>
                <li className="flex items-start gap-3"><Check size={20} className="text-green-500 shrink-0" /> <span className="text-slate-700">Utility Bills Management</span></li>
                <li className="flex items-start gap-3"><Check size={20} className="text-green-500 shrink-0" /> <span className="text-slate-700">Standard Support</span></li>
              </ul>
              <button onClick={() => onSelectPlan('RENTAL')} className="w-full py-3 rounded-xl font-bold border-2 border-slate-200 text-slate-900 hover:border-blue-600 hover:text-blue-600 transition-colors">
                {language === 'en' ? 'Select Rental Package' : 'ይህንን ይምረጡ'}
              </button>
            </div>

            </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth' })}
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

      {/* Footer */}
      <footer className="bg-slate-900 py-12 text-center text-slate-400">
        <p>powered by wengel aylew. &copy; {new Date().getFullYear()} BuildingOS. All rights reserved.</p>
      </footer>
    </div>
  );
}
