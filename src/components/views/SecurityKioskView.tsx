import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { CheckCircle, XCircle, Shield } from 'lucide-react';

export const SecurityKioskView: React.FC = () => {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-emerald-200 text-center animate-in zoom-in-95 duration-300">
          <CheckCircle className="mx-auto h-16 w-16 text-emerald-500 mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">QR Code Scanned!</h2>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 inline-block">
             <p className="text-sm text-slate-500 uppercase tracking-wider mb-1">Pass Token</p>
             <p className="text-3xl font-mono font-bold text-slate-800">{scanResult}</p>
          </div>
          
          <div className="flex gap-4 justify-center">
             <button 
               onClick={() => window.location.reload()}
               className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
             >
               Cancel
             </button>
             <button 
               onClick={handleVerify}
               disabled={loading}
               className="px-8 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700"
             >
               {loading ? 'Verifying...' : 'Approve Entry'}
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

