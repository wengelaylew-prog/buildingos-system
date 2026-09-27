const fs = require('fs');
let code = fs.readFileSync('src/components/three-d/ThreeDViewerView.tsx', 'utf8');

const targetHUD = `            {/* Phase 8: Advanced 3D Security Command Center HUD */}
            {viewMode === 'SECURITY' && (
              <div className="absolute inset-0 z-10 pointer-events-none p-4 flex flex-col justify-between overflow-hidden">
                <div className="flex justify-between items-start">
                  
                  {/* Left Panel: Alerts & Controls */}
                  <div className="w-72 bg-slate-900/85 backdrop-blur-md border border-red-500/40 rounded-xl p-4 pointer-events-auto shadow-[0_0_20px_rgba(220,38,38,0.2)] animate-in slide-in-from-left">
                    <div className="flex items-center justify-between mb-4 border-b border-red-500/30 pb-2">
                      <div className="flex items-center gap-2 text-red-500 font-mono font-bold">
                        <ShieldCheck size={18} /> 
                        {isAmharic ? 'የጥበቃ ማዕከል' : 'SECURITY COMMAND'}
                      </div>
                      <div className="h-2 w-2 rounded-full bg-red-500 animate-ping"></div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg text-xs font-mono text-red-300 flex items-center justify-between">
                        <span>SYSTEM STATUS</span>
                        <span className="text-red-500 font-bold animate-pulse">ARMED & ACTIVE</span>
                      </div>
                      
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg text-xs font-mono text-emerald-300 flex items-center justify-between">
                        <span>CCTV NETWORK</span>
                        <span className="text-emerald-400 font-bold">ALL ONLINE</span>
                      </div>

                      <div className="bg-indigo-500/10 border border-indigo-500/20 p-2.5 rounded-lg text-xs font-mono text-indigo-300 flex items-center justify-between">
                        <span>AI ANOMALY SCAN</span>
                        <span className="text-indigo-400 font-bold">SCANNING...</span>
                      </div>

                      <button 
                        onClick={() => setIsEmergencyEvacuation(!isEmergencyEvacuation)}
                        className={\`w-full mt-4 py-2.5 rounded-lg font-mono text-xs font-bold transition-colors \${isEmergencyEvacuation ? 'bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.6)]' : 'bg-red-600/20 hover:bg-red-600/40 border border-red-500 text-red-400'}\`}
                      >
                        {isEmergencyEvacuation ? 'CANCEL LOCKDOWN' : 'INITIATE LOCKDOWN'}
                      </button>
                    </div>
                  </div>

                  {/* Right Panel: Live Camera Feeds */}
                  <div className="w-64 space-y-3 pointer-events-auto animate-in slide-in-from-right">
                    {[
                      { id: 1, name: 'Lobby Main', img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80' },
                      { id: 2, name: 'Corridor A', img: 'https://images.unsplash.com/photo-1541888079549-05f3337a8588?auto=format&fit=crop&w=400&q=80' },
                      { id: 3, name: 'Parking B1', img: 'https://images.unsplash.com/photo-1573322131924-f7b2820ec57b?auto=format&fit=crop&w=400&q=80' }
                    ].map(cam => (
                      <div key={cam.id} className="relative aspect-video bg-slate-900 rounded-lg border border-slate-700/80 overflow-hidden group hover:border-indigo-500 transition-colors cursor-pointer shadow-lg">
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(transparent,transparent_2px,rgba(0,0,0,0.3)_2px,rgba(0,0,0,0.3)_4px)] z-10 pointer-events-none"></div>
                        <img src={cam.img} className="w-full h-full object-cover opacity-50 mix-blend-luminosity grayscale group-hover:grayscale-0 group-hover:opacity-80 transition-all duration-500" alt="cctv"/>
                        <div className="absolute top-2 left-2 z-20 bg-red-600 px-1.5 py-0.5 rounded text-[9px] font-bold text-white flex items-center gap-1 shadow-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div> REC
                        </div>
                        <div className="absolute top-2 right-2 z-20 bg-black/60 px-1.5 py-0.5 rounded text-[9px] font-mono text-white backdrop-blur-sm border border-white/10">
                          {new Date().toLocaleTimeString()}
                        </div>
                        <div className="absolute bottom-2 left-2 z-20 text-white font-mono text-[10px] drop-shadow-md bg-black/40 px-1.5 rounded backdrop-blur-sm">{cam.name} (CAM-0{cam.id})</div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            )}`;

