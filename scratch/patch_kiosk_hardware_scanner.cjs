const fs = require('fs');

const file = 'src/components/views/SecurityKioskView.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add Barcode Scanner icon 
const importTarget = `import { CheckCircle, XCircle, Shield, RefreshCw, Settings, Cpu } from 'lucide-react';`;
const importReplacement = `import { CheckCircle, XCircle, Shield, RefreshCw, Settings, Cpu, Scan } from 'lucide-react';`;
if (!code.includes('Scan }')) {
  code = code.replace(/import \{([^}]+)\} from 'lucide-react';/, "import { $1, Scan } from 'lucide-react';");
}

// 2. Insert Hardware Scanner Hook and Auto-Verify Hook right before handleVerify
const autoVerifyHooks = `
  // Hardware USB/Bluetooth Barcode Scanner Listener
  useEffect(() => {
    let buffer = '';
    let timeout: ReturnType<typeof setTimeout>;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in the settings input manually
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      if (e.key === 'Enter') {
        if (buffer.length > 3) {
          setScanResult(buffer);
        }
        buffer = '';
      } else if (e.key.length === 1) { // Normal printable character
        buffer += e.key;
        
        // Scanners type fast. If delay > 100ms, it's a human typing, reset buffer.
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          buffer = '';
        }, 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-verify when scanResult is detected (from Camera OR Hardware Scanner)
  useEffect(() => {
    if (scanResult && verifyStatus === 'pending' && !loading) {
      handleVerify();
    }
  }, [scanResult]);
`;

const handleVerifyTarget = `  const handleVerify = async () => {`;

if (!code.includes('Hardware USB/Bluetooth')) {
  code = code.replace(handleVerifyTarget, autoVerifyHooks + '\\n' + handleVerifyTarget);
}

// 3. Update the instructions UI to mention Hardware Scanners
const subtitleTarget = `<p className="text-slate-500 mt-2">Scan Tenant IDs, Gate Passes, and Mall Shopper Digital IDs</p>`;
const subtitleReplacement = `<p className="text-slate-500 mt-2 flex items-center justify-center gap-2">
          <span>Scan Tenant IDs, Gate Passes, and Mall Shopper Digital IDs</span>
        </p>
        <div className="mt-4 flex items-center justify-center gap-2 text-indigo-600 bg-indigo-50 py-2 px-4 rounded-full text-sm font-bold w-max mx-auto">
          <Scan size={16} className="animate-pulse" />
          Ready for Hardware Scanner (USB/Bluetooth)
        </div>`;

if (!code.includes('Ready for Hardware Scanner')) {
  code = code.replace(subtitleTarget, subtitleReplacement);
}

// 4. Remove the "Verify & Approve" button since it auto-verifies, or keep it just in case auto-verify misses (fallback).
// We'll keep it as a fallback but auto-verify will usually hide it because verifyStatus will change to 'success' or 'error'.

fs.writeFileSync(file, code);
console.log('SecurityKioskView patched for Hardware Scanner support and Auto-Verification.');

