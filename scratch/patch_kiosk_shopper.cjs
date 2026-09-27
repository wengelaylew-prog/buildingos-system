const fs = require('fs');

const file = 'src/components/views/SecurityKioskView.tsx';
let code = fs.readFileSync(file, 'utf8');

const stateTarget = `  const [verifiedData, setVerifiedData] = useState<any>(null);`;
const stateReplacement = `  const [verifiedData, setVerifiedData] = useState<any>(null);
  const [scanDirection, setScanDirection] = useState<'IN' | 'OUT'>('IN');
  const [shopperAction, setShopperAction] = useState<'ENTRY' | 'EXIT_ERASED' | null>(null);`;

code = code.replace(stateTarget, stateReplacement);

const handleVerifyTarget = `      let res;
      let isDigitalId = scanResult.startsWith('DID-');
      
      if (isDigitalId) {
        res = await api.verifyDigitalId(scanResult, 'IN');
      } else {
        res = await api.verifyGatePass(scanResult);
      }

      if (res) {
        setVerifyStatus('success');
        setVerifiedData(res);
        toast.success(isDigitalId ? 'Digital ID Verified Successfully!' : 'Gate Pass Verified Successfully!');`;

const handleVerifyReplacement = `      let res;
      let isTenantId = scanResult.startsWith('DID-');
      let isGatePass = scanResult.startsWith('GP-');
      let isShopper = !isTenantId && !isGatePass;
      
      if (isTenantId) {
        res = await api.verifyDigitalId(scanResult, scanDirection);
      } else if (isGatePass) {
        res = await api.verifyGatePass(scanResult);
      } else {
        // Generic Mall Shopper Digital ID
        res = await api.scanShopperId(scanResult, scanDirection);
        setShopperAction(scanDirection === 'IN' ? 'ENTRY' : 'EXIT_ERASED');
      }

      if (res) {
        setVerifyStatus('success');
        setVerifiedData(res);
        
        if (isShopper) {
          toast.success(scanDirection === 'IN' ? 'Shopper Entry Granted!' : 'Shopper Exit - Data Erased Securely!');
        } else {
          toast.success(isTenantId ? 'Tenant Digital ID Verified!' : 'Gate Pass Verified!');
        }`;

code = code.replace(handleVerifyTarget, handleVerifyReplacement);

const timeoutTarget = `        setTimeout(() => {
          setScanResult(null);
          setVerifyStatus('pending');
          setVerifiedData(null);
          window.location.reload();
        }, 5000);`;
const timeoutReplacement = `        setTimeout(() => {
          setScanResult(null);
          setVerifyStatus('pending');
          setVerifiedData(null);
          setShopperAction(null);
          // Instead of full reload, just restart scanner if possible, but reload is ok for kiosk stability
          window.location.reload();
        }, 5000);`;
code = code.replace(timeoutTarget, timeoutReplacement);

const renderTarget1 = `      <div className="text-center mb-8">
        <Shield className="mx-auto h-12 w-12 text-slate-800 mb-4" />
        <h1 className="text-3xl font-bold text-slate-900">Security Guard Kiosk</h1>
        <p className="text-slate-500 mt-2">Scan Visitor or Item Gate Passes</p>
      </div>`;

const renderReplacement1 = `      <div className="text-center mb-6">
        <Shield className="mx-auto h-12 w-12 text-slate-800 mb-4" />
        <h1 className="text-3xl font-bold text-slate-900">Security Guard Kiosk</h1>
        <p className="text-slate-500 mt-2">Scan Tenant IDs, Gate Passes, and Mall Shopper Digital IDs</p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="bg-slate-200 p-1 rounded-xl flex gap-1">
          <button 
            onClick={() => setScanDirection('IN')}
            className={\`px-6 py-2 rounded-lg font-bold transition-all \${scanDirection === 'IN' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
          >
            ↓ ENTRY SCAN (IN)
          </button>
          <button 
            onClick={() => setScanDirection('OUT')}
            className={\`px-6 py-2 rounded-lg font-bold transition-all \${scanDirection === 'OUT' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
          >
            ↑ EXIT SCAN (OUT)
          </button>
        </div>
      </div>`;

code = code.replace(renderTarget1, renderReplacement1);

const renderTarget2 = `          {verifyStatus === 'success' && scanResult?.startsWith('DID-') && verifiedData?.tenant ? (`;
const renderReplacement2 = `          {verifyStatus === 'success' && shopperAction === 'ENTRY' ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-6 inline-block text-center w-full max-w-md">
              <CheckCircle className="mx-auto h-16 w-16 text-emerald-500 mb-4 animate-bounce" />
              <h3 className="text-2xl font-bold text-emerald-700 mb-2">SHOPPER GRANTED ENTRY</h3>
              <p className="text-sm text-emerald-600 font-bold mb-4">Temporary entry logged for Mall Shopper.</p>
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
          ) : verifyStatus === 'success' && scanResult?.startsWith('DID-') && verifiedData?.tenant ? (`;

code = code.replace(renderTarget2, renderReplacement2);

const scanResultLabelTarget = `               <p className="text-sm text-slate-500 uppercase tracking-wider mb-1">{scanResult?.startsWith('DID-') ? 'Digital ID' : 'Pass Token'}</p>`;
const scanResultLabelReplacement = `               <p className="text-sm text-slate-500 uppercase tracking-wider mb-1">{scanResult?.startsWith('DID-') ? 'Tenant Digital ID' : scanResult?.startsWith('GP-') ? 'Gate Pass' : 'Shopper ID'}</p>`;
code = code.replace(scanResultLabelTarget, scanResultLabelReplacement);

fs.writeFileSync(file, code);
console.log('SecurityKioskView patched for Generic Shopper Entry/Exit.');
