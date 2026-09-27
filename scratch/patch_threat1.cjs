const fs = require('fs');
let code = fs.readFileSync('src/components/three-d/ThreeDViewerView.tsx', 'utf8');

// 1. Add Zap icon import
code = code.replace(
  `  ShieldCheck,\n  AlertCircle,\n  RefreshCw,\n} from 'lucide-react';`,
  `  ShieldCheck,\n  AlertCircle,\n  RefreshCw,\n  Zap,\n  Radio,\n  Cpu,\n  Waves,\n} from 'lucide-react';`
);

// 2. Add seismic + threat state after existing viewMode states
const stateTarget = `  const [showAiBuilder, setShowAiBuilder] = useState<boolean>(false);`;
const stateReplace = `  const [showAiBuilder, setShowAiBuilder] = useState<boolean>(false);

  // === Phase 8+: Intelligent Threat Shield ===
  const [seismicLevel, setSeismicLevel] = useState(0.0);
  const [seismicAlert, setSeismicAlert] = useState<'NORMAL' | 'WARNING' | 'CRITICAL'>('NORMAL');
  const [threatLevel, setThreatLevel] = useState<'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL'>('LOW');
  const [aiThreatLog, setAiThreatLog] = useState<{time: string, msg: string, level: string}[]>([
    { time: new Date().toLocaleTimeString(), msg: 'System online. All perimeter sensors nominal.', level: 'OK' },
    { time: new Date(Date.now()-60000).toLocaleTimeString(), msg: 'Rooftop CAM-4 motion sweep: No threat detected.', level: 'OK' },
  ]);
  const [showThreatShield, setShowThreatShield] = useState(false);

  // Seismic Simulator (real systems use accelerometer APIs; we simulate wave patterns)
  React.useEffect(() => {
    if (viewMode !== 'SECURITY') return;
    const interval = setInterval(() => {
      const baseNoise = (Math.random() * 0.4);
      const spike = Math.random() < 0.03 ? (Math.random() * 3.5 + 0.8) : 0; // rare spikes
      const current = parseFloat((baseNoise + spike).toFixed(2));
      setSeismicLevel(current);

      if (current >= 2.5) {
        setSeismicAlert('CRITICAL');
        setThreatLevel('CRITICAL');
        setAiThreatLog(prev => [{
          time: new Date().toLocaleTimeString(),
          msg: \`⚠️ SEISMIC ALERT! Magnitude \${current} detected — Initiating evacuation protocols!\`,
          level: 'CRITICAL'
        }, ...prev.slice(0, 9)]);
        if ((global || window) && (window as any).io) {
          // In browser context, socket would fire
        }
      } else if (current >= 1.2) {
        setSeismicAlert('WARNING');
        setAiThreatLog(prev => [{
          time: new Date().toLocaleTimeString(),
          msg: \`Seismic tremor detected: \${current} — Monitoring...\`,
          level: 'WARNING'
        }, ...prev.slice(0, 9)]);
      } else {
        setSeismicAlert('NORMAL');
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [viewMode]);

  // AI Threat Scanner (Rooftop Camera AI — simulates Gemini anomaly detection cycle)
  React.useEffect(() => {
    if (viewMode !== 'SECURITY') return;
    const threatMessages = [
      { msg: 'CAM-ROOF-1: AI perimeter scan complete — No threat detected.', level: 'OK' },
      { msg: 'CAM-ROOF-2: Motion analysis — pedestrian crowd normal pattern.', level: 'OK' },
      { msg: 'CAM-ROOF-3: Thermal scan — No elevated heat signatures.', level: 'OK' },
      { msg: 'CAM-ROOF-1: Suspicious vehicle detected near Gate-B. Flagging for review.', level: 'WARNING' },
      { msg: 'AI Vision: Unusual crowd formation near entrance. Assigning threat score: 42/100.', level: 'WARNING' },
      { msg: 'RADAR-SENSOR: Drone signature detected in 150m radius. Tracking...', level: 'WARNING' },
    ];
    const interval = setInterval(() => {
      const pick = threatMessages[Math.floor(Math.random() * threatMessages.length)];
      setAiThreatLog(prev => [{
        time: new Date().toLocaleTimeString(),
        msg: pick.msg,
        level: pick.level
      }, ...prev.slice(0, 9)]);
      if (pick.level === 'WARNING') setThreatLevel(t => t === 'CRITICAL' ? t : 'ELEVATED');
      else setThreatLevel(t => t === 'CRITICAL' ? t : 'LOW');
    }, 8000);
    return () => clearInterval(interval);
  }, [viewMode]);`;

code = code.replace(stateTarget, stateReplace);

fs.writeFileSync('src/components/three-d/ThreeDViewerView.tsx', code);
console.log('Patched state and sensors');

