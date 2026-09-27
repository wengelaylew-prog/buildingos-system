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

            {/* Phase 8+: BuildingOS Intelligent Threat Shield — Seismic + AI Camera */}
            {viewMode === 'SECURITY' && (
              <div className="absolute inset-0 z-10 pointer-events-none p-3 flex flex-col justify-between overflow-hidden">
                
                {/* TOP BAR: Threat Level + Time */}
                <div className="flex justify-between items-start gap-3">

                  {/* LEFT: Security Command + Seismic Sensor */}
                  <div className="w-72 space-y-2 pointer-events-auto">
                    
                    {/* Header */}
                    <div className={`bg-slate-900/90 backdrop-blur-md border rounded-xl p-3 shadow-2xl ${
                      threatLevel === 'CRITICAL' ? 'border-red-500/80 shadow-red-900/40 animate-pulse' : 
                      threatLevel === 'HIGH' ? 'border-orange-500/60' : 
                      'border-indigo-500/40'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 font-mono font-bold text-xs">
                          <ShieldCheck size={14} className="text-indigo-400" />
                          <span className="text-white">{isAmharic ? 'የ BuildingOS ጥበቃ ስርዓት' : 'BuildingOS THREAT SHIELD'}</span>
                        </div>
                        <div className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono ${
                          threatLevel === 'CRITICAL' ? 'bg-red-600 text-white animate-pulse' :
                          threatLevel === 'HIGH' ? 'bg-orange-500 text-white' :
                          threatLevel === 'ELEVATED' ? 'bg-amber-500 text-black' :
                          'bg-emerald-600 text-white'
                        }`}>{threatLevel}</div>
                      </div>
                      
                      {/* SEISMIC SENSOR PANEL */}
                      <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-700/60">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Waves size={12} className={`${seismicAlert === 'CRITICAL' ? 'text-red-500' : seismicAlert === 'WARNING' ? 'text-amber-400' : 'text-emerald-400'}`} />
                          <span className="text-[10px] font-mono font-bold text-slate-300">{isAmharic ? 'የመሬት መንቀጥቀጥ ሴንሰር' : 'SEISMIC SENSOR'}</span>
                          <span className={`ml-auto text-[10px] font-bold font-mono ${seismicAlert === 'CRITICAL' ? 'text-red-400 animate-pulse' : seismicAlert === 'WARNING' ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {seismicAlert}
                          </span>
                        </div>
                        {/* Richter scale bar */}
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-slate-500">0.0</span>
                          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden relative">
                            <div 
                              className={`h-full rounded-full transition-all duration-700 ${seismicLevel >= 2.5 ? 'bg-red-500 animate-pulse' : seismicLevel >= 1.2 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min((seismicLevel / 4) * 100, 100)}%` }}
                            />
                          </div>
                          <span className={`text-[10px] font-mono font-bold ${seismicLevel >= 2.5 ? 'text-red-400' : seismicLevel >= 1.2 ? 'text-amber-400' : 'text-emerald-400'}`}>{seismicLevel.toFixed(2)} M</span>
                        </div>
                        <div className="mt-1.5 flex gap-1">
                          {[0,1,2,3,4,5,6,7].map(seg => (
                            <div key={seg} className={`flex-1 h-1 rounded-sm ${seismicLevel > seg * 0.5 ? (seg > 4 ? 'bg-red-500' : seg > 2 ? 'bg-amber-400' : 'bg-emerald-500') : 'bg-slate-700'}`}></div>
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
                          <div key={i} className={`bg-${s.color}-500/10 border border-${s.color}-500/30 rounded p-1.5 text-center`}>
                            <div className="text-base">{s.icon}</div>
                            <div className={`text-[8px] font-mono text-${s.color}-400 font-bold leading-tight mt-0.5`}>{s.label}</div>
                            <div className={`w-1.5 h-1.5 rounded-full bg-${s.color}-400 mx-auto mt-1 animate-pulse`}></div>
                          </div>
                        ))}
                      </div>

                      {/* Emergency Controls */}
                      <div className="mt-2 flex gap-2">
                        <button 
                          onClick={() => setIsEmergencyEvacuation(!isEmergencyEvacuation)}
                          className={`flex-1 py-2 rounded-lg font-mono text-[10px] font-bold transition-all border ${isEmergencyEvacuation ? 'bg-red-600 border-red-400 text-white shadow-[0_0_15px_rgba(220,38,38,0.7)] animate-pulse' : 'bg-red-600/10 border-red-500/50 text-red-400 hover:bg-red-600/30'}`}
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
                          <div key={i} className={`flex gap-2 items-start text-[9px] font-mono ${entry.level === 'CRITICAL' ? 'text-red-400' : entry.level === 'WARNING' ? 'text-amber-400' : 'text-emerald-400'}`}>
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
                      <div key={cam.id} className={`relative aspect-video bg-slate-900 rounded-lg overflow-hidden group cursor-pointer shadow-lg border ${cam.status === 'ALERT' ? 'border-amber-500 shadow-amber-900/30' : 'border-slate-700/60 hover:border-indigo-500'} transition-all`}>
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(transparent,transparent_2px,rgba(0,0,0,0.25)_2px,rgba(0,0,0,0.25)_4px)] z-10"></div>
                        <img src={cam.img} className="w-full h-full object-cover opacity-40 grayscale mix-blend-luminosity group-hover:opacity-70 group-hover:grayscale-0 transition-all duration-500" alt="cam"/>
                        <div className={`absolute top-1.5 left-1.5 z-20 px-1.5 py-0.5 rounded text-[8px] font-bold text-white flex items-center gap-1 ${cam.status === 'ALERT' ? 'bg-amber-500' : 'bg-red-600'}`}>
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
                          <div className="w-full h-0.5 bg-emerald-400/30 animate-bounce" style={{animationDuration: `${2 + cam.id}s`}}></div>
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
                        return <div key={i} style={{height: `${capped}px`, backgroundColor: color, width: '100%', opacity: 0.7 + (i/40)*0.3}} className="rounded-full transition-all"></div>;
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
