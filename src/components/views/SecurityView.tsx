import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, Clock, Box } from 'lucide-react';
// @ts-ignore
import { Scanner } from '@yudiel/react-qr-scanner';
import { api } from '../../api/client.ts';

export const SecurityView = () => {
  const [activeTab, setActiveTab] = useState<'passes' | 'scanner'>('passes');
  const [gatePasses, setGatePasses] = useState<any[]>([]);
  const [scanResult, setScanResult] = useState<any>(null);

  useEffect(() => {
    // In a real implementation this would fetch from /api/v1/security/gate-passes
    // Mocking for now since API might not be fully complete yet
    setGatePasses([
      { id: '1', itemDescription: 'Office Chair', direction: 'OUT', status: 'APPROVED', tenant: { fullName: 'Wengel Aylew' }, unit: { unitNumber: '101' } },
      { id: '2', itemDescription: '2 Monitors', direction: 'IN', status: 'PENDING', tenant: { fullName: 'Abebe Kebede' }, unit: { unitNumber: '105' } }
    ]);
  }, []);

  const handleScan = (text: string) => {
    if (text) {
      setScanResult({
        status: 'SUCCESS',
        message: 'Gate Pass verified: ' + text,
      });
      // Here we would call api.post('/api/v1/security/logs', { gatePassId: text })
    }
  };

  const handleApprove = (id: string) => {
    setGatePasses(prev => prev.map(p => p.id === id ? { ...p, status: 'APPROVED' } : p));
    // api.put('/api/v1/security/gate-passes/' + id + '/approve')
  };

  const [aiInsights, setAiInsights] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const fetchAiInsights = async () => {
    setLoadingAi(true);
    try {
      const insights = await api.getAISecurityInsights();
      setAiInsights(insights);
    } catch (err) {
      console.error('Failed to get AI insights', err);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Security & Gates</h1>
          <p className="text-slate-400 text-sm mt-1">Manage entry/exit logs and verify gate passes.</p>
        </div>
      </div>

      {/* AI Security Advisor Panel */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-start">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-900/50">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <h3 className="font-bold text-white flex items-center gap-2">
                Security AI Monitor <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[9px] font-bold uppercase rounded">Beta</span>
              </h3>
              {aiInsights ? (
                <div className="mt-2 space-y-3">
                  <p className="text-sm text-slate-300 leading-relaxed font-medium">{aiInsights.summary}</p>
                  <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-700">
                    <h4 className="text-xs font-bold text-slate-200 mb-1">Detected Anomalies:</h4>
                    <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                      {aiInsights.anomalies?.length > 0 ? (
                        aiInsights.anomalies.map((item: string, i: number) => <li key={i}>{item}</li>)
                      ) : (
                        <li>No anomalies detected in recent logs.</li>
                      )}
                    </ul>
                  </div>
                  <div className="text-[10px] font-bold flex items-center gap-1 text-slate-400">
                    Threat Level: <span className={`px-2 py-0.5 rounded ${aiInsights.threatLevel === 'High' ? 'bg-rose-500/20 text-rose-400' : aiInsights.threatLevel === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{aiInsights.threatLevel}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-1">Run an AI analysis on recent audit logs and gate passes to detect suspicious patterns.</p>
              )}
            </div>
          </div>
          {!aiInsights && (
            <button 
              onClick={fetchAiInsights}
              disabled={loadingAi}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 border border-blue-500"
            >
              {loadingAi ? 'Analyzing...' : 'Run Analysis'}
            </button>
          )}
        </div>
      </div>

      <div className="flex space-x-1 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('passes')}
          className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'passes' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          Gate Pass Queue
        </button>
        <button
          onClick={() => setActiveTab('scanner')}
          className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'scanner' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <Search className="w-4 h-4 inline-block mr-2" />
          Live Scanner
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === 'passes' ? (
          <div className="space-y-4">
            {gatePasses.map((pass) => (
              <div key={pass.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full ${pass.direction === 'OUT' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    <Box className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-slate-200 font-medium">{pass.itemDescription}</h3>
                    <p className="text-slate-400 text-xs mt-1">
                      {pass.tenant.fullName} &bull; Unit {pass.unit.unitNumber} &bull; Direction: {pass.direction}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    pass.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                    pass.status === 'PENDING' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-500/10 text-slate-400'
                  }`}>
                    {pass.status}
                  </span>
                  {pass.status === 'PENDING' && (
                    <button onClick={() => handleApprove(pass.id)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-xs font-medium">
                      Approve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
              <h3 className="text-center font-semibold text-slate-200 mb-4">Scan QR Code or ID Barcode</h3>
              <div className="aspect-square bg-slate-950 rounded-lg overflow-hidden relative">
                <Scanner onScan={(result) => handleScan(result[0].rawValue)} />
              </div>
              {scanResult && (
                <div className={`mt-4 p-3 rounded text-sm text-center ${scanResult.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {scanResult.message}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
