const fs = require('fs');

let code = fs.readFileSync('src/components/three-d/ThreeDViewerView.tsx', 'utf8');

const targetHUD = `            {/* Phase 8+: BuildingOS Intelligent Threat Shield — Seismic + AI Camera */}
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
                      <Activity size={14} className="text-indigo-400" />
                      <span className="text-[10px] font-mono text-slate-400">AI THREAT SCORE:</span>
                      <span className={['text-[11px]', 'font-mono', 'font-bold', threatLevel === 'CRITICAL' ? 'text-red-400' : threatLevel === 'ELEVATED' ? 'text-amber-400' : 'text-emerald-400'].join(' ')}>
                        {threatLevel === 'CRITICAL' ? '91/100' : threatLevel === 'HIGH' ? '73/100' : threatLevel === 'ELEVATED' ? '42/100' : '08/100'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}`;

const advancedHUD = `            {/* Phase 8+: Advanced Holographic HUD */}
            {viewMode === 'SECURITY' && (
              <div className="absolute inset-0 z-10 pointer-events-none p-4 flex flex-col justify-between overflow-hidden">
                {/* Advanced VFX overlays */}
                <div className="hud-crt-overlay"></div>
                <div className="hud-vignette"></div>
                <div className="hud-scanline"></div>

                {/* Top Glowing Border Frame */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
                
                {/* HUD Grid Overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

                {/* TOP BAR: Threat Level + Time */}
                <div className="flex justify-between items-start gap-4 relative z-50">

                  {/* LEFT: Security Command + Seismic Sensor */}
                  <div className="w-80 space-y-3 pointer-events-auto">
                    
                    {/* Header Panel */}
                    <div className={\`hud-glass-panel rounded-2xl p-4 transition-all duration-500 \${
                      threatLevel === 'CRITICAL' ? 'border-red-500/80 shadow-[0_0_40px_rgba(220,38,38,0.3)] animate-pulse' : 
                      threatLevel === 'HIGH' ? 'border-orange-500/60 shadow-[0_0_30px_rgba(249,115,22,0.2)]' : 
                      'border-indigo-500/50 shadow-[0_0_20px_rgba(79,70,229,0.15)]'
                    }\`}>
                      <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2 font-mono font-bold text-sm tracking-wider">
                          <ShieldCheck size={18} className={\`\${threatLevel === 'CRITICAL' ? 'text-red-400' : 'text-indigo-400'}\`} />
                          <span className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                            {isAmharic ? 'የ BuildingOS ጥበቃ ማዕከል' : 'BuildingOS COMMAND'}
                          </span>
                        </div>
                        <div className={\`px-2.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-widest \${
                          threatLevel === 'CRITICAL' ? 'bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.8)]' :
                          threatLevel === 'HIGH' ? 'bg-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.5)]' :
                          threatLevel === 'ELEVATED' ? 'bg-amber-500 text-black' :
                          'bg-emerald-600/80 text-emerald-100'
                        }\`}>{threatLevel}</div>
                      </div>
                      
                      {/* SEISMIC SENSOR PANEL */}
                      <div className="bg-black/40 rounded-xl p-3 border border-slate-700/50 relative overflow-hidden">
                        {/* Radar Sweep Background */}
                        <div className="absolute top-1/2 right-4 w-16 h-16 -translate-y-1/2 opacity-20 pointer-events-none">
                          <div className="w-full h-full border-2 border-emerald-500/30 rounded-full"></div>
                          <div className="w-full h-full border-2 border-emerald-500/20 rounded-full absolute inset-0 scale-50"></div>
                          <div className="hud-radar-sweep"></div>
                        </div>

                        <div className="flex items-center gap-2 mb-3 relative z-10">
                          <Waves size={14} className={\`\${seismicAlert === 'CRITICAL' ? 'text-red-500' : seismicAlert === 'WARNING' ? 'text-amber-400' : 'text-emerald-400'}\`} />
                          <span className="text-[11px] font-mono font-bold text-slate-300 tracking-wider">
                            {isAmharic ? 'የመሬት መንቀጥቀጥ ዳሳሽ' : 'SEISMIC SENSOR'}
                          </span>
                          <span className={\`ml-auto text-[11px] font-bold font-mono tracking-widest \${seismicAlert === 'CRITICAL' ? 'text-red-400 animate-pulse drop-shadow-[0_0_5px_rgba(248,113,113,0.8)]' : seismicAlert === 'WARNING' ? 'text-amber-400' : 'text-emerald-400'}\`}>
                            {seismicAlert}
                          </span>
                        </div>
                        {/* Advanced Richter Bar */}
                        <div className="flex items-center gap-3 relative z-10">
                          <span className="text-[10px] font-mono text-slate-500">0.0</span>
                          <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden relative shadow-inner">
                            <div 
                              className={\`h-full rounded-full transition-all duration-[800ms] ease-out \${seismicLevel >= 2.5 ? 'bg-gradient-to-r from-red-600 to-red-400 animate-pulse' : seismicLevel >= 1.2 ? 'bg-gradient-to-r from-amber-500 to-amber-300' : 'bg-gradient-to-r from-emerald-600 to-emerald-400'}\`}
                              style={{ width: \`\${Math.min((seismicLevel / 4) * 100, 100)}%\`, boxShadow: \`0 0 10px \${seismicLevel >= 2.5 ? 'rgba(239,68,68,0.8)' : 'rgba(16,185,129,0.5)'}\` }}
                            />
                          </div>
                          <span className={\`text-[11px] font-mono font-bold w-8 text-right \${seismicLevel >= 2.5 ? 'text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.8)]' : seismicLevel >= 1.2 ? 'text-amber-400' : 'text-emerald-400'}\`}>{seismicLevel.toFixed(2)} M</span>
                        </div>
                      </div>

                      {/* Micro Sensors Grid */}
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {[
                          { label: 'ROOF-CAM', color: 'emerald', icon: '📷', active: true },
                          { label: 'RADAR', color: 'indigo', icon: '📡', active: true },
                          { label: 'THERMAL', color: 'amber', icon: '🌡️', active: true },
                          { label: 'ACOUSTIC', color: 'purple', icon: '🎤', active: false },
                          { label: 'SEISMIC', color: seismicAlert === 'NORMAL' ? 'emerald' : seismicAlert === 'WARNING' ? 'amber' : 'red', icon: '📳', active: true },
                          { label: 'AI-SCAN', color: 'blue', icon: '🤖', active: true },
                        ].map((s, i) => (
                          <div key={i} className={\`hud-glitch-hover bg-gradient-to-br from-\${s.color}-500/10 to-transparent border border-\${s.color}-500/20 rounded-lg p-2 text-center transition-all duration-300 hover:border-\${s.color}-500/50 hover:bg-\${s.color}-500/20 cursor-pointer\`}>
                            <div className={\`text-lg mb-1 \${s.active ? 'opacity-100' : 'opacity-40 grayscale'}\`}>{s.icon}</div>
                            <div className={\`text-[9px] font-mono text-\${s.color}-400 font-bold tracking-wider leading-none\`}>{s.label}</div>
                            <div className={\`w-1 h-1 rounded-full mx-auto mt-1.5 \${s.active ? \`bg-\${s.color}-400 animate-ping\` : 'bg-slate-700'}\`}></div>
                          </div>
                        ))}
                      </div>

                      {/* Emergency Controls */}
                      <div className="mt-3 flex gap-2">
                        <button 
                          onClick={() => setIsEmergencyEvacuation(!isEmergencyEvacuation)}
                          className={\`flex-1 py-2.5 rounded-xl font-mono text-[11px] font-bold tracking-widest transition-all border \${isEmergencyEvacuation ? 'bg-red-600 border-red-400 text-white shadow-[0_0_20px_rgba(220,38,38,0.8)] animate-pulse' : 'bg-red-950/40 border-red-500/30 text-red-400 hover:bg-red-900/50 hover:border-red-500/70 hover:shadow-[0_0_15px_rgba(220,38,38,0.4)]'}\`}
                        >
                          {isEmergencyEvacuation ? (isAmharic ? '🔴 ማዕቀብ ሰርዝ' : '🔴 CANCEL') : (isAmharic ? '🚨 ቁልፍ ዝጋ' : '🚨 LOCKDOWN')}
                        </button>
                        <button className="flex-1 py-2.5 rounded-xl font-mono text-[11px] font-bold tracking-widest bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/60 hover:border-indigo-500/60 hover:text-indigo-100 hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all">
                          {isAmharic ? '📢 ፖሊስ' : '📢 POLICE'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* CENTER: Cyber Log Viewer */}
                  <div className="flex-1 mx-4 pointer-events-auto h-64">
                    <div className="hud-glass-panel rounded-2xl p-4 h-full flex flex-col">
                      <div className="flex items-center gap-2 mb-3 border-b border-indigo-500/30 pb-2">
                        <Cpu size={14} className="text-indigo-400 animate-pulse" />
                        <span className="text-[11px] font-mono font-bold text-indigo-300 tracking-widest drop-shadow-[0_0_5px_rgba(165,180,252,0.5)]">
                          {isAmharic ? 'AI ትንተና ሎግ (LIVE)' : 'NEURAL THREAT ANALYSIS LOG'}
                        </span>
                        <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 bg-indigo-900/50 rounded-full border border-indigo-500/30">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></div>
                          <span className="text-[9px] text-indigo-200 font-mono tracking-wider">SYNCING</span>
                        </div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto scrollbar-none space-y-2 relative">
                        {/* Scanline over logs */}
                        <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-transparent to-indigo-500/10 pointer-events-none animate-[hud-scan_3s_linear_infinite]"></div>
                        
                        {aiThreatLog.map((entry, i) => (
                          <div key={i} className={\`flex gap-3 items-start text-[10px] font-mono p-1.5 rounded hover:bg-white/5 transition-colors \${entry.level === 'CRITICAL' ? 'text-red-400 font-bold' : entry.level === 'WARNING' ? 'text-amber-300' : 'text-emerald-300'}\`}>
                            <span className="text-slate-500 shrink-0 w-16 opacity-70">[{entry.time}]</span>
                            <span className={\`leading-relaxed \${entry.level === 'CRITICAL' ? 'drop-shadow-[0_0_5px_rgba(248,113,113,0.8)]' : ''}\`}>
                              <span className="opacity-50 mr-1">{'>'}</span> {entry.msg}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: Advanced Holographic Camera Feeds */}
                  <div className="w-72 space-y-3 pointer-events-auto">
                    {[
                      { id: 1, name: 'ROOF-CAM-N', label: isAmharic ? 'አናት ሰሜን' : 'North Sector', img: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=400&q=80', status: 'OK' },
                      { id: 2, name: 'ROOF-CAM-S', label: isAmharic ? 'አናት ደቡብ' : 'South Sector', img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80', status: threatLevel === 'ELEVATED' || threatLevel === 'HIGH' || threatLevel === 'CRITICAL' ? 'ALERT' : 'OK' },
                      { id: 3, name: 'PERIMETER', label: isAmharic ? 'ዳር ካሜራ' : 'Perimeter', img: 'https://images.unsplash.com/photo-1573322131924-f7b2820ec57b?auto=format&fit=crop&w=400&q=80', status: 'OK' },
                    ].map(cam => (
                      <div key={cam.id} className={\`hud-glitch-hover relative aspect-video bg-black rounded-xl overflow-hidden group cursor-pointer border-2 transition-all duration-300 \${cam.status === 'ALERT' ? 'border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'border-slate-700/60 hover:border-indigo-500/80 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]'}\`}>
                        {/* CRT pattern */}
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(transparent,transparent_2px,rgba(0,0,0,0.4)_2px,rgba(0,0,0,0.4)_4px)] z-20 pointer-events-none"></div>
                        
                        <img src={cam.img} className="w-full h-full object-cover opacity-60 grayscale sepia-[0.3] mix-blend-luminosity group-hover:opacity-90 group-hover:grayscale-0 group-hover:sepia-0 transition-all duration-700 scale-105 group-hover:scale-100" alt="cam"/>
                        
                        {/* Record Badge */}
                        <div className={\`absolute top-2 left-2 z-30 px-2 py-0.5 rounded text-[9px] font-bold font-mono tracking-widest flex items-center gap-1.5 \${cam.status === 'ALERT' ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.8)]' : 'bg-red-600/90 text-white backdrop-blur-sm'}\`}>
                          <div className={\`w-1.5 h-1.5 rounded-full \${cam.status === 'ALERT' ? 'bg-black' : 'bg-white'} animate-pulse\`}></div>
                          {cam.status === 'ALERT' ? (isAmharic ? 'ጥርጣሬ' : 'ALERT') : 'REC'}
                        </div>
                        
                        {/* Labels */}
                        <div className="absolute bottom-2 left-2 z-30 font-mono drop-shadow-[0_2px_4px_rgba(0,0,0,1)] bg-black/60 px-2 py-1 rounded backdrop-blur-md border border-white/10">
                          <div className="font-bold text-white text-[10px] tracking-wider">{cam.name}</div>
                          <div className="text-slate-300 text-[8px] uppercase tracking-widest">{cam.label}</div>
                        </div>
                        
                        {/* Timestamp */}
                        <div className="absolute top-2 right-2 z-30 font-mono text-[9px] text-white/80 bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-sm border border-white/10 tracking-wider">
                          {new Date().toLocaleTimeString()}
                        </div>
                        
                        {/* Facial/Object Recognition Box (CSS only) */}
                        {cam.status === 'ALERT' && (
                          <div className="absolute top-1/4 left-1/3 w-1/4 h-1/3 border border-amber-400 z-20 shadow-[0_0_10px_rgba(245,158,11,0.5)_inset] animate-pulse">
                            <div className="absolute -top-3 left-0 bg-amber-400 text-black text-[7px] font-bold px-1 font-mono">TARGET</div>
                          </div>
                        )}
                        
                        {/* AI scan line effect */}
                        <div className="absolute inset-0 z-20 overflow-hidden pointer-events-none">
                          <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent animate-[hud-scan_2s_linear_infinite]" style={{animationDuration: \`\${2 + cam.id * 0.5}s\`}}></div>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

                {/* BOTTOM: Seismic Waveform Visualizer */}
                <div className="pointer-events-auto relative z-50">
                  <div className="hud-glass-panel rounded-2xl px-5 py-3 flex items-center gap-6">
                    <div className="flex flex-col items-center shrink-0">
                      <Activity size={18} className="text-emerald-400 animate-pulse mb-1" />
                      <span className="text-[10px] font-mono text-emerald-300/70 tracking-widest">{isAmharic ? 'ሴስሚክ' : 'SEISMIC'}</span>
                    </div>
                    
                    {/* Advanced Waveform */}
                    <div className="flex-1 h-12 flex items-end gap-[3px] px-2 bg-black/20 rounded-xl inner-shadow py-1">
                      {Array.from({length: 60}).map((_, i) => {
                        const h = Math.random() * 30 + (i > 50 ? seismicLevel * 10 : 2);
                        const capped = Math.min(h, 40);
                        const color = capped > 25 ? '#ef4444' : capped > 15 ? '#f59e0b' : '#10b981';
                        return <div key={i} style={{height: \`\${capped}px\`, backgroundColor: color, width: '100%', opacity: 0.8 + (i/60)*0.2}} className="rounded-sm transition-all duration-[400ms] hover:h-10 hover:bg-indigo-400 cursor-crosshair"></div>;
                      })}
                    </div>
                    
                    <div className={\`shrink-0 text-center w-20 \${seismicAlert === 'CRITICAL' ? 'text-red-400 animate-pulse drop-shadow-[0_0_10px_rgba(248,113,113,0.8)]' : seismicAlert === 'WARNING' ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]'}\`}>
                      <div className="font-mono text-2xl font-black">{seismicLevel.toFixed(2)}</div>
                      <div className="text-[9px] font-bold tracking-widest opacity-80">MAGNITUDE</div>
                    </div>
                    
                    <div className="h-10 w-px bg-white/10 mx-2"></div>
                    
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-[10px] font-mono text-slate-400 tracking-widest mb-1">THREAT INDEX</span>
                      <div className={\`flex items-center gap-2 px-3 py-1 rounded-lg border \${threatLevel === 'CRITICAL' ? 'bg-red-900/30 border-red-500/50 text-red-400' : threatLevel === 'ELEVATED' ? 'bg-amber-900/30 border-amber-500/50 text-amber-400' : 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400'}\`}>
                        <span className="font-mono font-black text-lg tracking-wider">
                          {threatLevel === 'CRITICAL' ? '91' : threatLevel === 'HIGH' ? '73' : threatLevel === 'ELEVATED' ? '42' : '08'}
                        </span>
                        <span className="text-[10px] opacity-60 font-bold">/100</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}`;

code = code.replace(targetHUD, advancedHUD);

fs.writeFileSync('src/components/three-d/ThreeDViewerView.tsx', code);
console.log('Patched ThreeDViewerView.tsx with Advanced HUD');

