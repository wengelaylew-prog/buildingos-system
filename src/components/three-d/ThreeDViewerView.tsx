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

            {/* Exploded Floors Toggle */}
            <button
              type="button"
              onClick={() => setIsExploded(!isExploded)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                isExploded
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Explode individual floor slabs vertically"
            >
              <Sliders className="w-3.5 h-3.5" />
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

            {/* Reset View */}
            <button
              type="button"
              onClick={handleResetView}
              className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-xs font-semibold transition-colors shadow-xs"
              title={t('resetView')}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
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
              <span>{t('retry')}</span>
            </button>
          </div>
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
              onSelectUnit={handleSelectUnit}
            />

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
    </div>
  );
};
