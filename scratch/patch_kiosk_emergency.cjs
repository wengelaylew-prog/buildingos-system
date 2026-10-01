const fs = require('fs');
let code = fs.readFileSync('src/components/views/SecurityKioskView.tsx', 'utf8');

// 1. Add Flame and BellRing to icons
code = code.replace(
  "import { Settings, Shield, RefreshCw, CheckCircle, XCircle, UserX, AlertTriangle, Fingerprint, Lock, Cpu } from 'lucide-react';",
  "import { Settings, Shield, RefreshCw, CheckCircle, XCircle, UserX, AlertTriangle, Fingerprint, Lock, Cpu, Flame, BellRing } from 'lucide-react';"
);

// 2. Add polling hook and state
const hookCode = `
  const [hardwareIp, setHardwareIp] = useState(getSavedIp());
  const [scanDirection, setScanDirection] = useState<'IN'|'OUT'>('IN');

  // Emergency Polling
  const { data: activeEmergencies, refetch: refetchEmergencies } = useQuery({
    queryKey: ['active-emergencies'],
    queryFn: async () => {
      const res = await api.get('/security/emergency/active');
      return res.data.data;
    },
    refetchInterval: 2000 // Poll every 2 seconds for emergencies
  });

  const activeEmergency = activeEmergencies?.[0]; // Get most recent if multiple

  const resolveEmergency = async (id) => {
    try {
      await api.post(\`/security/emergency/\${id}/resolve\`);
      refetchEmergencies();
    } catch(e) {}
  };
`;

code = code.replace(
  "const [hardwareIp, setHardwareIp] = useState(getSavedIp());\n  const [scanDirection, setScanDirection] = useState<'IN'|'OUT'>('IN');",
  hookCode
);

// 3. Add emergency UI overlay right at the top of the container
const uiOverlay = `
    <div className="max-w-4xl mx-auto">
      
      {activeEmergency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-900/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-red-600 rounded-3xl max-w-2xl w-full p-10 text-center shadow-2xl border-4 border-red-400 relative overflow-hidden">
            <div className="absolute inset-0 bg-red-500/20 animate-pulse pointer-events-none"></div>
            
            <Flame className="w-32 h-32 text-white mx-auto mb-6 animate-bounce" />
            <h1 className="text-6xl font-black text-white mb-4 tracking-tighter">FIRE ALARM</h1>
            <h2 className="text-3xl font-bold text-red-100 mb-8 uppercase tracking-widest animate-pulse">Evacuate Immediately</h2>
            
            <div className="bg-red-950/50 rounded-2xl p-6 mb-8 text-left border border-red-500/50">
              <div className="flex items-center gap-4 text-red-200 mb-2">
                <AlertTriangle size={24} />
                <span className="text-xl font-bold">Location Details:</span>
              </div>
              <p className="text-2xl text-white font-mono break-words">
                {activeEmergency.locationDetails || 'UNSPECIFIED LOCATION'}
              </p>
              <div className="mt-4 pt-4 border-t border-red-500/30 text-red-200 font-bold text-sm">
                <p>-" MASSED NOTIFICATIONS SENT TO ALL TENANTS</p>
                <p>-" TURNSTILES AUTO-UNLOCKED FOR EVACUATION</p>
              </div>
            </div>

            <button 
              onClick={() => resolveEmergency(activeEmergency.id)}
              className="bg-red-950 hover:bg-red-900 text-white font-bold py-4 px-8 rounded-xl border-2 border-red-500 hover:border-red-400 transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-3 mx-auto w-full max-w-sm"
            >
              <Lock size={18} />
              Resolve Emergency (Admin Only)
            </button>
          </div>
        </div>
      )}
`;

code = code.replace(
  '<div className="max-w-4xl mx-auto">',
  uiOverlay
);

fs.writeFileSync('src/components/views/SecurityKioskView.tsx', code);
console.log("Patched SecurityKioskView.tsx successfully");

