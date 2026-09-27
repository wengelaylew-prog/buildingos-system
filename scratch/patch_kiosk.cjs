const fs = require('fs');

const file = 'src/components/views/SecurityKioskView.tsx';
let code = fs.readFileSync(file, 'utf8');

const importsTarget = `import { CheckCircle, XCircle, Shield } from 'lucide-react';`;
const importsReplacement = `import { CheckCircle, XCircle, Shield, Loader2 } from 'lucide-react';
import { api } from '../../api/client.ts';
import toast from 'react-hot-toast';`;

if (!code.includes('import { api }')) {
  code = code.replace(importsTarget, importsReplacement);
}

const stateTarget = `  const [scanResult, setScanResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);`;
const stateReplacement = `  const [scanResult, setScanResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState('');`;

if (!code.includes('verifyStatus')) {
  code = code.replace(stateTarget, stateReplacement);
}

const handleVerifyTarget = `  const handleVerify = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('o. Gate Pass Verified Successfully!\\nVisitor may enter.');
      setScanResult(null);
      // Hacky way to resume scanner after alert
      window.location.reload();
    }, 1000);
  };`;
  
const handleVerifyReplacement = `  const handleVerify = async () => {
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

if (code.includes('setTimeout(() => {') && !code.includes('api.verifyGatePass')) {
  code = code.replace(handleVerifyTarget, handleVerifyReplacement);
}

const renderTarget = `      ) : (
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
      )}`;

const renderReplacement = `      ) : (
        <div className={\`bg-white p-8 rounded-2xl shadow-lg border text-center animate-in zoom-in-95 duration-300 \${
          verifyStatus === 'success' ? 'border-emerald-500 shadow-emerald-500/20' : 
          verifyStatus === 'error' ? 'border-red-500 shadow-red-500/20' : 
          'border-indigo-200 shadow-indigo-500/10'
        }\`}>
          
          {verifyStatus === 'pending' && <Shield className="mx-auto h-16 w-16 text-indigo-500 mb-4" />}
          {verifyStatus === 'success' && <CheckCircle className="mx-auto h-16 w-16 text-emerald-500 mb-4" />}
          {verifyStatus === 'error' && <XCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />}

          <h2 className={\`text-2xl font-bold mb-2 \${
            verifyStatus === 'success' ? 'text-emerald-600' :
            verifyStatus === 'error' ? 'text-red-600' :
            'text-slate-900'
          }\`}>
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
                 {loading ? <><Loader2 className="animate-spin" size={18}/> Verifying...</> : 'Verify & Approve'}
               </button>
             )}
          </div>
        </div>
      )}`;

if (code.includes('alert(')) {
  code = code.replace(renderTarget, renderReplacement);
}

fs.writeFileSync(file, code);
console.log('SecurityKioskView.tsx updated for REAL gate pass verification.');

