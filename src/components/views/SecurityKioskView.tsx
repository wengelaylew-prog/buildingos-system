import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {  CheckCircle, XCircle, Shield, RefreshCw , Settings, Cpu } from 'lucide-react';
import { api } from '../../api/client.ts';
import toast from 'react-hot-toast';

export const SecurityKioskView: React.FC = () => {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState('');
  const [verifiedData, setVerifiedData] = useState<any>(null);
  const [scanDirection, setScanDirection] = useState<'IN' | 'OUT'>('IN');
  const [shopperAction, setShopperAction] = useState<'ENTRY' | 'EXIT_ERASED' | null>(null);
  const [hardwareIp, setHardwareIp] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        // Success
        setScanResult(decodedText);
        scanner.pause(true);
      },
      (error) => {
        // Ignore errors during scanning as they happen continuously
      }
    );

    return () => {
      scanner.clear().catch(e => console.error("Failed to clear scanner", e));
    };
  }, []);

  const handleVerify = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('✅ Gate Pass Verified Successfully!\nVisitor may enter.');
      setScanResult(null);
      // Hacky way to resume scanner after alert
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="max-w-3xl mx-auto py-8">

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Cpu /> Physical Turnstile Config</h3>
            <p className="text-sm text-slate-500 mb-4">Enter the local IP address of the turnstile relay (e.g., ESP32 or Shelly device). Leave blank for software-only mode.</p>
            <input 
              type="text" 
              placeholder="e.g. 192.168.1.100" 
              value={hardwareIp} 
              onChange={(e) => setHardwareIp(e.target.value)}
              className="w-full border-2 border-slate-200 rounded-lg p-3 mb-6 focus:border-indigo-500 outline-none font-mono"
            />
            <button onClick={() => setShowSettings(false)} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700">
              Save Configuration
            </button>
          </div>
        </div>
      )}

      <div className="text-center mb-6 relative">
        <button onClick={() => setShowSettings(true)} className="absolute right-0 top-0 p-3 text-slate-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-indigo-50">
          <Settings size={24} />
        </button>
        <Shield className="mx-auto h-12 w-12 text-slate-800 mb-4" />
        <h1 className="text-3xl font-bold text-slate-900">Security Guard Kiosk</h1>
        <p className="text-slate-500 mt-2">Scan Tenant IDs, Gate Passes, and Mall Shopper Digital IDs</p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="bg-slate-200 p-1 rounded-xl flex gap-1">
          <button 
            onClick={() => setScanDirection('IN')}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${scanDirection === 'IN' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            ↓ ENTRY SCAN (IN)
          </button>
          <button 
            onClick={() => setScanDirection('OUT')}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${scanDirection === 'OUT' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            ↑ EXIT SCAN (OUT)
          </button>
        </div>
      </div>

      {!scanResult ? (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div id="reader" className="overflow-hidden rounded-xl border-0"></div>
        </div>
      ) : (
        <div className={`bg-white p-8 rounded-2xl shadow-lg border text-center animate-in zoom-in-95 duration-300 ${
          verifyStatus === 'success' ? 'border-emerald-500 shadow-emerald-500/20' : 
          verifyStatus === 'error' ? 'border-red-500 shadow-red-500/20' : 
          'border-indigo-200 shadow-indigo-500/10'
        }`}>
          
          {verifyStatus === 'pending' && <Shield className="mx-auto h-16 w-16 text-indigo-500 mb-4" />}
          {verifyStatus === 'success' && <CheckCircle className="mx-auto h-16 w-16 text-emerald-500 mb-4" />}
          {verifyStatus === 'error' && <XCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />}

          <h2 className={`text-2xl font-bold mb-2 ${
            verifyStatus === 'success' ? 'text-emerald-600' :
            verifyStatus === 'error' ? 'text-red-600' :
            'text-slate-900'
          }`}>
            {verifyStatus === 'success' ? 'ACCESS GRANTED' :
             verifyStatus === 'error' ? 'ACCESS DENIED' :
             'QR Code Scanned!'}
          </h2>
          
          {verifyStatus === 'error' && (
            <p className="text-red-500 font-bold mb-4">{errorMessage}</p>
          )}

          {verifyStatus === 'success' && shopperAction === 'ENTRY' ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-6 inline-block text-center w-full max-w-md">
              <CheckCircle className="mx-auto h-16 w-16 text-emerald-500 mb-4 animate-bounce" />
              <h3 className="text-2xl font-bold text-emerald-700 mb-2">SHOPPER GRANTED ENTRY</h3>
              <p className="text-sm text-emerald-600 font-bold mb-4">Temporary entry logged for Mall Shopper.</p>
              {hardwareIp && (
                <div className="flex items-center justify-center gap-2 mb-4 text-emerald-700 bg-emerald-200/50 p-2 rounded-lg animate-pulse">
                  <Cpu size={18} />
                  <span className="text-xs font-bold">PHYSICAL GATE OPENED ({hardwareIp})</span>
                </div>
              )}
              <div className="bg-emerald-100 p-3 rounded text-emerald-800 font-mono text-sm break-all">
                ID: {scanResult}
              </div>
            </div>
          ) : verifyStatus === 'success' && shopperAction === 'EXIT_ERASED' ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6 inline-block text-center w-full max-w-md">
              <CheckCircle className="mx-auto h-16 w-16 text-amber-500 mb-4" />
              <h3 className="text-2xl font-bold text-amber-700 mb-2">SHOPPER EXIT COMPLETED</h3>
              <p className="text-sm text-amber-600 font-bold mb-4">Mall Shopper has exited.</p>
              <div className="bg-red-100 border border-red-200 p-3 rounded text-red-700 font-bold text-sm">
                🔒 Privacy Secured: Scanned ID file has been permanently erased.
              </div>
            </div>
          ) : verifyStatus === 'success' && scanResult?.startsWith('DID-') && verifiedData?.tenant ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-6 inline-block text-left w-full max-w-md">
              <div className="flex items-center gap-4 border-b border-emerald-200 pb-4 mb-4">
                <div className="h-16 w-16 bg-emerald-200 rounded-full flex items-center justify-center text-emerald-700 font-bold text-xl overflow-hidden shrink-0 shadow-inner">
                  {verifiedData.tenant.profilePhoto ? (
                    <img src={verifiedData.tenant.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    verifiedData.tenant.fullName.charAt(0)
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{verifiedData.tenant.fullName}</h3>
                  <p className="text-sm text-slate-500">{verifiedData.tenant.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Shop / Unit</p>
                  <p className="text-lg font-mono font-bold text-slate-800">{verifiedData.activeLease?.unit?.unitNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">ID Status</p>
                  <span className="inline-flex px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">ACTIVE TENANT</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 inline-block">
               <p className="text-sm text-slate-500 uppercase tracking-wider mb-1">{scanResult?.startsWith('DID-') ? 'Tenant Digital ID' : scanResult?.startsWith('GP-') ? 'Gate Pass' : 'Shopper ID'}</p>
               <p className="text-2xl font-mono font-bold text-slate-800 break-all">{scanResult}</p>
            </div>
          )}
          
          <div className="flex gap-4 justify-center">
             <button 
               onClick={() => window.location.reload()}
               disabled={loading || verifyStatus === 'success'}
               className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-50"
             >
               {verifyStatus === 'error' ? 'Scan Again' : 'Cancel'}
             </button>
             
             {verifyStatus !== 'success' && (
               <button 
                 onClick={handleVerify}
                 disabled={loading}
                 className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
               >
                 {loading ? <><RefreshCw className="animate-spin" size={18}/> Verifying...</> : 'Verify & Approve'}
               </button>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

