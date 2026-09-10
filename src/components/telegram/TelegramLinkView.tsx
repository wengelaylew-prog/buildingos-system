import React from 'react';
import { useLanguage } from '../../context/LanguageContext.tsx';

export function TelegramLinkView({ initData, onLinked }: { initData: string | null; onLinked: () => void }) {
  const { locale, setLocale } = useLanguage();
  const am = locale === 'am';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[var(--tg-theme-bg-color,#f8fafc)] text-[var(--tg-theme-text-color,#000000)]">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={() => setLocale(am ? 'en' : 'am')}
            className="text-xs font-medium px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700"
          >
            {am ? 'EN' : 'አማ'}
          </button>
        </div>
        <h2 className="text-xl font-bold text-center mb-2">{am ? 'ቴሌግራም አልተገናኘም' : 'Telegram account not linked'}</h2>
        <p className="text-sm text-slate-500 text-center mb-6">
          {am ? 'የቴሌግራም መለያዎን እንዲያገናኙ የንብረት አስተዳዳሪዎን ያነጋግሩ።' : 'Ask your property manager to link this Telegram account to your BuildingOS tenant account.'}
        </p>
        {!initData && <p className="text-sm text-red-600 text-center">{am ? 'ይህን መተግበሪያ ከቴሌግራም ይክፈቱ።' : 'Open this app inside Telegram to authenticate.'}</p>}
      </div>
    </div>
  );
}
