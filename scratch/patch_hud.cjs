const fs = require('fs');
let code = fs.readFileSync('src/components/three-d/ThreeDViewerView.tsx', 'utf8');

const target = `            />

            {/* In-Canvas Bottom Controls Overlay Tip */}`;

const replace = `            />

            {/* Phase 8: Advanced 3D Security Command Center HUD */}
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
            )}

            {/* In-Canvas Bottom Controls Overlay Tip */}`;

code = code.replace(target, replace);
fs.writeFileSync('src/components/three-d/ThreeDViewerView.tsx', code);
console.log('Patched ThreeDViewerView.tsx with Security HUD');