const replaceHUD = `            {/* Phase 8+: BuildingOS Intelligent Threat Shield — Seismic + AI Camera */}
            {viewMode === 'SECURITY' && (
              <div className="absolute inset-0 z-10 pointer-events-none p-3 flex flex-col justify-between overflow-hidden">
                
                {/* TOP BAR: Threat Level + Time */}
                <div className="flex justify-between items-start gap-3">

                  {/* LEFT: Security Command + Seismic Sensor */}
                  <div className="w-72 space-y-2 pointer-events-auto">
                    
                    {/* Header */}
                    <div className={\`bg-slate-900/90 backdrop-blur-md border rounded-xl p-3 shadow-2xl \${
                      threatLevel === 'CRITICAL' ? 'border-red-500/80 shadow-red-900/40 animate-pulse' : 
                      threatLevel === 'HIGH' ? 'border-orange-500/60' : 
                      'border-indigo-500/40'
                    }\`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 font-mono font-bold text-xs">
                          <ShieldCheck size={14} className="text-indigo-400" />
                          <span className="text-white">{isAmharic ? 'የ BuildingOS ጥበቃ ስርዓት' : 'BuildingOS THREAT SHIELD'}</span>
                        </div>
                        <div className={\`px-2 py-0.5 rounded text-[9px] font-bold font-mono \${
                          threatLevel === 'CRITICAL' ? 'bg-red-600 text-white animate-pulse' :
                          threatLevel === 'HIGH' ? 'bg-orange-500 text-white' :
                          threatLevel === 'ELEVATED' ? 'bg-amber-500 text-black' :
                          'bg-emerald-600 text-white'
                        }\`}>{threatLevel}</div>
                      </div>
                      
                      {/* SEISMIC SENSOR PANEL */}
                      <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-700/60">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Waves size={12} className={\`\${seismicAlert === 'CRITICAL' ? 'text-red-500' : seismicAlert === 'WARNING' ? 'text-amber-400' : 'text-emerald-400'}\`} />
                          <span className="text-[10px] font-mono font-bold text-slate-300">{isAmharic ? 'የመሬት መንቀጥቀጥ ሴንሰር' : 'SEISMIC SENSOR'}</span>
                          <span className={\`ml-auto text-[10px] font-bold font-mono \${seismicAlert === 'CRITICAL' ? 'text-red-400 animate-pulse' : seismicAlert === 'WARNING' ? 'text-amber-400' : 'text-emerald-400'}\`}>
                            {seismicAlert}
                          </span>
                        </div>
                        {/* Richter scale bar */}
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-slate-500">0.0</span>
                          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden relative">
                            <div 
                              className={\`h-full rounded-full transition-all duration-700 \${seismicLevel >= 2.5 ? 'bg-red-500 animate-pulse' : seismicLevel >= 1.2 ? 'bg-amber-400' : 'bg-emerald-500'}\`}
                              style={{ width: \`\${Math.min((seismicLevel / 4) * 100, 100)}%\` }}
                            />
                          </div>
                          <span className={\`text-[10px] font-mono font-bold \${seismicLevel >= 2.5 ? 'text-red-400' : seismicLevel >= 1.2 ? 'text-amber-400' : 'text-emerald-400'}\`}>{seismicLevel.toFixed(2)} M</span>
                        </div>
                        <div className="mt-1.5 flex gap-1">
                          {[0,1,2,3,4,5,6,7].map(seg => (
                            <div key={seg} className={\`flex-1 h-1 rounded-sm \${seismicLevel > seg * 0.5 ? (seg > 4 ? 'bg-red-500' : seg > 2 ? 'bg-amber-400' : 'bg-emerald-500') : 'bg-slate-700'}\`}></div>
                          ))}
                        </div>
                      </div>

                      {/* Rooftop Sensor Status */}
                      <div className="mt-2 grid grid-cols-3 gap-1.5">
                        {[
                          { label: isAmharic ? 'ካሜራ-አናት' : 'ROOF-CAM', color: 'emerald', icon: '📷' },
                          { label: isAmharic ? 'ሬዳር' : 'RADAR', color: 'indigo', icon: '📡' },
                          { label: isAmharic ? 'ሙቀት-ሴንሰር' : 'THERMAL', color: 'amber', icon: '🌡️' },
                          { label: isAmharic ? 'ድምፅ-ሴንሰር' : 'ACOUSTIC', color: 'purple', icon: '🎤' },
                          { label: isAmharic ? 'ዳሳሽ' : 'SEISMIC', color: seismicAlert === 'NORMAL' ? 'emerald' : seismicAlert === 'WARNING' ? 'amber' : 'red', icon: '📳' },
                          { label: isAmharic ? 'AI-ቅ-ቅ' : 'AI-SCAN', color: 'blue', icon: '🤖' },
                        ].map((s, i) => (
                          <div key={i} className={\`bg-\${s.color}-500/10 border border-\${s.color}-500/30 rounded p-1.5 text-center\`}>
                            <div className="text-base">{s.icon}</div>
                            <div className={\`text-[8px] font-mono text-\${s.color}-400 font-bold leading-tight mt-0.5\`}>{s.label}</div>
                            <div className={\`w-1.5 h-1.5 rounded-full bg-\${s.color}-400 mx-auto mt-1 animate-pulse\`}></div>
                          </div>
                        ))}
                      </div>

                      {/* Emergency Controls */}
                      <div className="mt-2 flex gap-2">
                        <button 
                          onClick={() => setIsEmergencyEvacuation(!isEmergencyEvacuation)}
                          className={\`flex-1 py-2 rounded-lg font-mono text-[10px] font-bold transition-all border \${isEmergencyEvacuation ? 'bg-red-600 border-red-400 text-white shadow-[0_0_15px_rgba(220,38,38,0.7)] animate-pulse' : 'bg-red-600/10 border-red-500/50 text-red-400 hover:bg-red-600/30'}\`}
                        >
                          {isEmergencyEvacuation ? (isAmharic ? '🔴 ማዕቀብ ሰርዝ' : '🔴 CANCEL') : (isAmharic ? '🚨 ቁልፍ ዝጋ' : '🚨 LOCKDOWN')}
                        </button>
                        <button className="flex-1 py-2 rounded-lg font-mono text-[10px] font-bold bg-indigo-600/10 border border-indigo-500/40 text-indigo-400 hover:bg-indigo-600/30 transition-all">
                          {isAmharic ? '📢 ፖሊስ ጥራ' : '📢 ALERT POLICE'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* CENTER: AI Threat Log */}
                  <div className="flex-1 mx-2 pointer-events-auto">
                    <div className="bg-slate-950/85 backdrop-blur-md border border-slate-700/60 rounded-xl p-3 shadow-xl h-full">
                      <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-2">
                        <Cpu size={12} className="text-indigo-400" />
                        <span className="text-[10px] font-mono font-bold text-slate-300">{isAmharic ? 'AI ስጋት ትንተና ምዝገባ (Rooftop Cameras)' : 'AI THREAT ANALYSIS LOG — ROOFTOP SENSORS'}</span>
                        <div className="ml-auto flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                          <span className="text-[9px] text-indigo-400 font-mono">LIVE</span>
                        </div>
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto scrollbar-none">
                        {aiThreatLog.map((entry, i) => (
                          <div key={i} className={\`flex gap-2 items-start text-[9px] font-mono \${entry.level === 'CRITICAL' ? 'text-red-400' : entry.level === 'WARNING' ? 'text-amber-400' : 'text-emerald-400'}\`}>
                            <span className="text-slate-600 shrink-0">{entry.time}</span>
                            <span className="leading-relaxed">{entry.msg}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: Rooftop Live Camera Feeds */}
                  <div className="w-60 space-y-2 pointer-events-auto">
                    {[
                      { id: 1, name: 'ROOF-CAM-N', label: isAmharic ? 'አናት ሰሜን' : 'North Rooftop', img: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=400&q=80', status: 'OK' },
                      { id: 2, name: 'ROOF-CAM-S', label: isAmharic ? 'አናት ደቡብ' : 'South Rooftop', img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80', status: threatLevel === 'ELEVATED' ? 'ALERT' : 'OK' },
                      { id: 3, name: 'PERIMETER', label: isAmharic ? 'ዳር ካሜራ' : 'Perimeter Fence', img: 'https://images.unsplash.com/photo-1573322131924-f7b2820ec57b?auto=format&fit=crop&w=400&q=80', status: 'OK' },
                    ].map(cam => (
                      <div key={cam.id} className={\`relative aspect-video bg-slate-900 rounded-lg overflow-hidden group cursor-pointer shadow-lg border \${cam.status === 'ALERT' ? 'border-amber-500 shadow-amber-900/30' : 'border-slate-700/60 hover:border-indigo-500'} transition-all\`}>
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(transparent,transparent_2px,rgba(0,0,0,0.25)_2px,rgba(0,0,0,0.25)_4px)] z-10"></div>
                        <img src={cam.img} className="w-full h-full object-cover opacity-40 grayscale mix-blend-luminosity group-hover:opacity-70 group-hover:grayscale-0 transition-all duration-500" alt="cam"/>
                        <div className={\`absolute top-1.5 left-1.5 z-20 px-1.5 py-0.5 rounded text-[8px] font-bold text-white flex items-center gap-1 \${cam.status === 'ALERT' ? 'bg-amber-500' : 'bg-red-600'}\`}>
                          <div className="w-1 h-1 rounded-full bg-white animate-pulse"></div>
                          {cam.status === 'ALERT' ? (isAmharic ? 'ጥርጣሬ!' : 'ALERT') : 'REC'}
                        </div>
                        <div className="absolute bottom-1.5 left-1.5 z-20 text-white font-mono text-[9px] drop-shadow bg-black/50 px-1.5 rounded backdrop-blur-sm leading-tight">
                          <div className="font-bold">{cam.name}</div>
                          <div className="text-slate-300 text-[8px]">{cam.label}</div>
                        </div>
                        <div className="absolute top-1.5 right-1.5 z-20 font-mono text-[8px] text-white bg-black/50 px-1 py-0.5 rounded backdrop-blur-sm border border-white/10">
                          {new Date().toLocaleTimeString()}
                        </div>
                        {/* AI scan line effect */}
                        <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
                          <div className="w-full h-0.5 bg-emerald-400/30 animate-bounce" style={{animationDuration: \`\${2 + cam.id}s\`}}></div>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

                {/* BOTTOM: Seismic Waveform Visualizer */}
                <div className="pointer-events-auto mt-2">
                  <div className="bg-slate-950/85 backdrop-blur-md border border-slate-700/60 rounded-xl px-4 py-2.5 flex items-center gap-4 shadow-xl">
                    <div className="flex items-center gap-2 shrink-0">
                      <Radio size={14} className="text-emerald-400 animate-spin" style={{animationDuration: '3s'}} />
                      <span className="text-[10px] font-mono text-slate-400">{isAmharic ? 'የሴስሚክ ሞገድ' : 'SEISMIC WAVEFORM'}</span>
                    </div>
                    <div className="flex-1 h-8 flex items-end gap-0.5">
                      {Array.from({length: 40}).map((_, i) => {
                        const h = Math.random() * 24 + (i === 39 ? seismicLevel * 8 : 2);
                        const capped = Math.min(h, 30);
                        const color = capped > 20 ? '#ef4444' : capped > 12 ? '#f59e0b' : '#22c55e';
                        return <div key={i} style={{height: \`\${capped}px\`, backgroundColor: color, width: '100%', opacity: 0.7 + (i/40)*0.3}} className="rounded-full transition-all"></div>;
                      })}
                    </div>
                    <div className={seismicAlert === 'CRITICAL' ? 'text-red-400 font-mono text-[10px] font-bold animate-pulse' : seismicAlert === 'WARNING' ? 'text-amber-400 font-mono text-[10px] font-bold' : 'text-emerald-400 font-mono text-[10px] font-bold'}>
                      {seismicLevel.toFixed(2)} M
                    </div>
                    <div className="h-6 w-px bg-slate-700 mx-2"></div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Zap size={14} className="text-indigo-400" />
                      <span className="text-[10px] font-mono text-slate-400">AI THREAT SCORE:</span>
                      <span className={`text-[11px] font-mono font-bold ${threatLevel === 'CRITICAL' ? 'text-red-400' : threatLevel === 'ELEVATED' ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {threatLevel === 'CRITICAL' ? '91/100' : threatLevel === 'HIGH' ? '73/100' : threatLevel === 'ELEVATED' ? '42/100' : '08/100'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}`;

code = code.replace(targetHUD, replaceHUD);

if (!code.includes('replaceHUD replaced')) {
  // verify it changed
  const changed = !code.includes('CCTV NETWORK');
  console.log(changed ? 'HUD replaced successfully' : 'WARNING: old HUD still found');
} 

fs.writeFileSync('src/components/three-d/ThreeDViewerView.tsx', code);
console.log('Patched HUD with full Threat Shield');

