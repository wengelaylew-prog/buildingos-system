import React, { useState, useEffect } from 'react';
import { TelegramLinkView } from './TelegramLinkView.tsx';
import { TenantHomeView, PropertyView, LeaseView, BillingView, MaintenanceView, NotificationsView, ProfileView } from './TelegramViews.tsx';
import { GatePassTenantView } from './GatePassTenantView.tsx';
import { Building, Home, FileText, Wrench, Wallet, Bell, User, Package } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { getTmaSessionToken, getTmaAuthHeader, tmaAuthLoginTelegram } from '../../lib/tma-client.ts';

export function TelegramApp() {
  const { locale } = useLanguage();
  const am = locale === 'am';
  const [activeTab, setActiveTab] = useState('dashboard');
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
    return (
      <TelegramLinkView
        initData={initData}
        telegramError={telegramError}
        telegramLoading={telegramLoading}
        onRetryTelegram={handleRetryTelegram}
        onAuthenticated={() => {
          setTelegramError(null);
          bootstrapAuth();
        }}
      />
    );
  }

  const authHeader = getTmaAuthHeader();

  // The actual Mini App Layout
  return (
    <div className="flex flex-col h-screen bg-[var(--tg-theme-bg-color,#f8fafc)] text-[var(--tg-theme-text-color,#000000)] overflow-hidden font-sans">
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {activeTab === 'dashboard' && <TenantHomeView initData={authHeader} onOpenNotifications={() => setActiveTab('notifications')} />}
        {activeTab === 'property' && <PropertyView initData={authHeader} />}
        {activeTab === 'lease' && <LeaseView initData={authHeader} />}
        {activeTab === 'billing' && <BillingView initData={authHeader} />}
        {activeTab === 'maintenance' && <MaintenanceView initData={authHeader} />}
        {activeTab === 'notifications' && <NotificationsView initData={authHeader} onBack={() => setActiveTab('dashboard')} />}
        {activeTab === 'gatepass' && <GatePassTenantView initData={authHeader} />}
        {activeTab === 'profile' && (
          <ProfileView
            initData={authHeader}
            onDisconnected={handleLoggedOut}
            onLoggedOut={handleLoggedOut}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--tg-theme-bg-color,#ffffff)] border-t border-[var(--tg-theme-hint-color,#e2e8f0)] flex justify-around p-2 pb-safe">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center p-2 ${activeTab === 'dashboard' ? 'text-[var(--tg-theme-button-color,#3b82f6)]' : 'text-[var(--tg-theme-hint-color,#64748b)]'}`}>
          <Home size={20} />
          <span className="text-[10px] mt-1">{am ? 'ባሐል' : 'Home'}</span>
        </button>
        <button onClick={() => setActiveTab('property')} className={`flex flex-col items-center p-2 ${activeTab === 'property' ? 'text-[var(--tg-theme-button-color,#3b82f6)]' : 'text-[var(--tg-theme-hint-color,#64748b)]'}`}>
          <Building size={20} />
          <span className="text-[10px] mt-1">{am ? 'ንብረት' : 'Property'}</span>
        </button>
        <button onClick={() => setActiveTab('lease')} className={`flex flex-col items-center p-2 ${activeTab === 'lease' ? 'text-[var(--tg-theme-button-color,#3b82f6)]' : 'text-[var(--tg-theme-hint-color,#64748b)]'}`}>
          <FileText size={20} />
          <span className="text-[10px] mt-1">{am ? 'ውል' : 'Lease'}</span>
        </button>
        <button onClick={() => setActiveTab('billing')} className={`flex flex-col items-center p-2 ${activeTab === 'billing' ? 'text-[var(--tg-theme-button-color,#3b82f6)]' : 'text-[var(--tg-theme-hint-color,#64748b)]'}`}>
          <Wallet size={20} />
          <span className="text-[10px] mt-1">{am ? 'ክፍያ' : 'Billing'}</span>
        </button>
        <button onClick={() => setActiveTab('maintenance')} className={`flex flex-col items-center p-2 ${activeTab === 'maintenance' ? 'text-[var(--tg-theme-button-color,#3b82f6)]' : 'text-[var(--tg-theme-hint-color,#64748b)]'}`}>
          <Wrench size={20} />
          <span className="text-[10px] mt-1">{am ? 'ጥገና' : 'Fixes'}</span>
        </button>
        <button onClick={() => setActiveTab('gatepass')} className={`flex flex-col items-center p-2 ${activeTab === 'gatepass' ? 'text-[var(--tg-theme-button-color,#3b82f6)]' : 'text-[var(--tg-theme-hint-color,#64748b)]'}`}>
          <Package size={20} />
          <span className="text-[10px] mt-1">{am ? 'እቃ መውጫ' : 'Pass'}</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center p-2 ${activeTab === 'profile' ? 'text-[var(--tg-theme-button-color,#3b82f6)]' : 'text-[var(--tg-theme-hint-color,#64748b)]'}`}>
          <User size={20} />
          <span className="text-[10px] mt-1">{am ? 'መገለጫ' : 'Profile'}</span>
        </button>
      </div>
    </div>
  );
}
