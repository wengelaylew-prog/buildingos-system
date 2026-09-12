import React, { useState } from 'react';
import { ShieldCheck, Package, ArrowRight, Camera } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';

export function GatePassTenantView({ initData }: { initData: string | null }) {
  const { locale } = useLanguage();
  const am = locale === 'am';
  const [form, setForm] = useState({ item: '', direction: 'OUT', quantity: 1 });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // tmaFetch('/api/v1/security/gate-passes', initData, { method: 'POST', body: JSON.stringify(form) })
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center">
          <ShieldCheck size={32} />
        </div>
        <h2 className="text-xl font-bold">{am ? 'ጥያቄዎ ተልኳል' : 'Gate Pass Requested!'}</h2>
        <p className="text-sm text-slate-500">
          {am ? 'እባክዎ መውጫ ላይ ለጥበቃ ያሳውቁ።' : 'Your request has been sent to security. Please present your ID at the gate.'}
        </p>
        <button 
          onClick={() => setSubmitted(false)}
          className="mt-6 w-full py-3 bg-[var(--tg-theme-button-color,#3b82f6)] text-[var(--tg-theme-button-text-color,#ffffff)] rounded-xl font-semibold"
        >
          {am ? 'ሌላ ጥያቄ' : 'Request Another'}
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
          <Package size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold">{am ? 'የእቃ መውጫ/መግቢያ' : 'Gate Pass Request'}</h2>
          <p className="text-sm text-slate-500">{am ? 'እቃ ለማስወጣት ወይም ለማስገባት ይጠይቁ' : 'Request to move items in or out'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{am ? 'አቅጣጫ' : 'Direction'}</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, direction: 'OUT' })}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 ${form.direction === 'OUT' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-slate-200 text-slate-600'}`}
            >
              {am ? 'ወደ ውጪ (OUT)' : 'Move Out'} <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, direction: 'IN' })}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 ${form.direction === 'IN' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-slate-200 text-slate-600'}`}
            >
              {am ? 'ወደ ውስጥ (IN)' : 'Move In'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{am ? 'የእቃው አይነት' : 'Item Description'}</label>
          <input
            type="text"
            required
            value={form.item}
            onChange={(e) => setForm({ ...form, item: e.target.value })}
            placeholder={am ? 'ለምሳሌ፡ 2 ወንበር' : 'e.g., Office Desk'}
            className="w-full p-3 rounded-xl border border-slate-200 bg-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{am ? 'ብዛት' : 'Quantity'}</label>
          <input
            type="number"
            min="1"
            required
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) })}
            className="w-full p-3 rounded-xl border border-slate-200 bg-white"
          />
        </div>

        <button type="submit" className="w-full py-4 bg-[var(--tg-theme-button-color,#3b82f6)] text-[var(--tg-theme-button-text-color,#ffffff)] rounded-xl font-bold text-lg mt-4 shadow-md">
          {am ? 'ጥያቄ ላክ' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}
