import React, { useState } from 'react';
import { Send, Building } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';

interface TelegramLinkViewProps {
  onRetryTelegram: () => void;
  telegramError: string | null;
  telegramLoading: boolean;
  inTelegram: boolean;
}

export function TelegramLinkView({ 
  onRetryTelegram, 
  telegramError, 
  telegramLoading, 
  inTelegram,
}: TelegramLinkViewProps) {
  const { locale } = useLanguage();
  const am = locale === 'am';

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#0f5132] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#0f5132]/20">
            <Building size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900">{window.location.search.includes('app=admin') ? (am ? 'የህንፃ አስተዳደር' : 'Building Management') : 'BuildingOS'}</h1>
          <p className="text-stone-500 mt-1">{window.location.search.includes('app=admin') ? (am ? 'የአስተዳዳሪ መግቢያ' : 'Admin Portal') : (am ? 'የተከራይ መግቢያ' : 'Tenant Portal')}</p>
        </div>

        {telegramError && (
          <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200 text-center">
            <p className="text-sm text-amber-900 font-medium">
              {am ? 'የቴሌግራም መለያዎ አልተያያዘም' : 'Telegram Account Not Linked'}
            </p>
            <p className="text-xs text-amber-700 mt-1">
              {am
                ? 'የቴሌግራም መለያዎን እንዲያገናኙ የንብረት አስተዳዳሪዎን ያነጋግሩ፤ ወይም በቴሌግራም ሊንክ በኩል በቀጥታ ይግቡ።'
                : 'Ask your property manager to link this Telegram account, or use their direct invite link.'}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {inTelegram && (
            <button
              type="button"
              onClick={onRetryTelegram}
              disabled={telegramLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0f5132] text-white font-semibold py-3 active:opacity-90 disabled:opacity-60"
            >
              <Send size={18} />
              {am ? 'በቴሌግራም ይግቡ' : 'Sign in with Telegram'}
            </button>
          )}
          {!inTelegram && (
            <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
              <p className="text-sm text-blue-900">
                {am ? 'በቀጥታ ለመግባት ይህንን አፕሊኬሽን በቴሌግራም ውስጥ ይክፈቱ' : 'Open this app inside Telegram for instant login'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
