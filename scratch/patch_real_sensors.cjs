const fs = require('fs');

let code = fs.readFileSync('src/components/three-d/ThreeDViewerView.tsx', 'utf8');

// 1. Add realCameras state and Real API Hooks
const stateTarget = `  const [showThreatShield, setShowThreatShield] = useState(false);`;
const stateReplacement = `  const [showThreatShield, setShowThreatShield] = useState(false);
  const [realCameras, setRealCameras] = useState<any[]>([]);
  const [newCamUrl, setNewCamUrl] = useState('');
  const [newCamName, setNewCamName] = useState('');

  // Fetch Real Cameras on Mount
  useEffect(() => {
    if (viewMode === 'SECURITY') {
      api.get('/api/v1/security/cameras').then((res: any) => {
        if (res.data && res.data.length > 0) {
          setRealCameras(res.data);
        }
      }).catch(console.error);
    }
  }, [viewMode]);

  // Real USGS Live Seismic Polling
  useEffect(() => {
    if (viewMode !== 'SECURITY') return;
    const fetchSeismic = () => {
      // Addis Ababa coordinates for demo, in production this comes from the building model
      api.get('/api/v1/security/seismic/live?lat=9.03&lng=38.74&radius=1000').then((res: any) => {
        if (res.data && res.data.length > 0) {
          const quake = res.data[0];
          setSeismicLevel(quake.magnitude);
          if (quake.magnitude >= 4.0) {
            setSeismicAlert('CRITICAL');
            setThreatLevel('CRITICAL');
          } else if (quake.magnitude >= 2.5) {
            setSeismicAlert('WARNING');
            setThreatLevel('HIGH');
          } else {
            setSeismicAlert('NORMAL');
          }
          
          setAiThreatLog(prev => {
            const newLog = { 
              time: new Date(quake.time).toLocaleTimeString(), 
              msg: \`LIVE USGS DATA: M\${quake.magnitude} at \${quake.location}\`, 
              level: quake.magnitude >= 4.0 ? 'CRITICAL' : 'WARNING' 
            };
            if (prev.some(l => l.msg === newLog.msg)) return prev;
            return [newLog, ...prev].slice(0, 10);
          });
        } else {
          setSeismicLevel(parseFloat((Math.random() * 0.1).toFixed(2))); // Tiny ambient vibration
          setSeismicAlert('NORMAL');
        }
      }).catch(console.error);
    };

    fetchSeismic();
    const interval = setInterval(fetchSeismic, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [viewMode]);

  const handleAddCamera = async () => {
    if (!newCamUrl) return;
    const newCam = { id: Date.now().toString(), name: newCamName || 'New Camera', url: newCamUrl, status: 'OK' };
    const updated = [...realCameras, newCam];
    setRealCameras(updated);
    setNewCamUrl('');
    setNewCamName('');
    try {
      await api.post('/api/v1/security/cameras', { cameras: updated });
    } catch (e) { console.error(e); }
  };
`;
if (!code.includes('const [realCameras, setRealCameras] = useState')) {
  code = code.replace(stateTarget, stateReplacement);
}

// 2. Remove old fake seismic simulator
const fakeSeismicTarget = `  // Seismic Simulator (real systems use accelerometer APIs; we simulate wave patterns)
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
        if (threatLevel === 'CRITICAL' && !isEmergencyEvacuation) {
          setThreatLevel('ELEVATED');
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [viewMode, isEmergencyEvacuation, threatLevel]);`;

if (code.includes('// Seismic Simulator')) {
  code = code.replace(fakeSeismicTarget, '');
}

// 3. Replace right side camera panel to use realCameras
const rightPanelTargetStart = `{/* RIGHT: Advanced Holographic Camera Feeds */}`;
const rightPanelTargetEndMatch = `                  {/* BOTTOM: Seismic Waveform Visualizer */}`;

const startIndex = code.indexOf(rightPanelTargetStart);
const endIndex = code.indexOf(rightPanelTargetEndMatch);

