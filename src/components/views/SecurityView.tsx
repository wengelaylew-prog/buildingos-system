import React, { useState, useEffect } from 'react';
import { ShieldCheck, Eye as Camera,  Search as Scan, User, Search, AlertCircle, Clock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { api } from '../../api/client.ts';

export const SecurityView = () => {
  const { locale } = useLanguage();
  const am = locale === 'am';
  
  const [activeTab, setActiveTab] = useState<'soc' | 'verify' | 'visitor'>('soc');
  const [visitors, setVisitors] = useState<any[]>([]);
  const [gatePasses, setGatePasses] = useState<any[]>([]);
  
  const [verifyToken, setVerifyToken] = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);
  
  const [visitorForm, setVisitorForm] = useState({ name: '', phone: '', purpose: '', tenantId: '' });
  const [tenants, setTenants] = useState<any[]>([]);
  
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const vRes = await api.getVisitors();
      setVisitors(vRes || []);
      const pRes = await api.getGatePasses();
      setGatePasses(pRes || []);
      const tRes = await api.getTenants();
      setTenants(tRes || []);
    } catch(e) {}
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyResult(null);
    try {
      const res = await api.verifyGatePass(verifyToken);
      setVerifyResult({ type: 'success', pass: res });
      setVerifyToken('');
      loadData();
    } catch(err: any) {
      setVerifyResult({ type: 'error', message: err.message });
    }
  };

  const handleVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.logVisitor(visitorForm);
      setVisitorForm({ name: '', phone: '', purpose: '', tenantId: '' });
      loadData();
      alert(am ? 'እንግዳው ተመዝግቧል። ለተከራዩ በቴሌግራም መልእክት ተልኳል።' : 'Visitor logged. Telegram approval sent to tenant.');
      setActiveTab('soc');
    } catch(err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="h-full bg-slate-900 text-slate-200 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="text-emerald-500" />
            {am ? 'የጥበቃ ማዕከል (Security Operations)' : 'Security Command Center'}
          </h1>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('soc')} className={`px-4 py-2 rounded-lg font-medium \${activeTab === 'soc' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Dashboard</button>
            <button onClick={() => setActiveTab('verify')} className={`px-4 py-2 rounded-lg font-medium \${activeTab === 'verify' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Verify Pass</button>
            <button onClick={() => setActiveTab('visitor')} className={`px-4 py-2 rounded-lg font-medium \${activeTab === 'visitor' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Log Visitor</button>
          </div>
        </div>

        {activeTab === 'soc' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* CCTV Grid Placeholder */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Camera size={18} /> Live CCTV Feeds</h2>
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((cam) => (
                    <div key={cam} className="aspect-video bg-black rounded-lg border border-slate-700 flex flex-col items-center justify-center relative overflow-hidden group">
                       <Camera size={32} />
                       <span className="text-slate-500 text-sm font-mono">CAM-0{cam} (OFFLINE)</span>
                       <div className="absolute top-2 left-2 px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded font-mono border border-red-500/50">NO SIGNAL</div>
                       <div className="absolute top-2 right-2 text-slate-500 text-xs font-mono">{new Date().toLocaleTimeString()}</div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-4 text-center">To connect real RTSP/HLS IP Cameras, configure the stream URLs in Settings.</p>
              </div>

              {/* Logs */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Clock size={18} /> Recent Access Logs</h2>
                <div className="space-y-3">
                  {visitors.slice(0, 5).map((v: any) => (
                    <div key={v.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                      <div>
                        <div className="font-medium text-white">{v.name} <span className="text-slate-400 text-sm">({v.purpose})</span></div>
                        <div className="text-xs text-slate-500">Visiting: {v.tenant?.tenantName || 'Unknown'}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs px-2 py-1 rounded font-bold \${v.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : v.status === 'DENIED' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {v.status}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{new Date(v.arrivedAt).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Incident/Action Panel */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><AlertCircle size={18} className="text-red-400" /> Quick Actions</h2>
                <button className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg font-medium transition-colors mb-3">
                  Report Incident
                </button>
                <button className="w-full py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg font-medium transition-colors">
                  Contact Property Manager
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'verify' && (
          <div className="max-w-md mx-auto mt-10">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="text-center mb-6">
                <Scan className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white">Verify Gate Pass</h2>
                <p className="text-slate-400 text-sm mt-2">Enter the token generated by the tenant to authorize item removal.</p>
              </div>

              <form onSubmit={handleVerify}>
                <input
                  type="text"
                  placeholder="e.g. GP-W7XY"
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value.toUpperCase())}
                  className="w-full bg-slate-900 border border-slate-600 text-white text-center text-2xl tracking-widest font-mono rounded-lg px-4 py-4 mb-4 focus:outline-none focus:border-indigo-500"
                  required
                />
                <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors">
                  VERIFY TOKEN
                </button>
              </form>

              {verifyResult && (
                <div className={`mt-6 p-4 rounded-lg border \${verifyResult.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                  {verifyResult.type === 'success' ? (
                    <div className="text-center">
                      <ShieldCheck className="w-12 h-12 mx-auto mb-2" />
                      <div className="font-bold text-lg">ACCESS GRANTED</div>
                      <div className="text-sm mt-2">Token consumed successfully.</div>
                      <div className="mt-4 text-left bg-slate-900/50 p-3 rounded text-slate-300 text-sm">
                        <div><strong>Tenant:</strong> {verifyResult.pass?.tenant?.tenantName}</div>
                        <div><strong>Item:</strong> {verifyResult.pass?.itemDescription} (x{verifyResult.pass?.quantity})</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                      <div className="font-bold text-lg">ACCESS DENIED</div>
                      <div className="text-sm mt-1">{verifyResult.message}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'visitor' && (
          <div className="max-w-md mx-auto mt-10">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="text-center mb-6">
                <User className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white">Log Visitor</h2>
                <p className="text-slate-400 text-sm mt-2">Records visitor and sends a Telegram approval request to the tenant.</p>
              </div>

              <form onSubmit={handleVisitor} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Tenant to Visit</label>
                  <select 
                    value={visitorForm.tenantId} 
                    onChange={e => setVisitorForm({...visitorForm, tenantId: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                    required
                  >
                    <option value="">Select Tenant...</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.tenantName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Visitor Name</label>
                  <input type="text" value={visitorForm.name} onChange={e => setVisitorForm({...visitorForm, name: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Purpose</label>
                  <input type="text" value={visitorForm.purpose} onChange={e => setVisitorForm({...visitorForm, purpose: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white" />
                </div>
                <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold mt-6">
                  LOG & NOTIFY TENANT
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
