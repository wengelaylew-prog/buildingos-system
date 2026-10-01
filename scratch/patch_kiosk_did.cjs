const fs = require('fs');
let code = fs.readFileSync('src/components/views/SecurityKioskView.tsx', 'utf8');

const stateTarget = `  const [verifyStatus, setVerifyStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState('');`;
const stateReplacement = `  const [verifyStatus, setVerifyStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState('');
  const [verifiedData, setVerifiedData] = useState<any>(null);`;

code = code.replace(stateTarget, stateReplacement);

const handleVerifyTarget = `  const handleVerify = async () => {
    if (!scanResult) return;
    setLoading(true);
    setVerifyStatus('pending');
    
    try {
      const res = await api.verifyGatePass(scanResult);
      if (res) {
        setVerifyStatus('success');
        toast.success('Gate Pass Verified Successfully! Visitor may enter.');
        
        // Auto reset after 3 seconds
        setTimeout(() => {
          setScanResult(null);
          setVerifyStatus('pending');
          window.location.reload();
        }, 3000);
      }
    } catch (err: any) {
      setVerifyStatus('error');
      setErrorMessage(err.message || 'Invalid or Expired Gate Pass');
      toast.error(err.message || 'Verification Failed');
    } finally {
      setLoading(false);
    }
  };`;

const handleVerifyReplacement = `  const handleVerify = async () => {
    if (!scanResult) return;
    setLoading(true);
    setVerifyStatus('pending');
    
    try {
      let res;
      let isDigitalId = scanResult.startsWith('DID-');
      
      if (isDigitalId) {
        res = await api.verifyDigitalId(scanResult, 'IN');
      } else {
        res = await api.verifyGatePass(scanResult);
      }

      if (res) {
        setVerifyStatus('success');
        setVerifiedData(res);
        toast.success(isDigitalId ? 'Digital ID Verified Successfully!' : 'Gate Pass Verified Successfully!');
        
        // Auto reset after 5 seconds
        setTimeout(() => {
          setScanResult(null);
          setVerifyStatus('pending');
          setVerifiedData(null);
          window.location.reload();
        }, 5000);
      }
    } catch (err: any) {
      setVerifyStatus('error');
      setErrorMessage(err.message || 'Verification Failed');
      toast.error(err.message || 'Verification Failed');
    } finally {
      setLoading(false);
    }
  };`;

code = code.replace(handleVerifyTarget, handleVerifyReplacement);

const renderTarget = `          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 inline-block">
             <p className="text-sm text-slate-500 uppercase tracking-wider mb-1">Pass Token</p>
             <p className="text-3xl font-mono font-bold text-slate-800">{scanResult}</p>
          </div>`;

const renderReplacement = `          {verifyStatus === 'success' && scanResult?.startsWith('DID-') && verifiedData?.tenant ? (
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
               <p className="text-sm text-slate-500 uppercase tracking-wider mb-1">{scanResult?.startsWith('DID-') ? 'Digital ID' : 'Pass Token'}</p>
               <p className="text-2xl font-mono font-bold text-slate-800 break-all">{scanResult}</p>
            </div>
          )}`;

code = code.replace(renderTarget, renderReplacement);

fs.writeFileSync('src/components/views/SecurityKioskView.tsx', code);
console.log('SecurityKioskView patched for Digital ID.');

