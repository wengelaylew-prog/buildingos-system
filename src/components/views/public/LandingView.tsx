import React, { useEffect, useState } from 'react';
import { Building2, Check, ArrowRight, ShieldCheck, TrendingUp, Users, Phone, Building, DoorOpen, Activity, Globe, Clock, Eye, Settings, ChevronRight, Sparkles, Shield, X } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext.tsx';

type PlanType = 'RENTAL_BASIC' | 'RENTAL_STANDARD' | 'RENTAL_PREMIUM' | 'BUILDING_BASIC' | 'BUILDING_STANDARD' | 'BUILDING_PREMIUM' | 'REAL_ESTATE_BASIC' | 'REAL_ESTATE_STANDARD' | 'REAL_ESTATE_PREMIUM';

interface LandingViewProps {
  onLogin: () => void;
  onSelectPlan: (plan: PlanType) => void;
}

type CategoryKey = 'BUILDING' | 'REAL_ESTATE' | 'RENTAL';

const categories: {
  key: CategoryKey;
  icon: React.ReactNode;
  gradient: string;
  glowColor: string;
  accentColor: string;
  image: string;
  titleEn: string;
  titleAm: string;
  taglineEn: string;
  taglineAm: string;
  features: { en: string; am: string; icon: React.ReactNode }[];
  plans: { tier: 'BASIC' | 'STANDARD' | 'PREMIUM'; nameEn: string; nameAm: string; price: number; perks: string[] }[];
}[] = [
  {
    key: 'BUILDING',
    icon: <Building2 className="w-8 h-8" />,
    gradient: 'from-blue-600 via-blue-500 to-indigo-600',
    glowColor: 'shadow-blue-500/30',
    accentColor: 'text-blue-400',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800',
    titleEn: 'Commercial Buildings',
    titleAm: 'ህንፃ አስተዳደር',
    taglineEn: 'Multi-story offices, shops & complex tenant structures — fully automated.',
    taglineAm: 'ለንግድ ህንፃዎች፣ ቢሮዎች፣ ሱቆች እና ውስብስብ የተከራዮች አወቃቀሮች።',
    features: [
      { en: 'Interactive 3D Building Map', am: 'ተሳታፊ 3D የህንፃ ካርታ', icon: <Globe className="w-4 h-4" /> },
      { en: 'Floor-by-floor Tenant Management', am: 'ወለል በወለል ተከራይ አስተዳደር', icon: <Building className="w-4 h-4" /> },
      { en: 'Smart AI Security Cameras', am: 'AI የደህንነት ካሜራ ክትትል', icon: <Eye className="w-4 h-4" /> },
      { en: 'Telegram Bot Integration', am: 'ቴሌግራም ቦት ውህደት', icon: <Settings className="w-4 h-4" /> },
      { en: 'Automated Rent & Utilities', am: 'አውቶማቲክ ክፍያ እና ዩቲሊቲ', icon: <Activity className="w-4 h-4" /> },
      { en: 'ID Scan & Access Logs', am: 'መታወቂያ ስካን እና የመግቢያ ምዝግብ', icon: <ShieldCheck className="w-4 h-4" /> },
      { en: 'Maintenance Request Tracking', am: 'የጥገና ጥያቄ ክትትል', icon: <Clock className="w-4 h-4" /> },
      { en: '24/7 Priority Support', am: '24/7 ቅድሚያ ድጋፍ', icon: <Phone className="w-4 h-4" /> },
    ],
    plans: [
      { tier: 'BASIC', nameEn: 'Starter', nameAm: 'መነሻ', price: 10000, perks: ['Up to 1 Building', '50 Units', 'Core Features', 'Email Support'] },
      { tier: 'STANDARD', nameEn: 'Professional', nameAm: 'ሙያዊ', price: 20000, perks: ['Up to 5 Buildings', '500 Units', '3D Viewer + AI', 'Telegram Bot', 'Priority Support'] },
      { tier: 'PREMIUM', nameEn: 'Enterprise', nameAm: 'ኢንተርፕራይዝ', price: 30000, perks: ['Unlimited Buildings', 'Unlimited Units', 'Full AI + Security', 'Custom Integrations', '24/7 Dedicated Manager'] },
    ],
  },
  {
    key: 'REAL_ESTATE',
    icon: <TrendingUp className="w-8 h-8" />,
    gradient: 'from-emerald-600 via-teal-500 to-cyan-600',
    glowColor: 'shadow-emerald-500/30',
    accentColor: 'text-emerald-400',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800',
    titleEn: 'Real Estate Management',
    titleAm: 'የሪልስቴት አስተዳደር',
    taglineEn: 'Large apartment complexes, residential developments & property portfolios.',
    taglineAm: 'ትልቅ አፓርታማ ውስብስቦች፣ የቤቶች ልማቶች እና ብዝሃ ንብረት ፖርትፎሊዮ።',
    features: [
      { en: 'Multi-Property Portfolio', am: 'ብዝሃ ንብረት ፖርትፎሊዮ', icon: <Globe className="w-4 h-4" /> },
      { en: 'Apartment Unit Tracking', am: 'አፓርታማ ክፍሎች ክትትል', icon: <Building className="w-4 h-4" /> },
      { en: 'Advanced 3D Visualization', am: 'ከፍተኛ 3D የምስል ማሳያ', icon: <Eye className="w-4 h-4" /> },
      { en: 'AI Sales & Rental Insights', am: 'AI ሽያጭ እና ኪራይ ትንተና', icon: <Settings className="w-4 h-4" /> },
      { en: 'Lease & Contract Management', am: 'ሊዝ እና ውሎች አስተዳደር', icon: <Shield className="w-4 h-4" /> },
      { en: 'Financial Reporting Dashboard', am: 'የፋይናንሺያል ሪፖርት ዳሽቦርድ', icon: <TrendingUp className="w-4 h-4" /> },
      { en: 'Maintenance & Inspection Tools', am: 'የጥገና እና ቁጥጥር መሣሪያ', icon: <Clock className="w-4 h-4" /> },
      { en: 'Telegram Bot + WhatsApp Alerts', am: 'ቴሌግራም ቦት + ዋትስአፕ ማስጠንቀቂያ', icon: <Phone className="w-4 h-4" /> },
    ],
    plans: [
      { tier: 'BASIC', nameEn: 'Starter', nameAm: 'መነሻ', price: 15000, perks: ['Up to 2 Properties', '100 Units', 'Core Features', 'Email Support'] },
      { tier: 'STANDARD', nameEn: 'Professional', nameAm: 'ሙያዊ', price: 30000, perks: ['Up to 10 Properties', '1000 Units', '3D + AI Insights', 'Telegram Bot', 'Priority Support'] },
      { tier: 'PREMIUM', nameEn: 'Enterprise', nameAm: 'ኢንተርፕራይዝ', price: 50000, perks: ['Unlimited Properties', 'Unlimited Units', 'Full AI Suite', 'API Access', 'Dedicated Manager'] },
    ],
  },
  {
    key: 'RENTAL',
    icon: <DoorOpen className="w-8 h-8" />,
    gradient: 'from-purple-600 via-violet-500 to-pink-600',
    glowColor: 'shadow-purple-500/30',
    accentColor: 'text-purple-400',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800',
    titleEn: 'Rental Houses',
    titleAm: 'የሚከራዩ ቤቶች',
    taglineEn: 'Individual houses, villas & compounds — managed with ease and transparency.',
    taglineAm: 'ግል ቤቶች፣ ቪላዎች እና ጊቢዎች — በቀላሉ እና በሙሉ ግልፅነት አስተዳዱ።',
    features: [
      { en: 'Individual House Tracking', am: 'ግልሰብ ቤቶች ክትትል', icon: <Building className="w-4 h-4" /> },
      { en: 'Utility Bills Splitting', am: 'የዩቲሊቲ ክፍያ ማካፈያ', icon: <Activity className="w-4 h-4" /> },
      { en: 'Tenant ID Verification', am: 'ተከራይ መታወቂያ ማረጋገጫ', icon: <ShieldCheck className="w-4 h-4" /> },
      { en: 'Telegram Bot Integration', am: 'ቴሌግራም ቦት ውህደት', icon: <Settings className="w-4 h-4" /> },
      { en: 'Automated Payment Reminders', am: 'አውቶማቲክ የክፍያ ማስታወሻ', icon: <Clock className="w-4 h-4" /> },
      { en: 'Maintenance Request System', am: 'የጥገና ጥያቄ ሲስተም', icon: <TrendingUp className="w-4 h-4" /> },
      { en: 'Rental Agreements & Contracts', am: 'የኪራይ ስምምነቶች እና ውሎች', icon: <Shield className="w-4 h-4" /> },
      { en: 'Tenant Communication Portal', am: 'ለተከራዮች ግንኙነት ፖርታል', icon: <Users className="w-4 h-4" /> },
    ],
    plans: [
      { tier: 'BASIC', nameEn: 'Starter', nameAm: 'መነሻ', price: 2500, perks: ['Up to 5 Houses', 'Core Features', 'Telegram Bot', 'Standard Support'] },
      { tier: 'STANDARD', nameEn: 'Professional', nameAm: 'ሙያዊ', price: 5000, perks: ['Up to 20 Houses', 'AI Insights', 'Utility Splitting', 'Priority Support'] },
      { tier: 'PREMIUM', nameEn: 'Enterprise', nameAm: 'ኢንተርፕራይዝ', price: 10000, perks: ['Unlimited Houses', 'Full AI Suite', 'Custom Contracts', '24/7 Dedicated Support'] },
    ],
  },
];