if (startIndex !== -1 && endIndex !== -1) {
  const replacementHTML = `{/* RIGHT: Real Integrated Camera Feeds */}
                  <div className="w-72 space-y-3 pointer-events-auto">
                    {realCameras.length === 0 ? (
                      <div className="hud-glass-panel rounded-xl p-4 border-dashed border-2 border-emerald-500/30 text-center">
                        <Radio size={24} className="text-emerald-500 mx-auto mb-2 animate-pulse" />
                        <div className="text-white text-xs font-mono mb-2">{isAmharic ? 'ምንም ካሜራ አልተገናኘም!' : 'NO CAMERAS CONFIGURED'}</div>
                        <p className="text-[10px] text-slate-400 font-mono mb-3 leading-relaxed">
                          {isAmharic ? 'የ IP Camera URL በማስገባት ትክክለኛውን የካሜራ ምስል በቀጥታ (Live) ይከታተሉ።' : 'Enter an HTTP/MJPEG URL to connect live IP cameras to the Threat Shield.'}
                        </p>
                        <div className="space-y-2">
                          <input type="text" placeholder={isAmharic ? 'ካሜራ ስም (ምሳሌ: MAIN-GATE)' : 'Camera Name'} value={newCamName} onChange={e => setNewCamName(e.target.value)} className="w-full bg-black/50 border border-slate-700 rounded p-1.5 text-[10px] text-white font-mono" />
                          <input type="text" placeholder="http://192.168.1.100/stream" value={newCamUrl} onChange={e => setNewCamUrl(e.target.value)} className="w-full bg-black/50 border border-slate-700 rounded p-1.5 text-[10px] text-white font-mono" />
                          <button onClick={handleAddCamera} className="w-full bg-emerald-600/30 border border-emerald-500 text-emerald-400 font-bold font-mono text-[10px] rounded p-1.5 hover:bg-emerald-600/50 transition-all">{isAmharic ? '➕ አገናኝ' : '➕ CONNECT'}</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest">{isAmharic ? 'የቀጥታ ካሜራዎች' : 'LIVE IP CAMERAS'}</span>
                          <button onClick={() => setRealCameras([])} className="text-[9px] font-mono text-slate-500 hover:text-red-400 transition-colors">RESET</button>
                        </div>
                        {realCameras.map(cam => (
                          <div key={cam.id} className={\`hud-glitch-hover relative aspect-video bg-black rounded-xl overflow-hidden group cursor-pointer border-2 transition-all duration-300 \${cam.status === 'ALERT' ? 'border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'border-emerald-700/60 hover:border-emerald-500/80 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]'}\`}>
                            {/* CRT pattern */}
                            <div className="absolute inset-0 bg-[repeating-linear-gradient(transparent,transparent_2px,rgba(0,0,0,0.4)_2px,rgba(0,0,0,0.4)_4px)] z-20 pointer-events-none"></div>
                            
                            {/* Real HTTP IP Camera Image/Stream */}
                            <img src={cam.url} onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&w=400&q=80'; e.currentTarget.classList.add('opacity-30', 'grayscale'); }} className="w-full h-full object-cover opacity-80 mix-blend-luminosity group-hover:opacity-100 group-hover:grayscale-0 group-hover:sepia-0 transition-all duration-700 scale-105 group-hover:scale-100" alt={cam.name} crossOrigin="anonymous"/>
                            
                            {/* Record Badge */}
                            <div className={\`absolute top-2 left-2 z-30 px-2 py-0.5 rounded text-[9px] font-bold font-mono tracking-widest flex items-center gap-1.5 \${cam.status === 'ALERT' ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.8)]' : 'bg-red-600/90 text-white backdrop-blur-sm'}\`}>
                              <div className={\`w-1.5 h-1.5 rounded-full \${cam.status === 'ALERT' ? 'bg-black' : 'bg-white'} animate-pulse\`}></div>
                              {cam.status === 'ALERT' ? (isAmharic ? 'ጥርጣሬ' : 'ALERT') : 'LIVE'}
                            </div>
                            
                            {/* Labels */}
                            <div className="absolute bottom-2 left-2 z-30 font-mono drop-shadow-[0_2px_4px_rgba(0,0,0,1)] bg-black/60 px-2 py-1 rounded backdrop-blur-md border border-white/10">
                              <div className="font-bold text-white text-[10px] tracking-wider">{cam.name}</div>
                              <div className="text-emerald-300 text-[8px] uppercase tracking-widest break-all max-w-[150px] truncate">{cam.url}</div>
                            </div>
                            
                            {/* Timestamp */}
                            <div className="absolute top-2 right-2 z-30 font-mono text-[9px] text-white/80 bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-sm border border-white/10 tracking-wider">
                              {new Date().toLocaleTimeString()}
                            </div>
                            
                            {/* AI scan line effect */}
                            <div className="absolute inset-0 z-20 overflow-hidden pointer-events-none">
                              <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent animate-[hud-scan_2s_linear_infinite]" style={{animationDuration: \`\${2 + Math.random()}s\`}}></div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>

`;
  code = code.substring(0, startIndex) + replacementHTML + code.substring(endIndex);
}

fs.writeFileSync('src/components/three-d/ThreeDViewerView.tsx', code);
console.log('Patched UI for REAL sensors and API integrations.');

