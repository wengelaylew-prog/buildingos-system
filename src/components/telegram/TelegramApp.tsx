import React, { useState, useEffect } from 'react';
import { TelegramLinkView } from './TelegramLinkView.tsx';
import { TenantHomeView, PropertyView, LeaseView, BillingView, MaintenanceView, NotificationsView, ProfileView } from './TelegramViews.tsx';
import { Building, Home, FileText, Wrench, Wallet, Bell, User } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';

export function TelegramApp() {
  const { locale } = useLanguage();
  const am = locale === 'am';
  const [activeTab, setActiveTab] = useState('dashboard');
  const [initData, setInitData] = useState<string | null>(null);
  const [isLinked, setIsLinked] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read Telegram WebApp initData
    // In actual Telegram, this is available at window.Telegram.WebApp.initData
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

    // Check link status using our new API
    checkLinkStatus(tg?.initData || null);
  }, []);

  const checkLinkStatus = async (data: string | null) => {
    if (!data) {
      setIsLinked(false);
      setLoading(false);
      return;
    }
    try {
      // We ping `/api/v1/telegram/me` with the TMA token to see if it succeeds.
      const res = await fetch('/api/v1/telegram/me', {
        headers: {
          'Authorization': `TMA ${data}`
        }
      });
      if (res.ok) {
        setIsLinked(true);
      } else {
        setIsLinked(false);
      }
    } catch (e) {
      console.error(e);
      setIsLinked(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">{am ? 'ኢንፔት እየተጫነ ነው...' : 'Loading Telegram App...'}</div>;
  }

  if (!isLinked) {
    return <TelegramLinkView initData={initData} onLinked={() => setIsLinked(true)} />;
  }

  // The actual Mini App Layout
  return (
    <div className="flex flex-col h-screen bg-[var(--tg-theme-bg-color,#f8fafc)] text-[var(--tg-theme-text-color,#000000)] overflow-hidden font-sans">
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {activeTab === 'dashboard' && <TenantHomeView initData={initData} onOpenNotifications={() => setActiveTab('notifications')} />}
        {activeTab === 'property' && <PropertyView initData={initData} />}
        {activeTab === 'lease' && <LeaseView initData={initData} />}
        {activeTab === 'billing' && <BillingView initData={initData} />}
        {activeTab === 'maintenance' && <MaintenanceView initData={initData} />}
        {activeTab === 'notifications' && <NotificationsView initData={initData} onBack={() => setActiveTab('dashboard')} />}
        {activeTab === 'profile' && (
          <ProfileView
            initData={initData}
            onDisconnected={() => setIsLinked(false)}
            onLoggedOut={() => {
              setIsLinked(false);
              setActiveTab('dashboard');
            }}
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
          <span className="text-[10px] mt-1">{am ? 'ጥገ⤻' : 'Fixes'}</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center p-2 ${activeTab === 'profile' ? 'text-[var(--tg-theme-button-color,#3b82f6)]' : 'text-[var(--tg-theme-hint-color,#64748b)]'}`}>
          <User size={20} />
          <span className="text-[10px] mt-1">{am ? 'መገለጫ' : 'Profile'}</span>
        </button>
      </div>
    </div>
  );
}

