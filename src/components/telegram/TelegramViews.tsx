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

export function TenantHomeView({ initData }: { initData: string | null }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    tmaFetch('/api/v1/telegram/dashboard', initData)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [initData]);

  if (error) return <div className="text-red-500 p-4">{error}</div>;
  if (!data) return <div className="p-4 opacity-70">Loading dashboard...</div>;

  return (
    <div className="space-y-4">
      <div className="bg-[var(--tg-theme-bg-color,#ffffff)] p-4 rounded-xl shadow-sm border border-[var(--tg-theme-hint-color,#e2e8f0)] opacity-90">
        <h2 className="text-sm text-[var(--tg-theme-hint-color,#64748b)]">BuildingOS</h2>
        <h1 className="text-2xl font-bold">Hello, {data.tenantName?.split(' ')[0]} 👋</h1>
      </div>

      <div className="bg-[var(--tg-theme-bg-color,#ffffff)] p-4 rounded-xl shadow-sm border border-[var(--tg-theme-hint-color,#e2e8f0)]">
        <h3 className="font-semibold mb-2">🏢 My Property</h3>
        <p className="text-[var(--tg-theme-hint-color,#64748b)] text-sm">{data.buildingName}</p>
        <p className="text-lg">Unit {data.unitNumber}</p>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 bg-[var(--tg-theme-bg-color,#ffffff)] p-4 rounded-xl shadow-sm border border-[var(--tg-theme-hint-color,#e2e8f0)]">
          <h3 className="text-sm text-[var(--tg-theme-hint-color,#64748b)] mb-1">💰 Balance</h3>
          <p className={`text-lg font-bold ${data.balance > 0 ? 'text-red-500' : 'text-green-600'}`}>
            {data.balance.toLocaleString()} ETB
          </p>
        </div>
        <div className="flex-1 bg-[var(--tg-theme-bg-color,#ffffff)] p-4 rounded-xl shadow-sm border border-[var(--tg-theme-hint-color,#e2e8f0)]">
          <h3 className="text-sm text-[var(--tg-theme-hint-color,#64748b)] mb-1">📅 Next Payment</h3>
          <p className="text-lg font-medium">{data.nextPaymentDate || 'No pending'}</p>
        </div>
      </div>
    </div>
  );
}

export function PropertyView({ initData }: { initData: string | null }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    tmaFetch('/api/v1/telegram/property', initData)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [initData]);

  if (error) return <div className="text-red-500 p-4">{error}</div>;
  if (!data) return <div className="p-4 opacity-70">Loading property...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold px-2">Property Details</h2>
      <div className="bg-[var(--tg-theme-bg-color,#ffffff)] p-4 rounded-xl shadow-sm border border-[var(--tg-theme-hint-color,#e2e8f0)] space-y-3">
        <div>
          <p className="text-xs text-[var(--tg-theme-hint-color,#64748b)] uppercase tracking-wider">Building</p>
          <p className="font-medium">{data.building.name}</p>
          <p className="text-sm text-[var(--tg-theme-hint-color,#64748b)]">{data.building.address}, {data.building.city}</p>
        </div>
        <div className="pt-3 border-t border-[var(--tg-theme-hint-color,#e2e8f0)] opacity-50"></div>
        <div>
          <p className="text-xs text-[var(--tg-theme-hint-color,#64748b)] uppercase tracking-wider">Unit Number</p>
          <p className="font-medium">{data.unit.unitNumber}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--tg-theme-hint-color,#64748b)] uppercase tracking-wider">Unit Type</p>
          <p className="font-medium">{data.unit.unitType}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--tg-theme-hint-color,#64748b)] uppercase tracking-wider">Area</p>
          <p className="font-medium">{data.unit.area} sq m</p>
        </div>
      </div>
    </div>
  );
}

export function LeaseView({ initData }: { initData: string | null }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    tmaFetch('/api/v1/telegram/lease', initData)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [initData]);

  if (error) return <div className="text-red-500 p-4">{error}</div>;
  if (!data) return <div className="p-4 opacity-70">Loading lease...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold px-2">Current Lease</h2>
      <div className="bg-[var(--tg-theme-bg-color,#ffffff)] p-4 rounded-xl shadow-sm border border-[var(--tg-theme-hint-color,#e2e8f0)] space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[var(--tg-theme-hint-color,#64748b)]">Status</span>
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">{data.contractStatus}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[var(--tg-theme-hint-color,#64748b)]">Start Date</span>
          <span className="font-medium">{data.startDate}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[var(--tg-theme-hint-color,#64748b)]">End Date</span>
          <span className="font-medium">{data.endDate}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[var(--tg-theme-hint-color,#64748b)]">Monthly Rent</span>
          <span className="font-medium">{parseFloat(data.monthlyRent).toLocaleString()} ETB</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[var(--tg-theme-hint-color,#64748b)]">Deposit</span>
          <span className="font-medium">{parseFloat(data.deposit).toLocaleString()} ETB</span>
        </div>
      </div>
    </div>
  );
}

export function BillingView({ initData }: { initData: string | null }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    tmaFetch('/api/v1/telegram/billing', initData)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [initData]);

  if (error) return <div className="text-red-500 p-4">{error}</div>;
  if (!data) return <div className="p-4 opacity-70">Loading billing...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold px-2">Billing</h2>
      
      <div className="bg-[var(--tg-theme-button-color,#3b82f6)] text-[var(--tg-theme-button-text-color,#ffffff)] p-6 rounded-xl shadow-md text-center">
        <p className="text-sm opacity-80 mb-1">Current Balance</p>
        <h1 className="text-3xl font-bold">{data.balance.toLocaleString()} ETB</h1>
        <button disabled className="mt-4 w-full py-2 bg-white/20 rounded-lg text-sm font-medium">
          Pay Now (Coming Soon)
        </button>
      </div>

      <h3 className="font-semibold px-2 mt-6">Payment History</h3>
      <div className="space-y-2">
        {data.payments.length === 0 ? (
          <p className="px-2 text-sm text-[var(--tg-theme-hint-color,#64748b)]">No payment history found.</p>
        ) : (
          data.payments.map((p: any) => (
            <div key={p.id} className="bg-[var(--tg-theme-bg-color,#ffffff)] p-3 rounded-lg border border-[var(--tg-theme-hint-color,#e2e8f0)] flex justify-between items-center">
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
