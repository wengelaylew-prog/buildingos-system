import React, { useState, useEffect } from 'react';

// Common fetcher that uses the TMA header
async function tmaFetch(url: string, initData: string | null, options: any = {}) {
  if (!initData) throw new Error('Not authenticated with Telegram');
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `TMA ${initData}`);
  headers.set('Content-Type', 'application/json');

  const res = await fetch(url, { ...options, headers });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'API request failed');
  return json.data;
}

import { useLanguage } from '../../context/LanguageContext.tsx';
import { Building, FileText, Wrench, Wallet, Bell, AlertCircle, CheckCircle, ArrowLeft, Receipt, RefreshCw, XCircle, Clock, Loader2, Plus, Camera, Megaphone, CalendarClock, Check, Mail, Phone, HelpCircle, Users, LogOut, Unlink, ChevronRight, Moon, Sun } from 'lucide-react';

export function TenantHomeView({ initData, onOpenNotifications }: { initData: string | null; onOpenNotifications?: () => void }) {
  const { t, locale, setLocale } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    tmaFetch('/api/v1/telegram/dashboard', initData)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [initData]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
        <AlertCircle size={48} className="text-red-500 opacity-80" />
        <h2 className="text-xl font-bold">{locale === 'am' ? 'ዳሽቦርድ መጫን ላይ ስህተት' : 'Error Loading Dashboard'}</h2>
        <p className="text-sm text-[var(--tg-theme-hint-color,#64748b)]">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 space-y-4">
        <div className="w-8 h-8 border-4 border-[var(--tg-theme-button-color,#3b82f6)] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-[var(--tg-theme-hint-color,#64748b)]">{locale === 'am' ? 'የእርስዎ መረጃ እየተጫነ ነው...' : 'Loading your data...'}</p>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (locale === 'am') {
      if (hour < 12) return 'እንደምን አደሩ';
      if (hour < 18) return 'እንደምን ዋሉ';
      return 'እንደምን አመሹ';
    }
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Header & Welcome */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xs font-semibold text-[var(--tg-theme-hint-color,#64748b)] uppercase tracking-wider mb-1">
            BuildingOS Tenant
          </h2>
          <h1 className="text-2xl font-bold leading-tight">
            {getGreeting()},<br/>{data.tenantName?.split(' ')[0]} 👋
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setLocale(locale === 'en' ? 'am' : 'en')}
            className="text-xs font-medium px-2 py-1 rounded bg-[var(--tg-theme-bg-color,#ffffff)] border border-[var(--tg-theme-hint-color,#e2e8f0)]"
          >
            {locale === 'en' ? 'አማ' : 'EN'}
          </button>
          <button type="button" onClick={onOpenNotifications} className="relative" aria-label={locale === 'am' ? 'ማሳወቂያዎች' : 'Notifications'}>
            <Bell size={24} className="text-[var(--tg-theme-text-color,#000000)]" />
            {data.unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {data.unreadNotifications}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Property & Lease Summary Card */}
      <div className="bg-[var(--tg-theme-bg-color,#ffffff)] p-4 rounded-xl shadow-sm border border-[var(--tg-theme-hint-color,#e2e8f0)] space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-[var(--tg-theme-button-color,#3b82f6)]">
            <Building size={18} />
            <span className="font-semibold">{locale === 'am' ? 'የእርስዎ ንብረት' : 'My Property'}</span>
          </div>
          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
            {data.leaseStatus}
          </span>
        </div>
        <div>
          <p className="text-lg font-bold">{data.buildingName}</p>
          <p className="text-sm text-[var(--tg-theme-hint-color,#64748b)]">{locale === 'am' ? 'ክፍል' : 'Unit'} {data.unitNumber}</p>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[var(--tg-theme-bg-color,#ffffff)] p-4 rounded-xl shadow-sm border border-[var(--tg-theme-hint-color,#e2e8f0)]">
          <div className="flex items-center gap-1.5 text-[var(--tg-theme-hint-color,#64748b)] mb-2">
            <Wallet size={14} />
            <span className="text-xs font-medium uppercase tracking-wider">{locale === 'am' ? 'ቀሪ ሂሳብ' : 'Balance'}</span>
          </div>
          <p className={`text-xl font-bold ${data.balance > 0 ? 'text-red-500' : 'text-green-600'}`}>
            {data.balance.toLocaleString()} ETB
          </p>
        </div>
        <div className="bg-[var(--tg-theme-bg-color,#ffffff)] p-4 rounded-xl shadow-sm border border-[var(--tg-theme-hint-color,#e2e8f0)]">
          <div className="flex items-center gap-1.5 text-[var(--tg-theme-hint-color,#64748b)] mb-2">
            <FileText size={14} />
            <span className="text-xs font-medium uppercase tracking-wider">{locale === 'am' ? 'ወርሃዊ ኪራይ' : 'Rent'}</span>
          </div>
          <p className="text-xl font-bold">
            {parseFloat(data.rentAmount).toLocaleString()} ETB
          </p>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="pt-2">
        <h3 className="text-sm font-semibold mb-3 text-[var(--tg-theme-hint-color,#64748b)] uppercase tracking-wider">
          {locale === 'am' ? 'የቅርብ ጊዜ ክንውኖች' : 'Recent Activity'}
        </h3>
        <div className="space-y-3">
          
          {/* Invoice item */}
          {data.recentInvoice ? (
            <div className="flex items-center justify-between bg-[var(--tg-theme-bg-color,#ffffff)] p-3 rounded-lg border border-[var(--tg-theme-hint-color,#e2e8f0)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                  <FileText size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium">{locale === 'am' ? 'የክፍያ መጠየቂያ' : 'Invoice'} #{data.recentInvoice.number}</p>
                  <p className="text-xs text-[var(--tg-theme-hint-color,#64748b)]">{parseFloat(data.recentInvoice.amount).toLocaleString()} ETB</p>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${data.recentInvoice.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {data.recentInvoice.status}
              </span>
            </div>
          ) : (
            <div className="text-sm text-[var(--tg-theme-hint-color,#64748b)] p-3 border border-dashed rounded-lg text-center">
              {locale === 'am' ? 'ምንም የክፍያ መጠየቂያ የለም' : 'No recent invoices'}
            </div>
          )}

          {/* Maintenance item */}
          {data.recentMaintenance ? (
            <div className="flex items-center justify-between bg-[var(--tg-theme-bg-color,#ffffff)] p-3 rounded-lg border border-[var(--tg-theme-hint-color,#e2e8f0)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                  <Wrench size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium line-clamp-1">{data.recentMaintenance.title}</p>
                  <p className="text-xs text-[var(--tg-theme-hint-color,#64748b)]">{locale === 'am' ? 'ጥገና' : 'Maintenance'}</p>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${data.recentMaintenance.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {data.recentMaintenance.status}
              </span>
            </div>
          ) : (
            <div className="text-sm text-[var(--tg-theme-hint-color,#64748b)] p-3 border border-dashed rounded-lg text-center">
              {locale === 'am' ? 'ምንም የጥገና ጥያቄ የለም' : 'No maintenance requests'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function PropertyView({ initData, startParam }: { initData: string | null; startParam?: string | null }) {
  const { t, locale } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const query = startParam ? `?ref=${startParam}` : '';
    tmaFetch(`/api/v1/telegram/property${query}`, initData)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [initData, startParam]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
        <AlertCircle size={48} className="text-red-500 opacity-80" />
        <h2 className="text-xl font-bold">{locale === 'am' ? 'ንብረት መጫን ላይ ስህተት' : 'Error Loading Property'}</h2>
        <p className="text-sm text-[var(--tg-theme-hint-color,#64748b)]">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 space-y-4">
        <div className="w-8 h-8 border-4 border-[var(--tg-theme-button-color,#3b82f6)] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-[var(--tg-theme-hint-color,#64748b)]">{locale === 'am' ? 'የንብረት ዝርዝሮች እየተጫኑ ነው...' : 'Loading property details...'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans pb-6">
      <h2 className="text-xl font-bold px-2">{locale === 'am' ? 'የእኔ ንብረት' : 'My Property'}</h2>
      
      {/* Property Image Placeholder */}
      <div className="w-full h-40 bg-[var(--tg-theme-button-color,#3b82f6)] bg-opacity-10 rounded-xl border border-[var(--tg-theme-hint-color,#e2e8f0)] flex items-center justify-center relative overflow-hidden">
        <Building size={48} className="text-[var(--tg-theme-button-color,#3b82f6)] opacity-50" />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
          <p className="text-white font-bold">{data.building.name}</p>
        </div>
      </div>

      <div className="bg-[var(--tg-theme-bg-color,#ffffff)] p-4 rounded-xl shadow-sm border border-[var(--tg-theme-hint-color,#e2e8f0)] space-y-4">
        
        {/* Detail Rows */}
        <div className="flex justify-between items-center border-b border-[var(--tg-theme-hint-color,#e2e8f0)] pb-3 border-opacity-30">
          <span className="text-[var(--tg-theme-hint-color,#64748b)] text-sm">{locale === 'am' ? 'ህንፃ' : 'Building'}</span>
          <span className="font-semibold text-right max-w-[60%]">{data.building.name}</span>
        </div>

        <div className="flex justify-between items-center border-b border-[var(--tg-theme-hint-color,#e2e8f0)] pb-3 border-opacity-30">
          <span className="text-[var(--tg-theme-hint-color,#64748b)] text-sm">{locale === 'am' ? 'አድራሻ' : 'Address'}</span>
          <span className="font-medium text-sm text-right max-w-[60%]">{data.building.address}, {data.building.city}</span>
        </div>

        <div className="flex justify-between items-center border-b border-[var(--tg-theme-hint-color,#e2e8f0)] pb-3 border-opacity-30">
          <span className="text-[var(--tg-theme-hint-color,#64748b)] text-sm">{locale === 'am' ? 'ወለል' : 'Floor'}</span>
          <span className="font-medium">
            {data.floor?.floorName || `${locale === 'am' ? 'ወለል' : 'Floor'} ${data.floor?.floorNumber ?? (locale === 'am' ? 'የለም' : 'N/A')}`}
          </span>
        </div>

        <div className="flex justify-between items-center border-b border-[var(--tg-theme-hint-color,#e2e8f0)] pb-3 border-opacity-30">
          <span className="text-[var(--tg-theme-hint-color,#64748b)] text-sm">{locale === 'am' ? 'የክፍል ቁጥር' : 'Unit Number'}</span>
          <span className="font-bold text-lg">{data.unit.unitNumber}</span>
        </div>

        <div className="flex justify-between items-center border-b border-[var(--tg-theme-hint-color,#e2e8f0)] pb-3 border-opacity-30">
          <span className="text-[var(--tg-theme-hint-color,#64748b)] text-sm">{locale === 'am' ? 'የክፍል አይነት' : 'Unit Type'}</span>
          <span className="font-medium">{data.unit.unitType}</span>
        </div>

        <div className="flex justify-between items-center border-b border-[var(--tg-theme-hint-color,#e2e8f0)] pb-3 border-opacity-30">
          <span className="text-[var(--tg-theme-hint-color,#64748b)] text-sm">{locale === 'am' ? 'ስፋት' : 'Area'}</span>
          <span className="font-medium">{data.unit.area} {locale === 'am' ? 'ካ.ሜ' : 'sqm'}</span>
        </div>

        <div className="flex justify-between items-center pb-1">
          <span className="text-[var(--tg-theme-hint-color,#64748b)] text-sm">{locale === 'am' ? 'ሁኔታ' : 'Status'}</span>
          <span className="px-2 py-1 bg-green-100 text-green-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
            {data.unit.status}
          </span>
        </div>
      </div>

      <button
        disabled
        title={locale === 'am' ? 'በስልክ መተግበሪያ ውስጥ ገና አይገኝም' : 'Not yet available inside the mobile mini app'}
        className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--tg-theme-button-color,#3b82f6)] text-[var(--tg-theme-button-text-color,#ffffff)] rounded-xl font-medium opacity-50 cursor-not-allowed"
      >
        <Building size={18} />
        {locale === 'am' ? 'በ 3D ይመልከቱ (በቅርቡ)' : 'View 3D Property (Coming Soon)'}
      </button>

    </div>
  );
}

export function LeaseView({ initData }: { initData: string | null }) {
  const { locale } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [renewalLoading, setRenewalLoading] = useState(false);
  const [renewalDone, setRenewalDone] = useState(false);
  const [renewalError, setRenewalError] = useState('');

  useEffect(() => {
    tmaFetch('/api/v1/telegram/lease', initData)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [initData]);

  const handleRenew = async () => {
    setRenewalLoading(true);
    setRenewalError('');
    try {
      await tmaFetch('/api/v1/telegram/lease/renew', initData, { method: 'POST' });
      setRenewalDone(true);
    } catch (err: any) {
      setRenewalError(err.message);
    } finally {
      setRenewalLoading(false);
    }
  };

  const am = locale === 'am';

  // Status badge config
  const statusConfig: Record<string, { bg: string; text: string; label: string; labelAm: string }> = {
    ACTIVE:      { bg: 'bg-green-100',  text: 'text-green-800',  label: 'Active',      labelAm: 'ንቁ'        },
    EXPIRING:    { bg: 'bg-amber-100',  text: 'text-amber-800',  label: 'Expiring',    labelAm: 'ሊጠናቀቅ'   },
    EXPIRED:     { bg: 'bg-red-100',    text: 'text-red-800',    label: 'Expired',     labelAm: 'ጊዜው አልፏል' },
    TERMINATED:  { bg: 'bg-slate-100',  text: 'text-slate-600',  label: 'Terminated',  labelAm: 'ተቋርጧል'   },
    DRAFT:       { bg: 'bg-blue-100',   text: 'text-blue-800',   label: 'Draft',       labelAm: 'ረቂቅ'       },
  };

  const fmt = (num: string | number) => parseFloat(String(num)).toLocaleString();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
        <AlertCircle size={48} className="text-red-500 opacity-80" />
        <h2 className="text-xl font-bold">{am ? 'ስህተት ተከስቷል' : 'Error Loading Lease'}</h2>
        <p className="text-sm text-[var(--tg-theme-hint-color,#64748b)]">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 space-y-4">
        <div className="w-8 h-8 border-4 border-[var(--tg-theme-button-color,#3b82f6)] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[var(--tg-theme-hint-color,#64748b)]">
          {am ? 'ውል እየተጫነ ነው...' : 'Loading lease details...'}
        </p>
      </div>
    );
  }

  const status = data.contractStatus as string;
  const badge = statusConfig[status] || { bg: 'bg-slate-100', text: 'text-slate-700', label: status, labelAm: status };
  const effectiveStatus = data.isExpiringSoon && status === 'ACTIVE' ? statusConfig['EXPIRING'] : badge;

  const Row = ({ label, labelAm, value }: { label: string; labelAm: string; value: React.ReactNode }) => (
    <div className="flex justify-between items-center py-3 border-b border-[var(--tg-theme-hint-color,#e2e8f0)] last:border-0">
      <span className="text-sm text-[var(--tg-theme-hint-color,#64748b)]">{am ? labelAm : label}</span>
      <span className="font-medium text-right max-w-[58%]">{value}</span>
    </div>
  );

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-bold">{am ? 'የኔ ውል' : 'My Lease'}</h2>
        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${effectiveStatus.bg} ${effectiveStatus.text}`}>
          {am ? effectiveStatus.labelAm : effectiveStatus.label}
        </span>
      </div>

      {/* Expiry warning banner */}
      {data.isExpiringSoon && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertCircle size={18} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800">
            {am
              ? `ውልዎ በ ${data.daysRemaining} ቀናት ውስጥ ያበቃል። ማደስ ያስቡ።`
              : `Your lease expires in ${data.daysRemaining} day${data.daysRemaining !== 1 ? 's' : ''}. Consider requesting renewal.`}
          </p>
        </div>
      )}

      {/* Details card */}
      <div className="bg-[var(--tg-theme-bg-color,#ffffff)] rounded-xl shadow-sm border border-[var(--tg-theme-hint-color,#e2e8f0)] px-4">
        <Row label="Contract No."   labelAm="ውል ቁጥር"      value={<span className="font-mono text-sm">{data.contractNumber}</span>} />
        <Row label="Start Date"     labelAm="የጀመረበት ቀን"   value={data.startDate} />
        <Row label="End Date"       labelAm="የሚያበቃበት ቀን"  value={data.endDate} />
        <Row label="Days Remaining" labelAm="ቀሪ ቀናት"       value={
          <span className={data.daysRemaining <= 30 ? 'text-red-600 font-bold' : data.daysRemaining <= 60 ? 'text-amber-600 font-semibold' : ''}>
            {data.daysRemaining > 0 ? (am ? `${data.daysRemaining} ቀን` : `${data.daysRemaining} days`) : (am ? 'ጊዜው አልፏል' : 'Expired')}
          </span>
        } />
      </div>

      {/* Financial card */}
      <div className="bg-[var(--tg-theme-bg-color,#ffffff)] rounded-xl shadow-sm border border-[var(--tg-theme-hint-color,#e2e8f0)] px-4">
        <Row label="Monthly Rent"    labelAm="ወርሃዊ ክፍያ"    value={`${fmt(data.monthlyRent)} ETB`} />
        <Row label="Security Deposit" labelAm="ዋስትና ገንዘብ" value={`${fmt(data.deposit)} ETB`} />
        <Row label="Payment Frequency" labelAm="የክፍያ ዑደት"  value={data.paymentFrequency} />
        <Row label="Next Payment Due" labelAm="ቀጣዩ ክፍያ"    value={data.nextPaymentDate} />
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {/* View lease details / document */}
        <button
          onClick={() => data.documentUrl && window.open(data.documentUrl, '_blank', 'noopener,noreferrer')}
          disabled={!data.documentUrl}
          className="w-full flex items-center justify-center gap-2 py-3 border border-[var(--tg-theme-button-color,#3b82f6)] text-[var(--tg-theme-button-color,#3b82f6)] rounded-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText size={16} />
          {data.documentUrl
            ? (am ? 'ሙሉ ውል ይመልከቱ' : 'View Lease Document')
            : (am ? 'ሰነድ አልተያያዘም' : 'No Document Attached')}
        </button>

        {/* Renewal action */}
        {data.renewalEligible && !renewalDone && (
          <button
            onClick={handleRenew}
            disabled={renewalLoading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--tg-theme-button-color,#3b82f6)] text-[var(--tg-theme-button-text-color,#ffffff)] rounded-xl font-medium transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {renewalLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle size={16} />
            )}
            {am ? 'ማደስ ይጠይቁ' : 'Request Renewal'}
          </button>
        )}

        {renewalDone && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <CheckCircle size={18} className="text-green-600 shrink-0" />
            <p className="text-sm text-green-800 font-medium">
              {am ? 'የማደስ ጥያቄዎ ተልኳል!' : 'Renewal request submitted!'}
            </p>
          </div>
        )}

        {renewalError && (
          <p className="text-sm text-red-500 text-center">{renewalError}</p>
        )}
      </div>
    </div>
  );
}

const PAYMENT_GATEWAYS = [
  { code: 'TELEBIRR', label: 'Telebirr', labelAm: 'ቴሌብር' },
  { code: 'CHAPA', label: 'Chapa', labelAm: 'ቻፓ' },
  { code: 'CBE_BIRR', label: 'CBE Birr', labelAm: 'ሲቢኢ ብር' },
];

export function BillingView({ initData }: { initData: string | null }) {
  const { locale } = useLanguage();
  const am = locale === 'am';
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [showGateways, setShowGateways] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const [viewInvoiceId, setViewInvoiceId] = useState<string | null>(null);
  const [viewPaymentId, setViewPaymentId] = useState<string | null>(null);

  useEffect(() => {
    tmaFetch('/api/v1/telegram/billing', initData)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [initData]);

  if (viewPaymentId) {
    return (
      <PaymentStatusView
        initData={initData}
        paymentId={viewPaymentId}
        onBack={() => setViewPaymentId(null)}
        onViewInvoice={(invId) => {
          setViewPaymentId(null);
          setViewInvoiceId(invId);
        }}
      />
    );
  }

  if (viewInvoiceId) {
    return <InvoiceDetailsView initData={initData} invoiceId={viewInvoiceId} onBack={() => setViewInvoiceId(null)} />;
  }

  const invoiceStatusStyle: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-800',
    OVERDUE: 'bg-red-100 text-red-800',
    PAID: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-slate-100 text-slate-600',
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
        <AlertCircle size={48} className="text-red-500 opacity-80" />
        <h2 className="text-xl font-bold">{am ? 'ስህተት ተከስቷል' : 'Error Loading Billing'}</h2>
        <p className="text-sm text-[var(--tg-theme-hint-color,#64748b)]">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 space-y-4">
        <div className="w-8 h-8 border-4 border-[var(--tg-theme-button-color,#3b82f6)] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[var(--tg-theme-hint-color,#64748b)]">
          {am ? 'የክፍያ መረጃ እየተጫነ ነው...' : 'Loading billing...'}
        </p>
      </div>
    );
  }

  const invoice = data.currentInvoice;

  return (
    <div className="space-y-4 pb-6">
      <h2 className="text-xl font-bold px-2">{am ? 'ክፍያ' : 'Billing'}</h2>

      {/* Outstanding balance */}
      <div className="bg-[var(--tg-theme-button-color,#3b82f6)] text-[var(--tg-theme-button-text-color,#ffffff)] p-6 rounded-xl shadow-md text-center">
        <p className="text-sm opacity-80 mb-1">{am ? 'ቀሪ ሂሳብ' : 'Outstanding Balance'}</p>
        <h1 className="text-3xl font-bold">{data.balance.toLocaleString()} ETB</h1>

        <button
          onClick={() => setShowGateways((v) => !v)}
          disabled={data.balance <= 0}
          className="mt-4 w-full py-2 bg-white/20 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {am ? 'አሁን ይክፈሉ' : 'Pay Now'}
        </button>
      </div>

      {/* Payment gateway selection — UI only, no live payment processing yet */}
      {showGateways && (
        <div className="bg-[var(--tg-theme-bg-color,#ffffff)] rounded-xl shadow-sm border border-[var(--tg-theme-hint-color,#e2e8f0)] p-4 space-y-3">
          <h3 className="text-sm font-semibold">{am ? 'የክፍያ መንገድ ይምረጡ' : 'Select Payment Method'}</h3>
          <div className="space-y-2">
            {PAYMENT_GATEWAYS.map((g) => (
              <button
                key={g.code}
                onClick={() => setSelectedGateway(g.code)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                  selectedGateway === g.code
                    ? 'border-[var(--tg-theme-button-color,#3b82f6)] bg-blue-50 text-[var(--tg-theme-button-color,#3b82f6)]'
                    : 'border-[var(--tg-theme-hint-color,#e2e8f0)]'
                }`}
              >
                <span>{am ? g.labelAm : g.label}</span>
                {selectedGateway === g.code && <CheckCircle size={16} />}
              </button>
            ))}
          </div>

          {selectedGateway && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800">
                {am
                  ? 'የክፍያ ማስተላለፊያ ገና አልተካተተም። ክፍያ በቅርቡ ይገኛል።'
                  : 'Payment processing is not yet available. This gateway integration is coming soon.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Current invoice */}
      <h3 className="font-semibold px-2 mt-6">{am ? 'የአሁኑ ደረሰኝ' : 'Current Invoice'}</h3>
      {invoice ? (
        <button
          onClick={() => setViewInvoiceId(invoice.id)}
          className="w-full text-left bg-[var(--tg-theme-bg-color,#ffffff)] rounded-xl shadow-sm border border-[var(--tg-theme-hint-color,#e2e8f0)] p-4 space-y-2 active:scale-[0.99] transition-transform"
        >
          <div className="flex justify-between items-center">
            <span className="text-sm text-[var(--tg-theme-hint-color,#64748b)]">{am ? 'ቁጥር' : 'Invoice #'}</span>
            <span className="font-mono text-sm font-medium">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[var(--tg-theme-hint-color,#64748b)]">{am ? 'መጠን' : 'Amount'}</span>
            <span className="font-medium">{parseFloat(invoice.amount).toLocaleString()} ETB</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[var(--tg-theme-hint-color,#64748b)]">{am ? 'የመክፈያ ቀን' : 'Due Date'}</span>
            <span className="font-medium">{invoice.dueDate}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[var(--tg-theme-hint-color,#64748b)]">{am ? 'ሁኔታ' : 'Status'}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${invoiceStatusStyle[invoice.status] || 'bg-slate-100 text-slate-700'}`}>
              {invoice.status}
            </span>
          </div>
          <p className="text-xs text-[var(--tg-theme-button-color,#3b82f6)] font-medium pt-1">{am ? 'ዝርዝር ይመልከቱ ›' : 'View Details ›'}</p>
        </button>
      ) : (
        <p className="px-2 text-sm text-[var(--tg-theme-hint-color,#64748b)]">
          {am ? 'ምንም ደረሰኝ አልተገኘም።' : 'No invoices found.'}
        </p>
      )}

      {/* Payment history */}
      <h3 className="font-semibold px-2 mt-6">{am ? 'የክፍያ ታሪክ' : 'Payment History'}</h3>
      <div className="space-y-2">
        {data.payments.length === 0 ? (
          <p className="px-2 text-sm text-[var(--tg-theme-hint-color,#64748b)]">
            {am ? 'ምንም የክፍያ ታሪክ አልተገኘም።' : 'No payment history found.'}
          </p>
        ) : (
          data.payments.map((p: any) => (
            <div
              key={p.id}
              onClick={() => setViewPaymentId(p.id)}
              className="bg-[var(--tg-theme-bg-color,#ffffff)] p-3 rounded-lg border border-[var(--tg-theme-hint-color,#e2e8f0)] flex justify-between items-center cursor-pointer active:scale-[0.99] transition-transform"
            >
              <div>
                <p className="font-medium text-sm">{p.paymentDate}</p>
                <p className="text-xs text-[var(--tg-theme-hint-color,#64748b)]">{p.paymentMethod}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{parseFloat(p.amount).toLocaleString()} ETB</p>
                <p className={`text-xs ${p.status === 'PAID' ? 'text-green-600' : 'text-red-500'}`}>{p.status}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function InvoiceDetailsView({
  initData,
  invoiceId,
  onBack,
}: {
  initData: string | null;
  invoiceId: string;
  onBack: () => void;
}) {
  const { locale } = useLanguage();
  const am = locale === 'am';
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [showGateways, setShowGateways] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);

  useEffect(() => {
    tmaFetch(`/api/v1/telegram/invoices/${invoiceId}`, initData)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [initData, invoiceId]);

  const invoiceStatusStyle: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-800',
    OVERDUE: 'bg-red-100 text-red-800',
    PAID: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-slate-100 text-slate-600',
  };

  const fmt = (num: number) => num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const Row = ({ label, labelAm, value, bold }: { label: string; labelAm: string; value: React.ReactNode; bold?: boolean }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-[var(--tg-theme-hint-color,#e2e8f0)] last:border-0">
      <span className="text-sm text-[var(--tg-theme-hint-color,#64748b)]">{am ? labelAm : label}</span>
      <span className={`text-right ${bold ? 'font-bold text-base' : 'font-medium'}`}>{value}</span>
    </div>
  );

  return (
    <div className="space-y-4 pb-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-[var(--tg-theme-button-color,#3b82f6)] px-1">
        <ArrowLeft size={16} />
        {am ? 'ተመለስ' : 'Back'}
      </button>

      {error && (
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
          <AlertCircle size={48} className="text-red-500 opacity-80" />
          <h2 className="text-xl font-bold">{am ? 'ስህተት ተከስቷል' : 'Error Loading Invoice'}</h2>
          <p className="text-sm text-[var(--tg-theme-hint-color,#64748b)]">{error}</p>
        </div>
      )}

      {!error && !data && (
        <div className="flex flex-col items-center justify-center p-6 space-y-4">
          <div className="w-8 h-8 border-4 border-[var(--tg-theme-button-color,#3b82f6)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--tg-theme-hint-color,#64748b)]">{am ? 'ደረሰኝ እየተጫነ ነው...' : 'Loading invoice...'}</p>
        </div>
      )}

      {data && (
        <>
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold">{am ? 'የደረሰኝ ዝርዝር' : 'Invoice Details'}</h2>
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${invoiceStatusStyle[data.status] || 'bg-slate-100 text-slate-700'}`}>
              {data.status}
            </span>
          </div>

          {/* Identification */}
          <div className="bg-[var(--tg-theme-bg-color,#ffffff)] rounded-xl shadow-sm border border-[var(--tg-theme-hint-color,#e2e8f0)] px-4">
            <Row label="Invoice No." labelAm="ደረሰኝ ቁጥር" value={<span className="font-mono text-sm">{data.invoiceNumber}</span>} />
            <Row label="Billing Period" labelAm="የክፍያ ወቅት" value={data.billingPeriod} />
            <Row label="Tenant" labelAm="ተከራይ" value={data.tenantName} />
            <Row label="Building" labelAm="ህንፃ" value={data.buildingName} />
            <Row label="Unit" labelAm="ክፍል" value={data.unitNumber} />
            <Row label="Due Date" labelAm="የመክፈያ ቀን" value={data.dueDate} />
          </div>

          {/* Financial breakdown */}
          <div className="bg-[var(--tg-theme-bg-color,#ffffff)] rounded-xl shadow-sm border border-[var(--tg-theme-hint-color,#e2e8f0)] px-4">
            <Row label="Rent" labelAm="ኪራይ" value={`${fmt(data.rent)} ETB`} />
            <Row label="Utilities" labelAm="መገልገያዎች" value={`${fmt(data.utilities)} ETB`} />
            <Row label="Late Fees" labelAm="የቅጣት ክፍያ" value={`${fmt(data.lateFees)} ETB`} />
            <Row label="Discounts" labelAm="ቅናሽ" value={`-${fmt(data.discounts)} ETB`} />
            <Row label="Total" labelAm="ጠቅላላ" value={`${fmt(data.total)} ETB`} bold />
          </div>

          {/* Payment status */}
          <div className="bg-[var(--tg-theme-bg-color,#ffffff)] rounded-xl shadow-sm border border-[var(--tg-theme-hint-color,#e2e8f0)] px-4">
            <Row label="Amount Paid" labelAm="የተከፈለ መጠን" value={`${fmt(data.amountPaid)} ETB`} />
            <Row
              label="Remaining Balance"
              labelAm="ቀሪ ሂሳብ"
              value={<span className={data.remainingBalance > 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>{fmt(data.remainingBalance)} ETB</span>}
            />
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={() => setShowGateways((v) => !v)}
              disabled={data.remainingBalance <= 0}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--tg-theme-button-color,#3b82f6)] text-[var(--tg-theme-button-text-color,#ffffff)] rounded-xl font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {am ? 'ደረሰኙን ይክፈሉ' : 'Pay Invoice'}
            </button>

            <button
              onClick={() => data.receiptUrl && window.open(data.receiptUrl, '_blank', 'noopener,noreferrer')}
              disabled={!data.receiptUrl}
              className="w-full flex items-center justify-center gap-2 py-3 border border-[var(--tg-theme-button-color,#3b82f6)] text-[var(--tg-theme-button-color,#3b82f6)] rounded-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Receipt size={16} />
              {data.receiptUrl ? (am ? 'ደረሰኝ ይመልከቱ' : 'View Receipt') : (am ? 'ደረሰኝ አልተገኘም' : 'No Receipt Available')}
            </button>

            {showGateways && (
              <div className="bg-[var(--tg-theme-bg-color,#ffffff)] rounded-xl shadow-sm border border-[var(--tg-theme-hint-color,#e2e8f0)] p-4 space-y-3">
                <h3 className="text-sm font-semibold">{am ? 'የክፍያ መንገድ ይምረጡ' : 'Select Payment Method'}</h3>
                <div className="space-y-2">
                  {PAYMENT_GATEWAYS.map((g) => (
                    <button
                      key={g.code}
                      onClick={() => setSelectedGateway(g.code)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                        selectedGateway === g.code
                          ? 'border-[var(--tg-theme-button-color,#3b82f6)] bg-blue-50 text-[var(--tg-theme-button-color,#3b82f6)]'
                          : 'border-[var(--tg-theme-hint-color,#e2e8f0)]'
                      }`}
                    >
                      <span>{am ? g.labelAm : g.label}</span>
                      {selectedGateway === g.code && <CheckCircle size={16} />}
                    </button>
                  ))}
                </div>
                {selectedGateway && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-800">
                      {am
                        ? 'የክፍያ ማስተላለፊያ ገና አልተካተተም። ክፍያ በቅርቡ ይገኛል።'
                        : 'Payment processing is not yet available. This gateway integration is coming soon.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const PAYMENT_STATUS_CONFIG: Record<
  string,
  { bg: string; text: string; label: string; labelAm: string; icon: React.ElementType }
> = {
  PENDING: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Pending', labelAm: 'በመጠባበቅ ላይ', icon: Clock },
  PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Processing', labelAm: 'በሂደት ላይ', icon: Loader2 },
  PAID: { bg: 'bg-green-100', text: 'text-green-800', label: 'Paid', labelAm: 'ተከፍሏል', icon: CheckCircle },
  FAILED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed', labelAm: 'አልተሳካም', icon: XCircle },
  CANCELLED: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Cancelled', labelAm: 'ተሰርዟል', icon: XCircle },
  EXPIRED: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Expired', labelAm: 'ጊዜው አልፏል', icon: AlertCircle },
};

export function PaymentStatusView({
  initData,
  paymentId,
  onBack,
  onViewInvoice,
}: {
  initData: string | null;
  paymentId: string;
  onBack: () => void;
  onViewInvoice?: (invoiceId: string) => void;
}) {
  const { locale } = useLanguage();
  const am = locale === 'am';
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [showGateways, setShowGateways] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);

  const load = (silent = false) => {
    if (silent) setChecking(true);
    return tmaFetch(`/api/v1/telegram/payments/${paymentId}/status`, initData)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setChecking(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initData, paymentId]);

  const Row = ({ label, labelAm, value }: { label: string; labelAm: string; value: React.ReactNode }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-[var(--tg-theme-hint-color,#e2e8f0)] last:border-0">
      <span className="text-sm text-[var(--tg-theme-hint-color,#64748b)]">{am ? labelAm : label}</span>
      <span className="font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );

  return (
    <div className="space-y-4 pb-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-[var(--tg-theme-button-color,#3b82f6)] px-1">
        <ArrowLeft size={16} />
        {am ? 'ተመለስ' : 'Back'}
      </button>

      {error && (
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
          <AlertCircle size={48} className="text-red-500 opacity-80" />
          <h2 className="text-xl font-bold">{am ? 'ስህተት ተከስቷል' : 'Error Loading Payment'}</h2>
          <p className="text-sm text-[var(--tg-theme-hint-color,#64748b)]">{error}</p>
        </div>
      )}

      {!error && !data && (
        <div className="flex flex-col items-center justify-center p-6 space-y-4">
          <div className="w-8 h-8 border-4 border-[var(--tg-theme-button-color,#3b82f6)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--tg-theme-hint-color,#64748b)]">{am ? 'የክፍያ ሁኔታ እየተጫነ ነው...' : 'Loading payment status...'}</p>
        </div>
      )}

      {data && (() => {
        const cfg = PAYMENT_STATUS_CONFIG[data.status] || PAYMENT_STATUS_CONFIG.PENDING;
        const StatusIcon = cfg.icon;
        return (
          <>
            {/* Status hero */}
            <div className="flex flex-col items-center text-center gap-2 py-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${cfg.bg}`}>
                <StatusIcon size={32} className={`${cfg.text} ${data.status === 'PROCESSING' ? 'animate-spin' : ''}`} />
              </div>
              <h2 className="text-xl font-bold">{am ? cfg.labelAm : cfg.label}</h2>
              <p className="text-2xl font-bold">{parseFloat(data.amount).toLocaleString()} ETB</p>
            </div>

            {/* Details */}
            <div className="bg-[var(--tg-theme-bg-color,#ffffff)] rounded-xl shadow-sm border border-[var(--tg-theme-hint-color,#e2e8f0)] px-4">
              <Row label="Invoice No." labelAm="ደረሰኝ ቁጥር" value={data.invoiceNumber || (am ? 'የለም' : 'N/A')} />
              <Row label="Payment Method" labelAm="የክፍያ መንገድ" value={data.paymentMethod} />
              <Row label="Transaction Reference" labelAm="የግብይት ማጣቀሻ" value={<span className="font-mono text-xs">{data.referenceNumber || (am ? 'የለም' : 'N/A')}</span>} />
              <Row label="Date" labelAm="ቀን" value={data.paymentDate} />
              <Row
                label="Current Status"
                labelAm="የአሁኑ ሁኔታ"
                value={
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${cfg.bg} ${cfg.text}`}>
                    {data.status}
                  </span>
                }
              />
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {data.status === 'PAID' && (
                <button
                  onClick={() => data.receiptUrl && window.open(data.receiptUrl, '_blank', 'noopener,noreferrer')}
                  disabled={!data.receiptUrl}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--tg-theme-button-color,#3b82f6)] text-[var(--tg-theme-button-text-color,#ffffff)] rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Receipt size={16} />
                  {data.receiptUrl ? (am ? 'ደረሰኝ ይመልከቱ' : 'View Receipt') : (am ? 'ደረሰኝ አልተገኘም' : 'No Receipt Available')}
                </button>
              )}

              {(data.status === 'PENDING' || data.status === 'PROCESSING') && (
                <button
                  onClick={() => load(true)}
                  disabled={checking}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-[var(--tg-theme-button-color,#3b82f6)] text-[var(--tg-theme-button-color,#3b82f6)] rounded-xl font-medium text-sm disabled:opacity-60"
                >
                  <RefreshCw size={16} className={checking ? 'animate-spin' : ''} />
                  {am ? 'ሁኔታ ያረጋግጡ' : 'Check Status'}
                </button>
              )}

              {data.canRetry && (
                <button
                  onClick={() => setShowGateways((v) => !v)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--tg-theme-button-color,#3b82f6)] text-[var(--tg-theme-button-text-color,#ffffff)] rounded-xl font-medium active:scale-[0.98] transition-all"
                >
                  <RefreshCw size={16} />
                  {am ? 'ክፍያ እንደገና ይሞክሩ' : 'Retry Payment'}
                </button>
              )}

              {data.invoiceId && onViewInvoice && (
                <button
                  onClick={() => onViewInvoice(data.invoiceId)}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-[var(--tg-theme-hint-color,#64748b)]"
                >
                  <FileText size={16} />
                  {am ? 'ደረሰኝ ይመልከቱ' : 'View Invoice'}
                </button>
              )}

              {showGateways && (
                <div className="bg-[var(--tg-theme-bg-color,#ffffff)] rounded-xl shadow-sm border border-[var(--tg-theme-hint-color,#e2e8f0)] p-4 space-y-3">
                  <h3 className="text-sm font-semibold">{am ? 'የክፍያ መንገድ ይምረጡ' : 'Select Payment Method'}</h3>
                  <div className="space-y-2">
                    {PAYMENT_GATEWAYS.map((g) => (
                      <button
                        key={g.code}
                        onClick={() => setSelectedGateway(g.code)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                          selectedGateway === g.code
                            ? 'border-[var(--tg-theme-button-color,#3b82f6)] bg-blue-50 text-[var(--tg-theme-button-color,#3b82f6)]'
                            : 'border-[var(--tg-theme-hint-color,#e2e8f0)]'
                        }`}
                      >
                        <span>{am ? g.labelAm : g.label}</span>
                        {selectedGateway === g.code && <CheckCircle size={16} />}
                      </button>
                    ))}
                  </div>
                  {selectedGateway && (
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-800">
                        {am
                          ? 'የክፍያ ማስተላለፊያ ገና አልተካተተም። ክፍያ በቅርቡ ይገኛል።'
                          : 'Payment processing is not yet available. This gateway integration is coming soon.'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        );
      })()}
    </div>
  );
}

const MAINTENANCE_PRIORITIES = [
  { code: 'LOW', label: 'Low', labelAm: 'ዝቅተኛ' },
  { code: 'MEDIUM', label: 'Medium', labelAm: 'መካከለኛ' },
  { code: 'HIGH', label: 'High', labelAm: 'ከፍተኛ' },
  { code: 'URGENT', label: 'Urgent', labelAm: 'አስቸኳይ' },
];

const MAINTENANCE_STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-slate-100 text-slate-600',
};

const ACTIVE_MAINTENANCE_STATUSES = ['PENDING', 'IN_PROGRESS'];

export function MaintenanceView({ initData }: { initData: string | null }) {
  const { locale } = useLanguage();
  const am = locale === 'am';
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadData = () => {
    tmaFetch('/api/v1/telegram/maintenance', initData)
      .then((res) => setData(res))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initData]);

  const resetForm = () => {
    setTitle('');
    setDesc('');
    setPriority('MEDIUM');
    setPhotoUrl('');
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !desc) return;
    setSubmitting(true);
    setFormError('');
    try {
      await tmaFetch('/api/v1/telegram/maintenance', initData, {
        method: 'POST',
        body: JSON.stringify({ title, description: desc, priority, photoUrl: photoUrl || undefined }),
      });
      resetForm();
      setShowForm(false);
      setSubmitted(true);
      loadData();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const activeRequests = data.filter((r) => ACTIVE_MAINTENANCE_STATUSES.includes(r.status));
  const completedRequests = data.filter((r) => !ACTIVE_MAINTENANCE_STATUSES.includes(r.status));

  const RequestCard = ({ r }: { r: any }) => (
    <div className="bg-[var(--tg-theme-bg-color,#ffffff)] p-3 rounded-lg border border-[var(--tg-theme-hint-color,#e2e8f0)] space-y-1.5">
      <div className="flex justify-between items-start gap-2">
        <h4 className="font-medium text-sm">{r.title}</h4>
        <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${MAINTENANCE_STATUS_STYLE[r.status] || 'bg-slate-100 text-slate-700'}`}>
          {r.status}
        </span>
      </div>
      <p className="text-xs text-[var(--tg-theme-hint-color,#64748b)] line-clamp-2">{r.description}</p>
      <p className="text-[11px] text-[var(--tg-theme-hint-color,#64748b)]">
        {am ? 'የተፈጠረበት ቀን' : 'Created'}: {new Date(r.createdAt).toLocaleDateString()}
      </p>
    </div>
  );

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-bold">{am ? 'ጥገና' : 'Maintenance'}</h2>
        <button
          onClick={() => {
            setSubmitted(false);
            setShowForm((v) => !v);
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--tg-theme-button-color,#3b82f6)] text-[var(--tg-theme-button-text-color,#ffffff)] text-xs font-semibold"
        >
          <Plus size={14} />
          {am ? 'አዲስ ጥያቄ' : 'New Request'}
        </button>
      </div>

      {error && (
        <p className="px-2 text-sm text-red-500">{error}</p>
      )}

      {submitted && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mx-2">
          <CheckCircle size={18} className="text-green-600 shrink-0" />
          <p className="text-sm text-green-800 font-medium">
            {am ? 'ጥያቄዎ በተሳካ ሁኔታ ተልኳል!' : 'Your request was submitted successfully!'}
          </p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[var(--tg-theme-bg-color,#ffffff)] p-4 rounded-xl shadow-sm border border-[var(--tg-theme-hint-color,#e2e8f0)] space-y-3 mx-2">
          <h3 className="font-semibold text-sm">{am ? 'አዲስ ጥያቄ' : 'New Request'}</h3>

          {formError && <p className="text-xs text-red-500">{formError}</p>}

          <div>
            <label className="block text-xs font-medium text-[var(--tg-theme-hint-color,#64748b)] mb-1">{am ? 'ርዕስ' : 'Title'}</label>
            <input
              placeholder={am ? 'ለምሳሌ፣ የቧንቧ ፍሳሽ' : 'e.g., Leaking Pipe'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-[var(--tg-theme-hint-color,#e2e8f0)] rounded-lg bg-transparent text-inherit"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--tg-theme-hint-color,#64748b)] mb-1">{am ? 'መግለጫ' : 'Description'}</label>
            <textarea
              placeholder={am ? 'ችግሩን ይግለጹ...' : 'Describe the issue...'}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-[var(--tg-theme-hint-color,#e2e8f0)] rounded-lg h-20 bg-transparent text-inherit"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--tg-theme-hint-color,#64748b)] mb-1">{am ? 'ቅድሚያ' : 'Priority'}</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-[var(--tg-theme-hint-color,#e2e8f0)] rounded-lg bg-transparent text-inherit"
            >
              {MAINTENANCE_PRIORITIES.map((p) => (
                <option key={p.code} value={p.code}>
                  {am ? p.labelAm : p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--tg-theme-hint-color,#64748b)] mb-1">
              <Camera size={13} />
              {am ? 'የፎቶ አድራሻ (አማራጭ)' : 'Photo URL (optional)'}
            </label>
            <input
              placeholder="https://example.com/photo.jpg"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-[var(--tg-theme-hint-color,#e2e8f0)] rounded-lg bg-transparent text-inherit"
            />
          </div>

          <button
            disabled={submitting}
            className="w-full py-2.5 bg-[var(--tg-theme-button-color,#3b82f6)] text-[var(--tg-theme-button-text-color,#ffffff)] rounded-lg text-sm font-medium disabled:opacity-60"
          >
            {submitting ? (am ? 'በመላክ ላይ...' : 'Submitting...') : (am ? 'ጥያቄ ላክ' : 'Submit Request')}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-6 space-y-4">
          <div className="w-8 h-8 border-4 border-[var(--tg-theme-button-color,#3b82f6)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--tg-theme-hint-color,#64748b)]">{am ? 'ጥያቄዎች እየተጫኑ ነው...' : 'Loading requests...'}</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <h3 className="font-semibold px-2">{am ? 'ንቁ ጥያቄዎች' : 'Active Requests'}</h3>
            {activeRequests.length === 0 ? (
              <p className="px-2 text-sm text-[var(--tg-theme-hint-color,#64748b)]">
                {am ? 'ምንም ንቁ ጥያቄ የለም።' : 'No active requests.'}
              </p>
            ) : (
              <div className="space-y-2 px-2">
                {activeRequests.map((r) => (
                  <RequestCard key={r.id} r={r} />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold px-2">{am ? 'የተጠናቀቁ ጥያቄዎች' : 'Completed Requests'}</h3>
            {completedRequests.length === 0 ? (
              <p className="px-2 text-sm text-[var(--tg-theme-hint-color,#64748b)]">
                {am ? 'ምንም የተጠናቀቀ ጥያቄ የለም።' : 'No completed requests.'}
              </p>
            ) : (
              <div className="space-y-2 px-2">
                {completedRequests.map((r) => (
                  <RequestCard key={r.id} r={r} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Categorizes a real notification record for display — purely presentational, based on its actual title/type.
function classifyNotification(n: any): { icon: React.ElementType; label: string; labelAm: string } {
  const title = (n.title || '').toLowerCase();
  const message = (n.message || '').toLowerCase();
  const text = `${title} ${message}`;

  if (text.includes('invoice') || text.includes('rent')) {
    return { icon: Wallet, label: 'Rent Reminder', labelAm: 'የኪራይ ማስታወሻ' };
  }
  if (text.includes('payment') || text.includes('receipt')) {
    return { icon: CheckCircle, label: 'Payment Confirmation', labelAm: 'የክፍያ ማረጋገጫ' };
  }
  if (text.includes('lease') || text.includes('renewal') || text.includes('expir')) {
    return { icon: CalendarClock, label: 'Lease Expiry', labelAm: 'የውል ማብቂያ' };
  }
  if (text.includes('maintenance')) {
    return { icon: Wrench, label: 'Maintenance Update', labelAm: 'የጥገና ዝማኔ' };
  }
  return { icon: Megaphone, label: 'Announcement', labelAm: 'ማስታወቂያ' };
}

export function NotificationsView({ initData, onBack }: { initData: string | null; onBack?: () => void }) {
  const { locale } = useLanguage();
  const am = locale === 'am';
  const [data, setData] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const [markingId, setMarkingId] = useState<string | null>(null);

  useEffect(() => {
    tmaFetch('/api/v1/telegram/notifications', initData)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [initData]);

  const handleMarkRead = async (id: string) => {
    setMarkingId(id);
    try {
      await tmaFetch(`/api/v1/telegram/notifications/${id}/read`, initData, { method: 'POST' });
      setData((prev) => (prev ? prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)) : prev));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between px-2">
        {onBack ? (
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-[var(--tg-theme-button-color,#3b82f6)]">
            <ArrowLeft size={16} />
            {am ? 'ተመለስ' : 'Back'}
          </button>
        ) : (
          <h2 className="text-xl font-bold">{am ? 'ማሳወቂያዎች' : 'Notifications'}</h2>
        )}
      </div>

      {error && (
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
          <AlertCircle size={48} className="text-red-500 opacity-80" />
          <h2 className="text-xl font-bold">{am ? 'ስህተት ተከስቷል' : 'Error Loading Notifications'}</h2>
          <p className="text-sm text-[var(--tg-theme-hint-color,#64748b)]">{error}</p>
        </div>
      )}

      {!error && !data && (
        <div className="flex flex-col items-center justify-center p-6 space-y-4">
          <div className="w-8 h-8 border-4 border-[var(--tg-theme-button-color,#3b82f6)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--tg-theme-hint-color,#64748b)]">{am ? 'ማሳወቂያዎች እየተጫኑ ነው...' : 'Loading notifications...'}</p>
        </div>
      )}

      {data && data.length === 0 && (
        <p className="px-2 text-sm text-[var(--tg-theme-hint-color,#64748b)]">
          {am ? 'ምንም ማሳወቂያ የለም።' : 'No notifications yet.'}
        </p>
      )}

      {data && data.length > 0 && (
        <div className="space-y-2 px-2">
          {data.map((n) => {
            const { icon: Icon, label, labelAm } = classifyNotification(n);
            return (
              <div
                key={n.id}
                className={`flex gap-3 p-3 rounded-lg border ${
                  n.isRead
                    ? 'bg-[var(--tg-theme-bg-color,#ffffff)] border-[var(--tg-theme-hint-color,#e2e8f0)]'
                    : 'bg-blue-50/60 border-blue-200'
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${n.isRead ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-600'}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--tg-theme-hint-color,#64748b)]">
                      {am ? labelAm : label}
                    </span>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                  </div>
                  <p className={`text-sm ${n.isRead ? 'font-normal' : 'font-semibold'}`}>{n.title}</p>
                  <p className="text-xs text-[var(--tg-theme-hint-color,#64748b)] line-clamp-2">{n.message}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[11px] text-[var(--tg-theme-hint-color,#64748b)]">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        disabled={markingId === n.id}
                        className="flex items-center gap-1 text-[11px] font-semibold text-[var(--tg-theme-button-color,#3b82f6)] disabled:opacity-50"
                      >
                        <Check size={12} />
                        {am ? 'እንደተነበበ ምልክት አድርግ' : 'Mark as read'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ProfileView({
  initData,
  onDisconnected,
  onLoggedOut,
}: {
  initData: string | null;
  onDisconnected?: () => void;
  onLoggedOut?: () => void;
}) {
  const { locale, setLocale } = useLanguage();
  const am = locale === 'am';
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    tmaFetch('/api/v1/telegram/profile', initData)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [initData]);

  const tgColorScheme: 'light' | 'dark' | null = (window as any).Telegram?.WebApp?.colorScheme || null;

  const handleLogout = async () => {
    if (!window.confirm(am ? 'ከBuildingOS መለያዎ መውጣት ይፈልጋሉ?' : 'Are you sure you want to log out of BuildingOS?')) return;
    onLoggedOut?.();
  };

  const handleDisconnect = async () => {
    if (!window.confirm(am ? 'ቴሌግራምን ማላቀቅ ይፈልጋሉ?' : 'Disconnect this Telegram account from BuildingOS?')) return;
    setDisconnecting(true);
    try {
      await tmaFetch('/api/v1/telegram/disconnect', initData, { method: 'POST' });
      onDisconnected?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDisconnecting(false);
    }
  };

  const Row = ({ icon: Icon, label, labelAm, value }: { icon: React.ElementType; label: string; labelAm: string; value: React.ReactNode }) => (
    <div className="flex items-center gap-3 py-2.5 border-b border-[var(--tg-theme-hint-color,#e2e8f0)] last:border-0">
      <Icon size={16} className="text-[var(--tg-theme-hint-color,#64748b)] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-[var(--tg-theme-hint-color,#64748b)] uppercase tracking-wide">{am ? labelAm : label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
        <AlertCircle size={48} className="text-red-500 opacity-80" />
        <h2 className="text-xl font-bold">{am ? 'ስህተት ተከስቷል' : 'Error Loading Profile'}</h2>
        <p className="text-sm text-[var(--tg-theme-hint-color,#64748b)]">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 space-y-4">
        <div className="w-8 h-8 border-4 border-[var(--tg-theme-button-color,#3b82f6)] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[var(--tg-theme-hint-color,#64748b)]">{am ? 'መገለጫ እየተጫነ ነው...' : 'Loading profile...'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-2 py-2">
        <div className="w-16 h-16 rounded-full bg-[var(--tg-theme-button-color,#3b82f6)] text-[var(--tg-theme-button-text-color,#ffffff)] flex items-center justify-center text-xl font-bold">
          {(data.fullName || '?').charAt(0).toUpperCase()}
        </div>
        <h2 className="text-lg font-bold">{data.fullName}</h2>
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${data.accountStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
          {am ? (data.accountStatus === 'ACTIVE' ? 'ንቁ' : 'ንቁ ያልሆነ') : data.accountStatus}
        </span>
      </div>

      {/* Info */}
      <div className="bg-[var(--tg-theme-bg-color,#ffffff)] rounded-xl shadow-sm border border-[var(--tg-theme-hint-color,#e2e8f0)] px-4">
        <Row icon={Mail} label="Email" labelAm="ኢሜይል" value={data.email || (am ? 'አልተመዘገበም' : 'Not available')} />
        {data.phone && <Row icon={Phone} label="Phone" labelAm="ስልክ" value={data.phone} />}
        <Row icon={Building} label="Building" labelAm="ሕንፃ" value={data.buildingName || (am ? 'የተመደበ ክፍል የለም' : 'No assigned unit')} />
        {data.unitNumber && <Row icon={FileText} label="Unit" labelAm="ክፍል" value={data.unitNumber} />}
      </div>

      {/* Settings */}
      <h3 className="font-semibold px-2">{am ? 'ቅንብሮች' : 'Settings'}</h3>
      <div className="bg-[var(--tg-theme-bg-color,#ffffff)] rounded-xl shadow-sm border border-[var(--tg-theme-hint-color,#e2e8f0)] px-4">
        <div className="flex items-center justify-between py-2.5 border-b border-[var(--tg-theme-hint-color,#e2e8f0)]">
          <span className="text-sm font-medium">{am ? 'ቋንቋ' : 'Language'}</span>
          <div className="flex rounded-full border border-[var(--tg-theme-hint-color,#e2e8f0)] overflow-hidden">
            <button
              onClick={() => setLocale('am')}
              className={`px-3 py-1 text-xs font-semibold ${locale === 'am' ? 'bg-[var(--tg-theme-button-color,#3b82f6)] text-[var(--tg-theme-button-text-color,#ffffff)]' : ''}`}
            >
              አማርኛ
            </button>
            <button
              onClick={() => setLocale('en')}
              className={`px-3 py-1 text-xs font-semibold ${locale === 'en' ? 'bg-[var(--tg-theme-button-color,#3b82f6)] text-[var(--tg-theme-button-text-color,#ffffff)]' : ''}`}
            >
              English
            </button>
          </div>
        </div>

        {tgColorScheme && (
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm font-medium">{am ? 'የቴሌግራም ገጽታ' : 'Telegram Theme'}</span>
            <span className="flex items-center gap-1.5 text-xs text-[var(--tg-theme-hint-color,#64748b)]">
              {tgColorScheme === 'dark' ? <Moon size={13} /> : <Sun size={13} />}
              {tgColorScheme === 'dark' ? (am ? 'ጨለማ' : 'Dark') : (am ? 'ብርሃን' : 'Light')}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <h3 className="font-semibold px-2">{am ? 'ተጨማሪ' : 'More'}</h3>
      <div className="bg-[var(--tg-theme-bg-color,#ffffff)] rounded-xl shadow-sm border border-[var(--tg-theme-hint-color,#e2e8f0)] px-4">
        <button onClick={() => setShowHelp((v) => !v)} className="w-full flex items-center gap-3 py-3 border-b border-[var(--tg-theme-hint-color,#e2e8f0)]">
          <HelpCircle size={16} className="text-[var(--tg-theme-hint-color,#64748b)]" />
          <span className="flex-1 text-left text-sm font-medium">{am ? 'እገዛ' : 'Help'}</span>
          <ChevronRight size={16} className={`text-[var(--tg-theme-hint-color,#64748b)] transition-transform ${showHelp ? 'rotate-90' : ''}`} />
        </button>
        {showHelp && (
          <div className="pb-3 pt-1 text-xs text-[var(--tg-theme-hint-color,#64748b)] space-y-1.5">
            <p>{am ? 'ጥያቄ ካልዎት፣ ከንብረት አስተዳዳሪዎ ጋር ይገናኙ ወይም ከ"ጥገና" ገጽ ጥያቄ ያስገቡ።' : 'For questions, contact your property manager or submit a request from the Maintenance page.'}</p>
            <p>{am ? 'የክፍያ ጉዳዮች ካሉ ወደ "ክፍያ" ገጽ ይሂዱ።' : 'For billing issues, visit the Billing page.'}</p>
          </div>
        )}

        <button onClick={() => setShowContact((v) => !v)} className="w-full flex items-center gap-3 py-3 border-b border-[var(--tg-theme-hint-color,#e2e8f0)]">
          <Users size={16} className="text-[var(--tg-theme-hint-color,#64748b)]" />
          <span className="flex-1 text-left text-sm font-medium">{am ? 'የአደጋ ጊዜ ግንኙነት' : 'Contact Management'}</span>
          <ChevronRight size={16} className={`text-[var(--tg-theme-hint-color,#64748b)] transition-transform ${showContact ? 'rotate-90' : ''}`} />
        </button>
        {showContact && (
          <div className="pb-3 pt-1 text-xs space-y-1">
            <p className="text-[var(--tg-theme-hint-color,#64748b)]">
              {am ? 'ስም' : 'Name'}: <span className="font-medium text-[var(--tg-theme-text-color,#000000)]">{data.emergencyContactName || (am ? 'አልተመዘገበም' : 'Not provided')}</span>
            </p>
            <p className="text-[var(--tg-theme-hint-color,#64748b)]">
              {am ? 'ስልክ' : 'Phone'}: <span className="font-medium text-[var(--tg-theme-text-color,#000000)]">{data.emergencyContactPhone || (am ? 'አልተመዘገበም' : 'Not provided')}</span>
            </p>
          </div>
        )}

        <button onClick={handleLogout} className="w-full flex items-center gap-3 py-3 border-b border-[var(--tg-theme-hint-color,#e2e8f0)] text-red-600">
          <LogOut size={16} />
          <span className="flex-1 text-left text-sm font-medium">{am ? 'ውጣ' : 'Logout'}</span>
        </button>

        <button onClick={handleDisconnect} disabled={disconnecting} className="w-full flex items-center gap-3 py-3 text-red-600 disabled:opacity-50">
          <Unlink size={16} />
          <span className="flex-1 text-left text-sm font-medium">
            {disconnecting ? (am ? 'በማላቀቅ ላይ...' : 'Disconnecting...') : (am ? 'ቴሌግራምን አላቅቅ' : 'Disconnect Telegram')}
          </span>
        </button>
      </div>
    </div>
  );
}

