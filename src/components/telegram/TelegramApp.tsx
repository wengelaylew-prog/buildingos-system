import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { TelegramLinkView } from './TelegramLinkView.tsx';
import { TenantHomeView, PropertyView, LeaseView, BillingView, MaintenanceView } from './TelegramViews.tsx';
import { Building, Home, FileText, Wrench, Wallet, Bell } from 'lucide-react';

export function TelegramApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [initData, setInitData] = useState<string | null>(null);
  const [tgUser, setTgUser] = useState<any>(null);
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
      setTgUser(tg.initDataUnsafe?.user);
      
      // Inject theme colors based on Telegram Theme
      document.documentElement.style.setProperty('--tg-theme-bg-color', tg.backgroundColor || '#ffffff');
      document.documentElement.style.setProperty('--tg-theme-text-color', tg.textColor || '#000000');
      document.documentElement.style.setProperty('--tg-theme-hint-color', tg.hintColor || '#999999');
      document.documentElement.style.setProperty('--tg-theme-link-color', tg.linkColor || '#3390ec');
      document.documentElement.style.setProperty('--tg-theme-button-color', tg.buttonColor || '#3390ec');
      document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.buttonTextColor || '#ffffff');
    } else {
      // Mock for testing outside telegram
      const mockInitData = "user=%7B%22id%22%3A12345%2C%22first_name%22%3A%22Test%22%7D&hash=abc";
      setInitData(mockInitData);
      setTgUser({ id: 12345, first_name: 'Test' });
    }

    // Check link status using our new API
    checkLinkStatus(tg?.initData || "mock");
  }, []);

  const checkLinkStatus = async (data: string) => {
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
    return <div className="p-4 text-center">Loading Telegram App...</div>;
  }

  if (!isLinked) {
    return <TelegramLinkView initData={initData} onLinked={() => setIsLinked(true)} />;
  }

  // The actual Mini App Layout
  return (
    <div className="flex flex-col h-screen bg-[var(--tg-theme-bg-color,#f8fafc)] text-[var(--tg-theme-text-color,#000000)] overflow-hidden font-sans">
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {activeTab === 'dashboard' && <TenantHomeView initData={initData} />}
        {activeTab === 'property' && <PropertyView initData={initData} />}
        {activeTab === 'lease' && <LeaseView initData={initData} />}
        {activeTab === 'billing' && <BillingView initData={initData} />}
        {activeTab === 'maintenance' && <MaintenanceView initData={initData} />}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--tg-theme-bg-color,#ffffff)] border-t border-[var(--tg-theme-hint-color,#e2e8f0)] flex justify-around p-2 pb-safe">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center p-2 ${activeTab === 'dashboard' ? 'text-[var(--tg-theme-button-color,#3b82f6)]' : 'text-[var(--tg-theme-hint-color,#64748b)]'}`}>
          <Home size={20} />
          <span className="text-[10px] mt-1">Home</span>
        </button>
        <button onClick={() => setActiveTab('property')} className={`flex flex-col items-center p-2 ${activeTab === 'property' ? 'text-[var(--tg-theme-button-color,#3b82f6)]' : 'text-[var(--tg-theme-hint-color,#64748b)]'}`}>
          <Building size={20} />
          <span className="text-[10px] mt-1">Property</span>
        </button>
        <button onClick={() => setActiveTab('lease')} className={`flex flex-col items-center p-2 ${activeTab === 'lease' ? 'text-[var(--tg-theme-button-color,#3b82f6)]' : 'text-[var(--tg-theme-hint-color,#64748b)]'}`}>
          <FileText size={20} />
          <span className="text-[10px] mt-1">Lease</span>
        </button>
        <button onClick={() => setActiveTab('billing')} className={`flex flex-col items-center p-2 ${activeTab === 'billing' ? 'text-[var(--tg-theme-button-color,#3b82f6)]' : 'text-[var(--tg-theme-hint-color,#64748b)]'}`}>
          <Wallet size={20} />
          <span className="text-[10px] mt-1">Billing</span>
        </button>
        <button onClick={() => setActiveTab('maintenance')} className={`flex flex-col items-center p-2 ${activeTab === 'maintenance' ? 'text-[var(--tg-theme-button-color,#3b82f6)]' : 'text-[var(--tg-theme-hint-color,#64748b)]'}`}>
          <Wrench size={20} />
          <span className="text-[10px] mt-1">Fixes</span>
        </button>
      </div>
    </div>
  );
}
