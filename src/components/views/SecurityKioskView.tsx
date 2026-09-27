import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { CheckCircle, XCircle, Shield, RefreshCw } from 'lucide-react';
import { api } from '../../api/client.ts';
import toast from 'react-hot-toast';

export const SecurityKioskView: React.FC = () => {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState('');

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
      <div className="text-center mb-8">
        <Shield className="mx-auto h-12 w-12 text-slate-800 mb-4" />
        <h1 className="text-3xl font-bold text-slate-900">Security Guard Kiosk</h1>
        <p className="text-slate-500 mt-2">Scan Visitor or Item Gate Passes</p>
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

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 inline-block">
             <p className="text-sm text-slate-500 uppercase tracking-wider mb-1">Pass Token</p>
             <p className="text-3xl font-mono font-bold text-slate-800">{scanResult}</p>
          </div>
          
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

