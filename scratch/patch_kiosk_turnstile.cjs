const fs = require('fs');

let code = fs.readFileSync('src/components/views/SecurityKioskView.tsx', 'utf8');

// Add Settings icon import
if (!code.includes('Settings')) {
  code = code.replace(/import \{([^}]+)\} from 'lucide-react';/, "import { $1, Settings, Cpu } from 'lucide-react';");
}

// Add state for hardware
const stateTarget = `  const [shopperAction, setShopperAction] = useState<'ENTRY' | 'EXIT_ERASED' | null>(null);`;
const stateReplacement = `  const [shopperAction, setShopperAction] = useState<'ENTRY' | 'EXIT_ERASED' | null>(null);
  const [hardwareIp, setHardwareIp] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);`;
if (!code.includes('hardwareIp')) {
  code = code.replace(stateTarget, stateReplacement);
}

// Pass hardwareIp to api calls
const call1 = `res = await api.verifyDigitalId(scanResult, scanDirection);`;
const r1 = `res = await api.verifyDigitalId(scanResult, scanDirection, hardwareIp || undefined);`;
code = code.replace(call1, r1);

const call2 = `res = await api.verifyGatePass(scanResult);`;
const r2 = `res = await api.verifyGatePass(scanResult, hardwareIp || undefined);`;
code = code.replace(call2, r2);

const call3 = `res = await api.scanShopperId(scanResult, scanDirection);`;
const r3 = `res = await api.scanShopperId(scanResult, scanDirection, hardwareIp || undefined);`;
code = code.replace(call3, r3);

// Replace "SHOPPER GRANTED ENTRY" block to add physical gate signal UI
const uiTarget1 = `<p className="text-sm text-emerald-600 font-bold mb-4">Temporary entry logged for Mall Shopper.</p>`;
const uiReplacement1 = `<p className="text-sm text-emerald-600 font-bold mb-4">Temporary entry logged for Mall Shopper.</p>
              {hardwareIp && (
                <div className="flex items-center justify-center gap-2 mb-4 text-emerald-700 bg-emerald-200/50 p-2 rounded-lg animate-pulse">
                  <Cpu size={18} />
                  <span className="text-xs font-bold">PHYSICAL GATE OPENED ({hardwareIp})</span>
                </div>
              )}`;
code = code.replace(uiTarget1, uiReplacement1);

// Settings UI rendering
const renderHeader = `      <div className="text-center mb-6">`;
const renderHeaderReplace = `
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
        </button>`;
if (!code.includes('Physical Turnstile Config')) {
  code = code.replace(renderHeader, renderHeaderReplace);
}

fs.writeFileSync('src/components/views/SecurityKioskView.tsx', code);
console.log('SecurityKioskView patched with Turnstile settings UI.');

