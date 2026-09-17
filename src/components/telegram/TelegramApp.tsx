import React, { useState, useEffect } from 'react';
import { TelegramLinkView } from './TelegramLinkView.tsx';
import { TenantMessagingView, ProfileView } from './TelegramViews.tsx';
import { GatePassTenantView } from './GatePassTenantView.tsx';
import LandingView from '../views/public/LandingView.tsx';
import CheckoutView from '../views/public/CheckoutView.tsx';
import { User, MessageSquare, Send } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { getTmaSessionToken, getTmaAuthHeader, tmaAuthLoginTelegram } from '../../lib/tma-client.ts';

export function TelegramApp() {
  const { locale } = useLanguage();
  const am = locale === 'am';
  const [unauthView, setUnauthView] = useState<'LINK' | 'LANDING' | 'CHECKOUT'>('LINK');
  const [selectedPlan, setSelectedPlan] = useState<'RENTAL_BASIC' | 'RENTAL_STANDARD' | 'RENTAL_PREMIUM' | 'BUILDING_BASIC' | 'BUILDING_STANDARD' | 'BUILDING_PREMIUM' | 'REAL_ESTATE_BASIC' | 'REAL_ESTATE_STANDARD' | 'REAL_ESTATE_PREMIUM'>('BUILDING_STANDARD');
  const [activeTab, setActiveTab] = useState('messaging');
  const [initData, setInitData] = useState<string | null>(null);
  const [isLinked, setIsLinked] = useState<boolean>(false);
  const [telegramError, setTelegramError] = useState<string | null>(null);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read Telegram WebApp initData
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      setInitData(tg.initData);
      
      // Inject theme colors based on Telegram Theme
      document.documentElement.style.setProperty('--tg-theme-bg-color', tg.backgroundColor || '#ffffff');
      document.documentElement.style.setProperty('--tg-theme-text-color', tg.textColor || '#000000');
      document.documentElement.style.setProperty('--tg-theme-hint-color', tg.hintColor || '#999999');
      document.documentElement.style.setProperty('--tg-theme-link-color', tg.linkColor || '#3390ec');
      document.documentElement.style.setProperty('--tg-theme-button-color', tg.buttonColor || '#3390ec');
      document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.buttonTextColor || '#ffffff');
    } else {
      setInitData(null);
    }

    bootstrapAuth(tg?.initData);
  }, []);

  const bootstrapAuth = async (currentInitData?: string) => {
    const hasSession = !!getTmaSessionToken();
    if (hasSession) {
      setIsLinked(true);
      setTelegramError(null);
      setLoading(false);
      return;
    }

    const dataToUse = currentInitData || initData || (window as any).Telegram?.WebApp?.initData;
    if (dataToUse) {
      await loginWithTelegram(dataToUse, true);
    } else {
      setIsLinked(false);
      setLoading(false);
    }
  };

  const loginWithTelegram = async (data: string, silent = false) => {
    setTelegramError(null);
    if (!silent) setTelegramLoading(true);
    try {
      await tmaAuthLoginTelegram(data);
      setIsLinked(true);
    } catch (e: any) {
      setIsLinked(false);
      if (e.code === 'TELEGRAM_NOT_LINKED') {
        setTelegramError(e.message || 'Telegram account not linked');
      } else if (!silent) {
        setTelegramError(e.message || 'Unable to sign in with Telegram');
      }
    } finally {
      if (!silent) setTelegramLoading(false);
      setLoading(false);
    }
  };

  const handleRetryTelegram = () => {
    const data = initData || (window as any).Telegram?.WebApp?.initData;
    if (data) loginWithTelegram(data, false);
  };

  const handleLoggedOut = () => {
    setIsLinked(false);
    setActiveTab('dashboard');
  };

  if (loading) {
    return <div className="p-4 text-center">{am ? 'ኢንፔት እየተጫነ ነው...' : 'Loading Telegram App...'}</div>;
  }

  if (!isLinked) {
    if (unauthView === 'LANDING') {
      return (
        <div className="h-screen w-full overflow-y-auto">
          <LandingView
            onLogin={() => setUnauthView('LINK')}
            onSelectPlan={(plan) => {
              setSelectedPlan(plan);
              setUnauthView('CHECKOUT');
            }}
          />
        </div>
      );
    }
    if (unauthView === 'CHECKOUT') {
      return (
        <div className="h-screen w-full overflow-y-auto">
          <CheckoutView
            plan={selectedPlan}
            onBack={() => setUnauthView('LANDING')}
            onDashboard={() => {
              setUnauthView('LINK');
            }}
          />
        </div>
      );
    }
    
    return (
      <TelegramLinkView
        telegramError={telegramError}
        telegramLoading={telegramLoading}
        onRetryTelegram={handleRetryTelegram}
        inTelegram={Boolean((window as any).Telegram?.WebApp?.initData)}
      />
    );
  }

  const authHeader = getTmaAuthHeader();

  // The actual Mini App Layout
  return (
    
      <div className="flex flex-col h-screen bg-[var(--tg-theme-bg-color,#f8fafc)] text-[var(--tg-theme-text-color,#000000)] overflow-hidden font-sans">
        {activeTab !== 'messaging' && (
          <div className="flex items-center gap-3 p-4 bg-[var(--tg-theme-bg-color,#ffffff)] border-b border-[var(--tg-theme-hint-color,#e2e8f0)]">
            <button 
              onClick={() => setActiveTab('messaging')}
              className="p-2 -ml-2 rounded-full hover:bg-[var(--tg-theme-secondary-bg-color,#f1f5f9)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <h1 className="text-lg font-semibold">
              {activeTab === 'profile' ? (am ? 'ቅንብሮች' : 'Settings') : (am ? 'እቃ ማስወጣት/ማስገባት' : 'Gate Pass')}
            </h1>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4 pb-20">
          {activeTab === 'messaging' && <TenantMessagingView initData={authHeader} onOpenProfile={() => setActiveTab('profile')} />}
          {activeTab === 'profile' && (
            <ProfileView
              initData={authHeader}
              onDisconnected={handleLoggedOut}
              onLoggedOut={handleLoggedOut}
              onOpenGatePass={() => setActiveTab('gatepass')}
            />
          )}
          {activeTab === 'gatepass' && (
            <GatePassTenantView initData={authHeader} />
          )}
        </div>


      {/* Bottom Navigation */}
      {/* Navigation Removed - Messaging Only UI */}
    </div>
  );
}