export default function LandingView({ onLogin, onSelectPlan }: LandingViewProps) {
  const { locale: language, setLocale } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg && tg.initData) {
      tg.ready();
      tg.expand();
    }
  }, []);

  const openCategory = (key: CategoryKey) => {
    setSelectedCategory(key);
    setIsAnimatingIn(true);
    setTimeout(() => setIsAnimatingIn(false), 400);
  };

  const closeCategory = () => {
    setSelectedCategory(null);
  };

  const cat = categories.find(c => c.key === selectedCategory);

  // ---- DETAIL VIEW ----
  if (cat) {
    return (
      <div className={`min-h-screen bg-gray-950 font-sans text-white ${isAnimatingIn ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
        {/* Hero Banner */}
        <div className="relative h-72 overflow-hidden">
          <img src={cat.image} alt={cat.titleEn} className="w-full h-full object-cover" />
          <div className={`absolute inset-0 bg-gradient-to-b ${cat.gradient} opacity-80`} />
          <div className="absolute inset-0 flex flex-col justify-end p-6">
            <button
              onClick={closeCategory}
              className="absolute top-4 right-4 w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/50 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white`}>
                {cat.icon}
              </div>
              <div>
                <div className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-0.5">BuildingOS</div>
                <h1 className="text-3xl font-extrabold text-white">
                  {language === 'en' ? cat.titleEn : cat.titleAm}
                </h1>
              </div>
            </div>
            <p className="text-white/80 text-sm max-w-md">
              {language === 'en' ? cat.taglineEn : cat.taglineAm}
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 pb-16">
          {/* Features Grid */}
          <div className="mt-8 mb-10">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              {language === 'en' ? 'What You Get' : 'ምን ያገኛሉ'}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {cat.features.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-colors"
                >
                  <div className={`shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-white`}>
                    {f.icon}
                  </div>
                  <span className="text-sm text-white/85 font-medium leading-tight">
                    {language === 'en' ? f.en : f.am}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Plans */}
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-yellow-400" />
            {language === 'en' ? 'Choose Your Plan' : 'ፓኬጅ ይምረጡ'}
          </h2>
          <div className="space-y-4">
            {cat.plans.map((plan, i) => {
              const isPopular = plan.tier === 'STANDARD';
              const planKey = `${cat.key}_${plan.tier}` as PlanType;
              return (
                <div
                  key={i}
                  className={`relative rounded-2xl border overflow-hidden transition-all duration-200 ${
                    isPopular
                      ? `bg-gradient-to-br ${cat.gradient} border-transparent shadow-2xl ${cat.glowColor}`
                      : 'bg-white/5 border-white/15 hover:border-white/30'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute top-0 right-0 bg-yellow-400 text-gray-900 text-xs font-extrabold px-3 py-1 rounded-bl-xl tracking-wider uppercase">
                      {language === 'en' ? 'Most Popular' : 'ምርጥ አማራጭ'}
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-end justify-between mb-4">
                      <div>
                        <div className={`text-xs uppercase tracking-widest font-semibold mb-1 ${isPopular ? 'text-white/70' : 'text-white/50'}`}>
                          {language === 'en' ? plan.nameEn : plan.nameAm}
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-4xl font-extrabold ${isPopular ? 'text-white' : 'text-white'}`}>
                            {plan.price.toLocaleString()}
                          </span>
                          <span className={`text-sm ${isPopular ? 'text-white/70' : 'text-white/50'}`}>
                            ETB/{language === 'en' ? 'mo' : 'ወር'}
                          </span>
                        </div>
                      </div>
                      {isPopular && (
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                          {cat.icon}
                        </div>
                      )}
                    </div>

                    <ul className="space-y-2 mb-5">
                      {plan.perks.map((perk, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${isPopular ? 'bg-white/20' : 'bg-white/10'}`}>
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                          <span className={isPopular ? 'text-white/90' : 'text-white/70'}>{perk}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => onSelectPlan(planKey)}
                      className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 group ${
                        isPopular
                          ? 'bg-white text-gray-900 hover:bg-white/90 shadow-lg'
                          : `bg-gradient-to-r ${cat.gradient} text-white hover:opacity-90`
                      }`}
                    >
                      {language === 'en' ? `Start with ${plan.nameEn}` : `${plan.nameAm} ይጀምሩ`}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Login Link */}
          <p className="text-center text-sm text-white/40 mt-8">
            {language === 'en' ? 'Already have an account? ' : 'አካውንት አለዎት? '}
            <button onClick={onLogin} className="text-white/70 underline hover:text-white font-medium">
              {language === 'en' ? 'Login' : 'ይግቡ'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ---- MAIN LANDING PAGE ----
  return (
    <div className="min-h-screen bg-gray-950 font-sans text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-gray-950/80 backdrop-blur-md z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 p-2 rounded-xl">
              <Building2 className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-white">BuildingOS</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocale(language === 'en' ? 'am' : 'en')}
              className="text-sm text-white/60 hover:text-white border border-white/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              {language === 'en' ? 'አማ' : 'EN'}
            </button>
            <button
              onClick={onLogin}
              className="text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-xl transition-colors"
            >
              {language === 'en' ? 'Login' : 'ግባ'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-10 px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
          <Activity className="w-3.5 h-3.5" />
          {language === 'en' ? 'AI-Powered Property Management' : 'AI ተደግፎ የንብረት አስተዳደር'}
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight max-w-4xl mx-auto mb-5">
          <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            {language === 'en' ? 'The Future of' : 'የ'}
          </span>
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            {language === 'en' ? 'Property Management' : 'ንብረት አስተዳደር ወደፊት'}
          </span>
        </h1>
        <p className="text-lg text-white/50 max-w-xl mx-auto mb-10">
          {language === 'en'
            ? 'Smart tools for commercial buildings, real estate & rentals. Powered by AI and 3D visualization.'
            : 'ለህንፃዎች፣ ሪልስቴት እና ለሚከራዩ ቤቶች AI ሲስተም ።'}
        </p>

        {/* Moving Image Marquee */}
        <div className="relative flex overflow-hidden w-full max-w-5xl mx-auto group mb-14">
          <style>{`
            @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-100%); } }
            .animate-marquee { animation: marquee 35s linear infinite; }
            .group:hover .animate-marquee { animation-play-state: paused; }
          `}</style>
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-4 px-2 animate-marquee shrink-0">
              {[
                { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=400', label: language === 'en' ? 'Smart Offices' : 'ዘመናዊ ቢሮዎች' },
                { url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=400', label: language === 'en' ? 'Real Estate' : 'ሪልስቴት' },
                { url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400', label: language === 'en' ? 'Commercial Buildings' : 'የንግድ ህንፃዎች' },
                { url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=400', label: language === 'en' ? 'Apartments' : 'አፓርታማዎች' },
                { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=400', label: language === 'en' ? 'Rental Villas' : 'የሚከራዩ ቪላዎች' },
              ].map((item, j) => (
                <div key={j} className="relative rounded-2xl overflow-hidden shrink-0 w-56 h-40 border border-white/10">
                  <img src={item.url} alt={item.label} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-3">
                    <span className="text-white text-xs font-semibold">{item.label}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-gray-950 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-gray-950 to-transparent z-10 pointer-events-none" />
        </div>

        {/* Choose Service Title */}
        <p className="text-xs uppercase tracking-widest font-semibold text-white/40 mb-6">
          {language === 'en' ? 'Select Your Service' : 'አገልግሎቶ ይምረጡ'}
        </p>

        {/* 3 Category Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => openCategory(c.key)}
              className="group relative rounded-3xl overflow-hidden border border-white/10 hover:border-white/25 transition-all duration-300 text-left hover:-translate-y-1 hover:shadow-2xl focus:outline-none"
            >
              {/* Image Background */}
              <div className="relative h-44 overflow-hidden">
                <img src={c.image} alt={c.titleEn} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} opacity-70`} />
                <div className="absolute inset-0 flex flex-col justify-between p-5">
                  <div className={`w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white border border-white/20`}>
                    {c.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-white mb-1">
                      {language === 'en' ? c.titleEn : c.titleAm}
                    </h3>
                    <p className="text-xs text-white/75 line-clamp-2">
                      {language === 'en' ? c.taglineEn : c.taglineAm}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="bg-gray-900 p-4 border-t border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs text-white/40 mb-0.5">{language === 'en' ? 'Starting from' : 'ከ'}</div>
                    <div className={`text-lg font-extrabold bg-gradient-to-r ${c.gradient} bg-clip-text text-transparent`}>
                      {c.plans[0].price.toLocaleString()} <span className="text-sm font-normal text-white/50">ETB/mo</span>
                    </div>
                  </div>
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <ChevronRight className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {c.features.slice(0, 3).map((f, i) => (
                    <span key={i} className="text-xs bg-white/5 border border-white/10 text-white/60 px-2 py-0.5 rounded-full">
                      {language === 'en' ? f.en.split(' ').slice(0,2).join(' ') : f.am.split(' ').slice(0,2).join(' ')}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Feature highlights */}
      <section className="py-16 px-6 border-t border-white/10">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: 'AI', label: language === 'en' ? 'Smart Assistant' : 'AI ረዳት', color: 'text-blue-400' },
            { value: '3D', label: language === 'en' ? 'Building Maps' : 'ህንፃ ካርታ', color: 'text-indigo-400' },
            { value: 'Bot', label: language === 'en' ? 'Telegram Native' : 'ቴሌግራም ቦት', color: 'text-purple-400' },
            { value: '100%', label: language === 'en' ? 'Secure Data' : 'ደህንነቱ የተጠበቀ', color: 'text-emerald-400' },
          ].map((item, i) => (
            <div key={i}>
              <div className={`text-4xl font-extrabold mb-1 ${item.color}`}>{item.value}</div>
              <div className="text-sm text-white/40">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-white/30 text-sm">
        <p>powered by wengel aylew &copy; {new Date().getFullYear()} BuildingOS. All rights reserved.</p>
      </footer>
    </div>
  );
}
