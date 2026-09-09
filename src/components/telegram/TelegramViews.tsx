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
import { Building, FileText, Wrench, Wallet, Bell, AlertCircle, CheckCircle, ArrowLeft, Receipt } from 'lucide-react';

export function TenantHomeView({ initData }: { initData: string | null }) {
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
        <h2 className="text-xl font-bold">Error Loading Dashboard</h2>
        <p className="text-sm text-[var(--tg-theme-hint-color,#64748b)]">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 space-y-4">
        <div className="w-8 h-8 border-4 border-[var(--tg-theme-button-color,#3b82f6)] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-[var(--tg-theme-hint-color,#64748b)]">Loading your data...</p>
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
          <div className="relative">
            <Bell size={24} className="text-[var(--tg-theme-text-color,#000000)]" />
            {data.unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {data.unreadNotifications}
              </span>
            )}
          </div>
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
          <p className="text-sm text-[var(--tg-theme-hint-color,#64748b)]">Unit {data.unitNumber}</p>
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
        <h2 className="text-xl font-bold">Error Loading Property</h2>
        <p className="text-sm text-[var(--tg-theme-hint-color,#64748b)]">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 space-y-4">
        <div className="w-8 h-8 border-4 border-[var(--tg-theme-button-color,#3b82f6)] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-[var(--tg-theme-hint-color,#64748b)]">Loading property details...</p>
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
          <span className="font-medium">{data.floor?.floorName || `Floor ${data.floor?.floorNumber || 'N/A'}`}</span>
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

      <button className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--tg-theme-button-color,#3b82f6)] text-[var(--tg-theme-button-text-color,#ffffff)] rounded-xl font-medium transition-all active:scale-[0.98]">
        <Building size={18} />
        {locale === 'am' ? 'በ 3D ይመልከቱ' : 'View 3D Property'}
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

  useEffect(() => {
    tmaFetch('/api/v1/telegram/billing', initData)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [initData]);

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
              onClick={() => p.invoiceId && setViewInvoiceId(p.invoiceId)}
              className={`bg-[var(--tg-theme-bg-color,#ffffff)] p-3 rounded-lg border border-[var(--tg-theme-hint-color,#e2e8f0)] flex justify-between items-center ${p.invoiceId ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''}`}
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

export function MaintenanceView({ initData }: { initData: string | null }) {
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = () => {
    tmaFetch('/api/v1/telegram/maintenance', initData)
      .then(setData)
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    loadData();
  }, [initData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !desc) return;
    setSubmitting(true);
    try {
      await tmaFetch('/api/v1/telegram/maintenance', initData, {
        method: 'POST',
        body: JSON.stringify({ title, description: desc })
      });
      setTitle('');
      setDesc('');
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold px-2">Maintenance</h2>
      
      {error && <div className="text-red-500 p-2 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-[var(--tg-theme-bg-color,#ffffff)] p-4 rounded-xl shadow-sm border border-[var(--tg-theme-hint-color,#e2e8f0)] space-y-3">
        <h3 className="font-semibold text-sm">New Request</h3>
        <input 
          placeholder="Issue Title (e.g., Leaking Pipe)"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full text-sm px-3 py-2 border rounded-lg bg-transparent text-inherit"
          required
        />
        <textarea 
          placeholder="Describe the issue..."
          value={desc}
          onChange={e => setDesc(e.target.value)}
          className="w-full text-sm px-3 py-2 border rounded-lg h-20 bg-transparent text-inherit"
          required
        />
        <button 
          disabled={submitting}
          className="w-full py-2 bg-[var(--tg-theme-button-color,#3b82f6)] text-[var(--tg-theme-button-text-color,#ffffff)] rounded-lg text-sm font-medium"
        >
          {submitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>

      <div className="space-y-3">
        <h3 className="font-semibold px-2">My Requests</h3>
        {data.length === 0 ? (
          <p className="px-2 text-sm text-[var(--tg-theme-hint-color,#64748b)]">No maintenance requests.</p>
        ) : (
          data.map((r: any) => (
            <div key={r.id} className="bg-[var(--tg-theme-bg-color,#ffffff)] p-3 rounded-lg border border-[var(--tg-theme-hint-color,#e2e8f0)]">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-medium text-sm">{r.title}</h4>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${r.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {r.status}
                </span>
              </div>
              <p className="text-xs text-[var(--tg-theme-hint-color,#64748b)] line-clamp-2">{r.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

