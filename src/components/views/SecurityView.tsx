import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, ShieldCheck, Activity, AlertTriangle, CheckCircle, Search, User, Sparkles } from 'lucide-react';
// @ts-ignore
import { Scanner } from '@yudiel/react-qr-scanner';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { api } from '../../api/client.ts';

// Mock Access Logs
type AccessLog = {
  id: string;
  time: string;
  name: string;
  status: 'AUTHORIZED' | 'UNAUTHORIZED';
  gate: string;
  camera: string;
};

export const SecurityView = () => {
  const { isAmharic } = useLanguage();
  
  // State
  const [activeTab, setActiveTab] = useState<'soc' | 'scanner' | 'passes'>('soc');
  const [logs, setLogs] = useState<AccessLog[]>([
    { id: '1', time: new Date().toLocaleTimeString(), name: 'Abebe Kebede (Unit 105)', status: 'AUTHORIZED', gate: 'Main Entrance', camera: 'CAM-01' },
    { id: '2', time: new Date(Date.now() - 60000).toLocaleTimeString(), name: 'Wengel Aylew (Unit 101)', status: 'AUTHORIZED', gate: 'Basement Parking', camera: 'CAM-04' }
  ]);
  const [scanResult, setScanResult] = useState<any>(null);
  const [radarDots, setRadarDots] = useState<{ id: number; x: number; y: number; type: 'AUTHORIZED' | 'UNAUTHORIZED' }[]>([]);

  // Simulation of Live SOC Feed
  useEffect(() => {
    const interval = setInterval(() => {
      const isUnauthorized = Math.random() > 0.8; // 20% chance of unauthorized person
      
      const newLog: AccessLog = {
        id: Math.random().toString(),
        time: new Date().toLocaleTimeString(),
        name: isUnauthorized ? 'Unknown Individual (No ID)' : `Tenant #${Math.floor(Math.random() * 900) + 100}`,
        status: isUnauthorized ? 'UNAUTHORIZED' : 'AUTHORIZED',
        gate: ['Main Entrance', 'Back Door', 'Basement Parking', 'Lobby Elevators'][Math.floor(Math.random() * 4)],
        camera: `CAM-0${Math.floor(Math.random() * 4) + 1}`,
      };

      setLogs((prev) => [newLog, ...prev].slice(0, 50));

      // Add a dot to the radar
      const newDot = {
        id: Date.now(),
        x: Math.random() * 80 + 10, // 10% to 90%
        y: Math.random() * 80 + 10,
        type: newLog.status
      };
      setRadarDots(prev => [...prev.slice(-4), newDot]); // Keep last 5 dots

    }, 8000); // New event every 8 seconds

    return () => clearInterval(interval);
  }, []);

  const handleScan = (text: string) => {
    if (text) {
      setScanResult({
        status: 'SUCCESS',
        message: 'ID Verified: ' + text,
      });
      
      const newLog: AccessLog = {
        id: Math.random().toString(),
        time: new Date().toLocaleTimeString(),
        name: `Scanned ID: ${text.substring(0, 10)}...`,
        status: 'AUTHORIZED',
        gate: 'Scanner Station 1',
        camera: 'CAM-01',
      };
      setLogs((prev) => [newLog, ...prev]);
    }
  };

  const simulateUnauthorized = () => {
    const newLog: AccessLog = {
      id: Math.random().toString(),
      time: new Date().toLocaleTimeString(),
      name: 'Unknown Person Detected (No ID)',
      status: 'UNAUTHORIZED',
      gate: 'Side Entrance',
      camera: 'CAM-02',
    };
    setLogs((prev) => [newLog, ...prev]);
    setRadarDots(prev => [...prev.slice(-4), { id: Date.now(), x: 75, y: 25, type: 'UNAUTHORIZED' }]);
  };

  return (
    <div className="p-4 lg:p-6 h-full flex flex-col space-y-4 bg-slate-950 text-slate-300 font-mono overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="text-indigo-500 w-8 h-8" />
            {isAmharic ? 'የደህንነት መቆጣጠሪያ ማዕከል (SOC)' : 'Security Operations Center'}
          </h1>
          <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest">
            {isAmharic ? 'የቀጥታ ስርጭት እና የስካን መረጃዎች' : 'Live Monitoring & Access Logs'}
          </p>
        </div>

        <div className="flex space-x-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('soc')}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-colors ${
              activeTab === 'soc' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4 inline-block mr-2" />
            Live SOC
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-colors ${
              activeTab === 'scanner' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-4 h-4 inline-block mr-2" />
            ID Scanner
          </button>
        </div>
      </div>

      {activeTab === 'soc' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
          {/* Left: Camera Feeds (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-4 h-[50vh] min-h-[400px]">
              {/* Cam 1 */}
              <div className="bg-black rounded-xl border border-slate-800 relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40 mix-blend-luminosity"></div>
                {/* Scanline effect */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none"></div>
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                  <span className="text-white text-[10px] font-bold bg-black/50 px-2 py-1 rounded">CAM-01 MAIN LOBBY</span>
                </div>
                <div className="absolute bottom-3 right-3 text-[10px] text-white/50">{new Date().toLocaleTimeString()}</div>
              </div>
              
              {/* Cam 2 */}
              <div className="bg-black rounded-xl border border-slate-800 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541884487717-5735166f272a?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40 mix-blend-luminosity"></div>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none"></div>
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                  <span className="text-white text-[10px] font-bold bg-black/50 px-2 py-1 rounded">CAM-02 SIDE ENTRANCE</span>
                </div>
                
                {/* Unauthorized Overlay Simulation */}
                {logs[0]?.camera === 'CAM-02' && logs[0]?.status === 'UNAUTHORIZED' && (
                  <div className="absolute inset-0 border-2 border-red-500 bg-red-500/10 flex items-center justify-center">
                     <div className="border border-red-500 w-24 h-40 absolute top-1/4 left-1/3">
                        <div className="absolute -top-6 left-0 text-red-500 text-[10px] bg-black/80 px-1 font-bold">UNKNOWN TARGET</div>
                     </div>
                  </div>
                )}
              </div>

              {/* Cam 3 */}
              <div className="bg-black rounded-xl border border-slate-800 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522204523234-8729aa6e3d5f?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40 mix-blend-luminosity grayscale"></div>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none"></div>
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="text-white text-[10px] font-bold bg-black/50 px-2 py-1 rounded">CAM-03 PARKING (THERMAL)</span>
                </div>
              </div>

              {/* Radar view instead of Cam 4 */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 relative overflow-hidden flex items-center justify-center">
                <div className="absolute top-3 left-3 text-emerald-500 text-[10px] font-bold">RADAR TRACKING</div>
                <div className="relative w-48 h-48 rounded-full border border-emerald-900/50 bg-emerald-950/20 overflow-hidden flex items-center justify-center">
                   {/* Radar sweep */}
                   <div className="absolute inset-0 origin-center animate-[spin_4s_linear_infinite]" style={{ background: 'conic-gradient(from 0deg, transparent 70%, rgba(16, 185, 129, 0.4) 100%)' }}></div>
                   
                   {/* Grid rings */}
                   <div className="absolute w-32 h-32 rounded-full border border-emerald-900/40"></div>
                   <div className="absolute w-16 h-16 rounded-full border border-emerald-900/60"></div>
                   
                   {/* Dots */}
                   {radarDots.map(dot => (
                     <div 
                       key={dot.id}
                       className={`absolute w-2.5 h-2.5 rounded-full animate-ping ${dot.type === 'AUTHORIZED' ? 'bg-emerald-500' : 'bg-red-500'}`}
                       style={{ top: `${dot.y}%`, left: `${dot.x}%` }}
                     ></div>
                   ))}
                </div>
              </div>
            </div>
            
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
               <div className="flex justify-between items-center mb-3">
                 <h3 className="text-xs font-bold text-slate-400 uppercase">System Controls</h3>
                 <button onClick={simulateUnauthorized} className="text-[10px] bg-red-950 text-red-400 px-3 py-1.5 rounded hover:bg-red-900 transition border border-red-900 flex items-center gap-1">
                   <AlertTriangle className="w-3 h-3" /> Simulate Intruder
                 </button>
               </div>
               <div className="flex gap-4">
                 <div className="flex-1 bg-slate-950 p-3 rounded border border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Main Gate Lock</span>
                    <span className="text-xs text-emerald-500 font-bold">LOCKED</span>
                 </div>
                 <div className="flex-1 bg-slate-950 p-3 rounded border border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Alarm Status</span>
                    <span className="text-xs text-slate-600 font-bold">ARMED</span>
                 </div>
               </div>
            </div>
          </div>

          {/* Right: Live Access Logs (1/3 width) */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 flex flex-col overflow-hidden h-[calc(50vh+120px)] lg:h-auto">
            <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                {isAmharic ? 'የቀጥታ መግቢያ መዝገብ' : 'Live Access Logs'}
              </h3>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {logs.map((log) => (
                <div key={log.id} className={`p-3 rounded-lg border flex gap-3 ${log.status === 'AUTHORIZED' ? 'bg-emerald-950/20 border-emerald-900/30' : 'bg-red-950/30 border-red-900/50 animate-pulse'}`}>
                    <div className="shrink-0 mt-0.5">
                      {log.status === 'AUTHORIZED' ? (
                        <User className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <User className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-slate-200 font-bold text-xs">{log.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${log.status === 'AUTHORIZED' ? 'bg-emerald-900 text-emerald-400' : 'bg-red-900 text-red-400'}`}>
                        {log.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>{log.time}</span>
                      <span>&bull;</span>
                      <span>{log.gate}</span>
                      <span>&bull;</span>
                      <span className="text-slate-400">{log.camera}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'scanner' && (
        <div className="max-w-md mx-auto w-full mt-8">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden text-center">
            <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-white text-lg mb-2">
              {isAmharic ? 'መታወቂያ ስካን ያድርጉ' : 'Scan ID or QR Code'}
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              {isAmharic 
                ? 'የጎብኚዎችን ወይም የተከራዮችን መታወቂያ በማስገባት መረጃቸውን ይመዝግቡ (አክቲቭ ያድርጉ)።' 
                : 'Scan visitor or tenant ID to register and activate their entry.'}
            </p>
            
            <div className="aspect-square bg-slate-950 rounded-xl overflow-hidden relative border-2 border-dashed border-slate-700">
              <Scanner 
                onScan={(result: any) => handleScan(result[0].rawValue)} 
                formats={['qr_code', 'ean_13', 'code_128']}
              />
              <div className="absolute inset-0 pointer-events-none border-[3px] border-indigo-500/30 m-8 rounded-lg">
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-[3px] border-l-[3px] border-indigo-500 -ml-1 -mt-1"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-[3px] border-r-[3px] border-indigo-500 -mr-1 -mt-1"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-[3px] border-l-[3px] border-indigo-500 -ml-1 -mb-1"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-[3px] border-r-[3px] border-indigo-500 -mr-1 -mb-1"></div>
              </div>
            </div>
            
            {scanResult && (
              <div className={`mt-6 p-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${
                scanResult.status === 'SUCCESS' ? 'bg-emerald-950 border border-emerald-900 text-emerald-400' : 'bg-red-950 border border-red-900 text-red-400'
              }`}>
                {scanResult.status === 'SUCCESS' ? <CheckCircle className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                {scanResult.message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
