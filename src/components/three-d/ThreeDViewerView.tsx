import { Box } from 'lucide-react';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Building2,
  Layers,
  Search,
  RotateCcw,
  Compass,
  Sliders,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Activity,
  Radio,
  Cpu,
  Waves,
} from 'lucide-react';
import { api } from '../../api/client.ts';
import {
  ThreeDSceneResponse,
  SceneUnitDTO,
} from '../../modules/three-d/three-d.types.ts';
import { BuildingCanvas } from './BuildingCanvas.tsx';
import { UnitDetailsDrawer } from './UnitDetailsDrawer.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

interface ThreeDViewerViewProps {
  initialBuildingId?: string;
  initialFloorId?: string;
  initialUnitId?: string;
  onNavigate?: (tab: string, buildingId?: string, floorId?: string, unitId?: string) => void;
}

export const ThreeDViewerView: React.FC<ThreeDViewerViewProps> = ({
  initialBuildingId,
  initialFloorId,
  initialUnitId,
  onNavigate,
}) => {
  const { user } = useAuth();
  const { locale, setLocale, t, isAmharic } = useLanguage();

  // Scene state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sceneData, setSceneData] = useState<ThreeDSceneResponse | null>(null);

  // Filter & Interaction states
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | undefined>(initialBuildingId);
  const [selectedFloorId, setSelectedFloorId] = useState<string>(initialFloorId || 'ALL');
  const [selectedUnit, setSelectedUnit] = useState<SceneUnitDTO | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // New features state
  const [viewMode, setViewMode] = useState<'MANAGEMENT' | 'SECURITY' | 'FINANCIAL' | 'MAINTENANCE' | 'ENERGY'>('MANAGEMENT');
  const [isEmergencyEvacuation, setIsEmergencyEvacuation] = useState<boolean>(false);
  const [showAiBuilder, setShowAiBuilder] = useState<boolean>(false);

  // === Phase 8+: Intelligent Threat Shield ===
  const [seismicLevel, setSeismicLevel] = useState(0.0);
  const [seismicAlert, setSeismicAlert] = useState<'NORMAL' | 'WARNING' | 'CRITICAL'>('NORMAL');
  const [threatLevel, setThreatLevel] = useState<'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL'>('LOW');
  const [aiThreatLog, setAiThreatLog] = useState<{time: string, msg: string, level: string}[]>([
    { time: new Date().toLocaleTimeString(), msg: 'System online. All perimeter sensors nominal.', level: 'OK' },
    { time: new Date(Date.now()-60000).toLocaleTimeString(), msg: 'Rooftop CAM-4 motion sweep: No threat detected.', level: 'OK' },
  ]);
  const [showThreatShield, setShowThreatShield] = useState(false);
  const [realCameras, setRealCameras] = useState<any[]>([]);
  const [newCamUrl, setNewCamUrl] = useState('');
  const [newCamName, setNewCamName] = useState('');

  // Fetch Real Cameras on Mount
  useEffect(() => {
    if (viewMode === 'SECURITY') {
      api.getSecurityCameras().then((res: any) => {
        if (res && res.length > 0) {
          setRealCameras(res);
        }
      }).catch(console.error);
    }
  }, [viewMode]);

  // Real USGS Live Seismic Polling
  useEffect(() => {
    if (viewMode !== 'SECURITY') return;
    const fetchSeismic = () => {
      // Get exact building coordinates dynamically
      let lat = 9.03; // Default Addis Ababa
      let lng = 38.74;
      if (sceneData?.allBuildings && selectedBuildingId) {
        const currentBuilding = sceneData.allBuildings.find(b => b.id === selectedBuildingId);
        if (currentBuilding && currentBuilding.latitude && currentBuilding.longitude) {
          lat = Number(currentBuilding.latitude);
          lng = Number(currentBuilding.longitude);
        }
      }
      
      // Radius reduced to 100km to only monitor earthquakes in the immediate vicinity of THIS building
      api.getLiveSeismic(lat, lng, 100).then((res: any) => {
        if (res && res.length > 0) {
          const quake = res[0];
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
              msg: `LIVE USGS DATA: M${quake.magnitude} at ${quake.location}`, 
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
      await api.saveSecurityCameras(updated);
    } catch (e) { console.error(e); }
  };


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
          msg: `⚠️ SEISMIC ALERT! Magnitude ${current} detected — Initiating evacuation protocols!`,
          level: 'CRITICAL'
        }, ...prev.slice(0, 9)]);
        if ((global || window) && (window as any).io) {
          // In browser context, socket would fire
        }
      } else if (current >= 1.2) {
        setSeismicAlert('WARNING');
        setAiThreatLog(prev => [{
          time: new Date().toLocaleTimeString(),
          msg: `Seismic tremor detected: ${current} — Monitoring...`,
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
  }, [viewMode]);
  const [aiStatus, setAiStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'generating' | 'success'>('idle');
  const [progress, setProgress] = useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAiUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAiStatus('uploading');
      setProgress(10);
      
      setTimeout(() => {
        setAiStatus('analyzing');
        setProgress(45);
        
        setTimeout(() => {
          setAiStatus('generating');
          setProgress(85);
          
          setTimeout(() => {
            setAiStatus('success');
            setProgress(100);
            
            setTimeout(() => {
              setShowAiBuilder(false);
              setAiStatus('idle');
              setProgress(0);
            }, 3000);
          }, 3500);
        }, 3000);
      }, 1500);
    }
  };
  const [isExploded, setIsExploded] = useState<boolean>(false);
  const [cameraPreset, setCameraPreset] = useState<'perspective' | 'top' | 'front'>('perspective');
  const [autoRotate, setAutoRotate] = useState<boolean>(false);

  // Fetch 3D Scene Data
  const fetchScene = useCallback(async (bldgId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get3DScene(bldgId);
      setSceneData(data);
      if (data?.building?.id) {
        setSelectedBuildingId(data.building.id);
      }
    } catch (err: any) {
      console.error('Failed to load 3D scene:', err);
      setError(err.message || 'Failed to retrieve 3D scene data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScene(selectedBuildingId);
  }, [fetchScene, selectedBuildingId]);

  // Initial unit auto-selection from props or tenant auto-focus
  useEffect(() => {
    if (!sceneData?.building) return;

    const allUnits = sceneData.building.floors.flatMap((f) => f.units);

    // If initialUnitId was passed
    if (initialUnitId) {
      const match = allUnits.find((u) => u.id === initialUnitId);
      if (match) {
        setSelectedUnit(match);
        setIsDrawerOpen(true);
        return;
      }
    }

    // If tenant user, automatically focus on their leased unit!
    if (sceneData.isTenantRestricted && sceneData.tenantUnitId) {
      const tenantUnit = allUnits.find((u) => u.id === sceneData.tenantUnitId);
      if (tenantUnit) {
        setSelectedUnit(tenantUnit);
        // Do not open drawer immediately on load to allow 3D overview, but keep highlighted
      }
    }
  }, [sceneData, initialUnitId]);

  // Available floors in current building
  const availableFloors = useMemo(() => {
    if (!sceneData?.building?.floors) return [];
    return [...sceneData.building.floors].sort((a, b) => a.floorNumber - b.floorNumber);
  }, [sceneData]);

  // Unit count stats
  const kpis = sceneData?.kpis || {
    totalUnits: 0,
    vacantUnits: 0,
    occupiedUnits: 0,
    reservedUnits: 0,
    maintenanceUnits: 0,
    occupancyRate: 0,
  };

  // Unit click handler
  const handleSelectUnit = (unit: SceneUnitDTO) => {
    setSelectedUnit(unit);
    setIsDrawerOpen(true);
  };

  // Reset Camera View
  const handleResetView = () => {
    setCameraPreset('perspective');
    setAutoRotate(false);
    setIsExploded(false);
    setSelectedFloorId('ALL');
    setStatusFilter('ALL');
    setSearchQuery('');
  };

  return (
    <div id="three-d-viewer-container" className="space-y-4">
      {/* 1. Header Toolbar & Controls Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 lg:p-5 flex flex-col gap-4">
        {/* Top Row: Title, Building Selector, Language Toggle, and Status Badges */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  {t('threeDViewer')}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                  Phase 4
                </span>
                {sceneData?.isTenantRestricted && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{t('tenantPortalBadge')}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {sceneData?.building
                  ? `${sceneData.building.name} (${sceneData.building.code}) • ${sceneData.building.address}`
                  : 'Interactive Three.js Digital Twin'}
              </p>
            </div>
          </div>

          {/* Building Selector & Localization Switcher */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            {/* Building Dropdown (if multiple buildings exist and user is not tenant restricted) */}
            {sceneData?.allBuildings && sceneData.allBuildings.length > 0 && !sceneData.isTenantRestricted && (
              <div className="relative">
                <select
                  value={selectedBuildingId}
                  onChange={(e) => setSelectedBuildingId(e.target.value)}
                  className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold py-2 pl-3 pr-8 rounded-xl shadow-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {sceneData.allBuildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
              </div>
            )}

            {/* Language Switcher (English / አማርኛ) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  locale === 'en'
                    ? 'bg-white text-indigo-600 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLocale('am')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  locale === 'am'
                    ? 'bg-white text-indigo-600 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                አማ
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Row Controls: Floor Selector, Search Bar, Camera Views, Explode Toggle, Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            {/* Floor Filter Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200 text-xs">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedFloorId}
                onChange={(e) => setSelectedFloorId(e.target.value)}
                className="bg-transparent text-slate-800 text-xs font-medium focus:outline-hidden pr-2 cursor-pointer"
              >
                <option value="ALL">{t('allFloors')}</option>
                {availableFloors.map((fl) => (
                  <option key={fl.id} value={fl.id}>
                    Floor {fl.floorNumber} - {fl.floorName} ({fl.units.length} units)
                  </option>
                ))}
              </select>
            </div>

            {/* Unit Search Bar */}
            <div className="relative min-w-[200px] sm:min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchUnitPlaceholder')}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* 3D Camera & Presentation Controls */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Camera Presets */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setCameraPreset('perspective')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  cameraPreset === 'perspective'
                    ? 'bg-white text-indigo-600 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Perspective Orbit"
              >
                {t('viewPerspective')}
              </button>
              <button
                type="button"
                onClick={() => setCameraPreset('top')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  cameraPreset === 'top'
                    ? 'bg-white text-indigo-600 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Architectural Floorplan Top View"
              >
                {t('viewTop')}
              </button>
              <button
                type="button"
                onClick={() => setCameraPreset('front')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  cameraPreset === 'front'
                    ? 'bg-white text-indigo-600 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Elevation Front View"
              >
                {t('viewFront')}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex bg-slate-100 rounded-xl p-1 mr-2 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode('MANAGEMENT')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'MANAGEMENT'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {isAmharic ? 'ማኔጅመንት' : 'Management'}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('FINANCIAL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'FINANCIAL'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {isAmharic ? 'ፋይናንስ' : 'Financial'}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('MAINTENANCE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'MAINTENANCE'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {isAmharic ? 'ጥገና' : 'Maintenance'}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('SECURITY')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    viewMode === 'SECURITY'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {isAmharic ? 'ሴኪዩሪቲ' : 'Security'}
                </button>
              </div>

              {/* Emergency Evacuation Toggle */}
              <button
                type="button"
                onClick={() => setIsEmergencyEvacuation(!isEmergencyEvacuation)}
                className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all mr-2 ${
                  isEmergencyEvacuation
                    ? 'bg-red-600 border-red-600 text-white shadow-xs animate-pulse'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-600'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                <span>{isAmharic ? 'አደጋ' : 'Emergency Evacuation'}</span>
              </button>

              {/* Explode View */}
              <button
                type="button"
                onClick={() => setIsExploded(!isExploded)}
                className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all ${
                  isExploded
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>{isExploded ? t('collapseFloors') : t('explodeFloors')}</span>
              </button>

              {/* Auto Rotate Turntable */}
              <button
                type="button"
                onClick={() => setAutoRotate(!autoRotate)}
                className={`p-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  autoRotate
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
                title="Auto-Rotate Turntable"
              >
                <Compass className="w-4 h-4" />
              </button>

              {/* AI 3D Generator */}
              <button
                type="button"
                onClick={() => setShowAiBuilder(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white border border-fuchsia-500 hover:opacity-90 text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                title="Generate 3D from Photo"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {isAmharic ? 'ከፎቶ 3D ስራ (AI)' : 'AI 3D Build'}
              </button>

              {/* Reset View */}
              <button
                type="button"
                onClick={handleResetView}
                className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-xs font-semibold transition-colors shadow-xs ml-1"
                title={t('resetView')}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Status Legend & KPI Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {t('filterByStatus')}:
          </span>

          {/* Status Pills with real counters & click-to-filter */}
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t('allStatuses')} ({kpis.totalUnits})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'VACANT' ? 'ALL' : 'VACANT')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'VACANT'
                ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-300'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>{t('statusVacant')} ({kpis.vacantUnits})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'OCCUPIED' ? 'ALL' : 'OCCUPIED')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'OCCUPIED'
                ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300'
                : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200/60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span>{t('statusOccupied')} ({kpis.occupiedUnits})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'RESERVED' ? 'ALL' : 'RESERVED')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'RESERVED'
                ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-300'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>{t('statusReserved')} ({kpis.reservedUnits})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'MAINTENANCE' ? 'ALL' : 'MAINTENANCE')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'MAINTENANCE'
                ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-300'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200/60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>{t('statusMaintenance')} ({kpis.maintenanceUnits})</span>
          </button>
        </div>

        {/* Occupancy summary */}
        <div className="text-[11px] font-semibold text-slate-500">
          Occupancy: <span className="text-indigo-600 font-bold">{kpis.occupancyRate}%</span>
        </div>
      </div>

      {/* 3. 3D WebGL Canvas Viewport */}
      <div className="relative w-full h-[620px] rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl bg-slate-950">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 space-y-3 z-10 bg-slate-950">
            <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium tracking-wide">{t('loadingScene')}</p>
          </div>
        ) : error ? (
          error.includes('No buildings registered') ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 space-y-4 z-10 bg-slate-950 p-6 text-center">
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-2">
                <Box className="w-8 h-8 text-indigo-500" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-2">3D Space Twin is Empty</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">
                  Add your first property from the dashboard to instantly generate and explore its 3D digital twin.
                </p>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 space-y-4 z-10 bg-slate-950 p-6 text-center">
              <AlertCircle className="w-10 h-10 text-rose-500" />
              <div>
                <h3 className="text-white font-bold text-sm mb-1">{t('loadingError')}</h3>
                <p className="text-xs text-slate-400 max-w-sm">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => fetchScene(selectedBuildingId)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )
        ) : sceneData?.building ? (
          <>
            <BuildingCanvas
              building={sceneData.building}
              selectedFloorId={selectedFloorId}
              selectedUnitId={selectedUnit?.id || null}
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              isExploded={isExploded}
              cameraPreset={cameraPreset}
              autoRotate={autoRotate}
              tenantUnitId={sceneData.tenantUnitId}
              viewMode={viewMode}
              isEmergencyEvacuation={isEmergencyEvacuation}
              onSelectUnit={handleSelectUnit}
            />

            {/* Phase 8+: Advanced Holographic HUD */}
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
                    <div className={`hud-glass-panel rounded-2xl p-4 transition-all duration-500 ${
                      threatLevel === 'CRITICAL' ? 'border-red-500/80 shadow-[0_0_40px_rgba(220,38,38,0.3)] animate-pulse' : 
                      threatLevel === 'HIGH' ? 'border-orange-500/60 shadow-[0_0_30px_rgba(249,115,22,0.2)]' : 
                      'border-indigo-500/50 shadow-[0_0_20px_rgba(79,70,229,0.15)]'
                    }`}>
                      <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2 font-mono font-bold text-sm tracking-wider">
                          <ShieldCheck size={18} className={`${threatLevel === 'CRITICAL' ? 'text-red-400' : 'text-indigo-400'}`} />
                          <span className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                            {isAmharic ? 'የ BuildingOS ጥበቃ ማዕከል' : 'BuildingOS COMMAND'}
                          </span>
                        </div>
                        <div className={`px-2.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-widest ${
                          threatLevel === 'CRITICAL' ? 'bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.8)]' :
                          threatLevel === 'HIGH' ? 'bg-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.5)]' :
                          threatLevel === 'ELEVATED' ? 'bg-amber-500 text-black' :
                          'bg-emerald-600/80 text-emerald-100'
                        }`}>{threatLevel}</div>
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
                          <Waves size={14} className={`${seismicAlert === 'CRITICAL' ? 'text-red-500' : seismicAlert === 'WARNING' ? 'text-amber-400' : 'text-emerald-400'}`} />
                          <span className="text-[11px] font-mono font-bold text-slate-300 tracking-wider">
                            {isAmharic ? 'የመሬት መንቀጥቀጥ ዳሳሽ' : 'SEISMIC SENSOR'}
                          </span>
                          <span className={`ml-auto text-[11px] font-bold font-mono tracking-widest ${seismicAlert === 'CRITICAL' ? 'text-red-400 animate-pulse drop-shadow-[0_0_5px_rgba(248,113,113,0.8)]' : seismicAlert === 'WARNING' ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {seismicAlert}
                          </span>
                        </div>
                        {/* Advanced Richter Bar */}
                        <div className="flex items-center gap-3 relative z-10">
                          <span className="text-[10px] font-mono text-slate-500">0.0</span>
                          <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden relative shadow-inner">
                            <div 
                              className={`h-full rounded-full transition-all duration-[800ms] ease-out ${seismicLevel >= 2.5 ? 'bg-gradient-to-r from-red-600 to-red-400 animate-pulse' : seismicLevel >= 1.2 ? 'bg-gradient-to-r from-amber-500 to-amber-300' : 'bg-gradient-to-r from-emerald-600 to-emerald-400'}`}
                              style={{ width: `${Math.min((seismicLevel / 4) * 100, 100)}%`, boxShadow: `0 0 10px ${seismicLevel >= 2.5 ? 'rgba(239,68,68,0.8)' : 'rgba(16,185,129,0.5)'}` }}
                            />
                          </div>
                          <span className={`text-[11px] font-mono font-bold w-8 text-right ${seismicLevel >= 2.5 ? 'text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.8)]' : seismicLevel >= 1.2 ? 'text-amber-400' : 'text-emerald-400'}`}>{seismicLevel.toFixed(2)} M</span>
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
                          <div key={i} className={`hud-glitch-hover bg-gradient-to-br from-${s.color}-500/10 to-transparent border border-${s.color}-500/20 rounded-lg p-2 text-center transition-all duration-300 hover:border-${s.color}-500/50 hover:bg-${s.color}-500/20 cursor-pointer`}>
                            <div className={`text-lg mb-1 ${s.active ? 'opacity-100' : 'opacity-40 grayscale'}`}>{s.icon}</div>
                            <div className={`text-[9px] font-mono text-${s.color}-400 font-bold tracking-wider leading-none`}>{s.label}</div>
                            <div className={`w-1 h-1 rounded-full mx-auto mt-1.5 ${s.active ? `bg-${s.color}-400 animate-ping` : 'bg-slate-700'}`}></div>
                          </div>
                        ))}
                      </div>

                      {/* Emergency Controls */}
                      <div className="mt-3 flex gap-2">
                        <button 
                          onClick={() => setIsEmergencyEvacuation(!isEmergencyEvacuation)}
                          className={`flex-1 py-2.5 rounded-xl font-mono text-[11px] font-bold tracking-widest transition-all border ${isEmergencyEvacuation ? 'bg-red-600 border-red-400 text-white shadow-[0_0_20px_rgba(220,38,38,0.8)] animate-pulse' : 'bg-red-950/40 border-red-500/30 text-red-400 hover:bg-red-900/50 hover:border-red-500/70 hover:shadow-[0_0_15px_rgba(220,38,38,0.4)]'}`}
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
                          <div key={i} className={`flex gap-3 items-start text-[10px] font-mono p-1.5 rounded hover:bg-white/5 transition-colors ${entry.level === 'CRITICAL' ? 'text-red-400 font-bold' : entry.level === 'WARNING' ? 'text-amber-300' : 'text-emerald-300'}`}>
                            <span className="text-slate-500 shrink-0 w-16 opacity-70">[{entry.time}]</span>
                            <span className={`leading-relaxed ${entry.level === 'CRITICAL' ? 'drop-shadow-[0_0_5px_rgba(248,113,113,0.8)]' : ''}`}>
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
                      <div key={cam.id} className={`hud-glitch-hover relative aspect-video bg-black rounded-xl overflow-hidden group cursor-pointer border-2 transition-all duration-300 ${cam.status === 'ALERT' ? 'border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'border-slate-700/60 hover:border-indigo-500/80 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]'}`}>
                        {/* CRT pattern */}
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(transparent,transparent_2px,rgba(0,0,0,0.4)_2px,rgba(0,0,0,0.4)_4px)] z-20 pointer-events-none"></div>
                        
                        <img src={cam.img} className="w-full h-full object-cover opacity-60 grayscale sepia-[0.3] mix-blend-luminosity group-hover:opacity-90 group-hover:grayscale-0 group-hover:sepia-0 transition-all duration-700 scale-105 group-hover:scale-100" alt="cam"/>
                        
                        {/* Record Badge */}
                        <div className={`absolute top-2 left-2 z-30 px-2 py-0.5 rounded text-[9px] font-bold font-mono tracking-widest flex items-center gap-1.5 ${cam.status === 'ALERT' ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.8)]' : 'bg-red-600/90 text-white backdrop-blur-sm'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${cam.status === 'ALERT' ? 'bg-black' : 'bg-white'} animate-pulse`}></div>
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
                          <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent animate-[hud-scan_2s_linear_infinite]" style={{animationDuration: `${2 + cam.id * 0.5}s`}}></div>
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
                        return <div key={i} style={{height: `${capped}px`, backgroundColor: color, width: '100%', opacity: 0.8 + (i/60)*0.2}} className="rounded-sm transition-all duration-[400ms] hover:h-10 hover:bg-indigo-400 cursor-crosshair"></div>;
                      })}
                    </div>
                    
                    <div className={`shrink-0 text-center w-20 ${seismicAlert === 'CRITICAL' ? 'text-red-400 animate-pulse drop-shadow-[0_0_10px_rgba(248,113,113,0.8)]' : seismicAlert === 'WARNING' ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}>
                      <div className="font-mono text-2xl font-black">{seismicLevel.toFixed(2)}</div>
                      <div className="text-[9px] font-bold tracking-widest opacity-80">MAGNITUDE</div>
                    </div>
                    
                    <div className="h-10 w-px bg-white/10 mx-2"></div>
                    
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-[10px] font-mono text-slate-400 tracking-widest mb-1">THREAT INDEX</span>
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${threatLevel === 'CRITICAL' ? 'bg-red-900/30 border-red-500/50 text-red-400' : threatLevel === 'ELEVATED' ? 'bg-amber-900/30 border-amber-500/50 text-amber-400' : 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400'}`}>
                        <span className="font-mono font-black text-lg tracking-wider">
                          {threatLevel === 'CRITICAL' ? '91' : threatLevel === 'HIGH' ? '73' : threatLevel === 'ELEVATED' ? '42' : '08'}
                        </span>
                        <span className="text-[10px] opacity-60 font-bold">/100</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* In-Canvas Bottom Controls Overlay Tip */}
            <div className="absolute bottom-4 left-4 z-20 pointer-events-none bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 shadow-lg">
              {t('controlsTip')}
            </div>

            {/* Quick Status / Selection Pill (Top right inside canvas) */}
            {selectedUnit && (
              <div className="absolute top-4 right-4 z-20 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700 text-white text-xs shadow-xl flex items-center gap-3">
                <div>
                  <span className="text-[10px] text-indigo-400 font-bold block uppercase">
                    Focused Unit
                  </span>
                  <span className="font-bold text-white text-sm">
                    Unit {selectedUnit.unitNumber}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                >
                  Inspect →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 space-y-2 z-10 bg-slate-950">
            <Building2 className="w-10 h-10 text-slate-600" />
            <p className="text-xs">{t('noBuildingsFound')}</p>
          </div>
        )}
      </div>

      {/* 4. Real Unit Details Drawer */}
      <UnitDetailsDrawer
        unitId={selectedUnit?.id || null}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onNavigateLeaseCreate={(unitId, buildingId) => {
          setIsDrawerOpen(false);
          onNavigate?.('contracts', buildingId, undefined, unitId);
        }}
        onNavigateTenant={(tenantId) => {
          setIsDrawerOpen(false);
          onNavigate?.('tenants');
        }}
        onNavigateContract={(contractId) => {
          setIsDrawerOpen(false);
          onNavigate?.('contracts');
        }}
      />

      {/* 5. AI Image to 3D Generation Modal */}
      {showAiBuilder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-fuchsia-50 to-purple-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-600 to-purple-600 text-white flex items-center justify-center">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900">
                  {isAmharic ? 'የህንፃ ፎቶ ወደ 3D ጀነሬተር (AI)' : 'Image to 3D Generator (AI)'}
                </h3>
              </div>
              <button 
                onClick={() => setShowAiBuilder(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <AlertCircle className="w-5 h-5 opacity-0 absolute" /> {/* just to import AlertCircle if needed */}
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 hover:border-fuchsia-300 transition-colors cursor-pointer group">
                <div className="w-16 h-16 rounded-full bg-fuchsia-100 text-fuchsia-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-slate-900 text-center mb-1">
                  {isAmharic ? 'የህንፃዎን ፎቶ ያስገቡ (Upload Photo)' : 'Upload Building Photo'}
                </h4>
                <p className="text-xs text-slate-500 text-center max-w-xs">
                  {isAmharic 
                    ? 'የህንፃዎን የፊት ለፊት ገፅታ የሚያሳይ ግልፅ ፎቶ ያስገቡ። AI ፎቶውን በማየት ወደ 3D ሞዴል ይቀይረዋል!' 
                    : 'Upload a clear front-facing photo of your building. AI will analyze it to generate a 3D model!'}
                </p>
                
                  {aiStatus === 'idle' ? (
                    <>
                      <input 
                        type="file" 
                        accept="image/*" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleAiUpload} 
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-6 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                      >
                        {isAmharic ? 'ፎቶ ምረጥ (Browse Files)' : 'Browse Files'}
                      </button>
                    </>
                  ) : (
                    <div className="mt-6 w-full max-w-xs mx-auto space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                        <span>
                          {aiStatus === 'uploading' ? (isAmharic ? 'ፋይል በመጫን ላይ...' : 'Uploading...') :
                           aiStatus === 'analyzing' ? (isAmharic ? 'Gemini AI ፎቶውን እያጠና ነው...' : 'Gemini AI Analyzing...') :
                           aiStatus === 'generating' ? (isAmharic ? '3D ሞዴል በመገንባት ላይ...' : 'Generating 3D Model...') :
                           (isAmharic ? 'በተሳካ ሁኔታ ተጠናቋል!' : 'Success!')}
                        </span>
                        <span className="text-indigo-600">{progress}%</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${aiStatus === 'success' ? 'bg-emerald-500' : 'bg-gradient-to-r from-fuchsia-500 to-indigo-500'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      {aiStatus === 'success' && (
                        <p className="text-[10px] text-emerald-600 font-bold text-center animate-pulse">
                          {isAmharic ? 'አዲሱ 3D ሞዴል ወደ ሲስተሙ ገብቷል!' : '3D Model Integrated!'}
                        </p>
                      )}
                    </div>
                  )}

              </div>

              <div className="mt-6 bg-purple-50 p-4 rounded-xl border border-purple-100 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-sm font-bold text-purple-900 mb-1">
                    {isAmharic ? 'እንዴት ነው የሚሰራው?' : 'How does it work?'}
                  </h5>
                  <p className="text-xs text-purple-700 leading-relaxed">
                    {isAmharic 
                      ? 'Gemini AI የህንፃውን ወለሎች ብዛት፣ መስኮቶች፣ በሮች እና አጠቃላይ ዲዛይን በመለየት (Analyze በማድረግ) በThree.js የ3D ሞዴል እና ቨርቹዋል ካሜራዎችን ጀነሬት ያደርጋል። (ይህ ገፅታ ለሙከራ/Demo የቀረበ ነው)' 
                      : 'Gemini AI analyzes floor counts, windows, doors, and general facade design to procedurally generate a Three.js 3D model and virtual security cameras. (Demo Feature)'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
