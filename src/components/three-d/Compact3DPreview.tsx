import React, { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { api } from '../../api/client.ts';
import { ThreeDSceneResponse, SceneUnitDTO } from '../../modules/three-d/three-d.types.ts';
import { BuildingCanvas } from './BuildingCanvas.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

interface Compact3DPreviewProps {
  onExpandToStudio: (buildingId?: string, unitId?: string) => void;
}

export const Compact3DPreview: React.FC<Compact3DPreviewProps> = ({ onExpandToStudio }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [sceneData, setSceneData] = useState<ThreeDSceneResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchPreview = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.get3DScene();
        if (isMounted) {
          setSceneData(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load preview');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPreview();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectUnit = (unit: SceneUnitDTO) => {
    onExpandToStudio(sceneData?.building?.id, unit.id);
  };

  return (
    <div className="relative w-full h-full min-h-[220px] rounded-xl overflow-hidden bg-slate-900 flex flex-col justify-between border border-slate-800">
      {/* Top Overlay Badge */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <div className="bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
            3D Space Twin
          </span>
          <span className="text-xs font-bold text-white truncate max-w-[160px] block">
            {sceneData?.building?.name || 'Commercial High-Rise'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onExpandToStudio(sceneData?.building?.id)}
          className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all hover:scale-105"
        >
          <span>{t('full3DStudio')}</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3D Viewport */}
      <div className="flex-1 w-full min-h-[190px] relative">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 space-y-2">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-[11px] font-medium">Generating 3D model...</span>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 space-y-2 p-4 text-center">
            <p className="text-xs text-rose-400">{error}</p>
          </div>
        ) : sceneData?.building ? (
          <BuildingCanvas
            building={sceneData.building}
            selectedFloorId="ALL"
            selectedUnitId={null}
            isExploded={false}
            autoRotate={true}
            compact={true}
            onSelectUnit={handleSelectUnit}
          />
        ) : null}
      </div>

      {/* Bottom Mini Legend & Tip */}
      <div className="bg-slate-950/80 backdrop-blur-md px-3 py-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 z-10">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Vacant</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Reserved</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Maint</span>
          </div>
        </div>
        <span className="hidden sm:inline text-slate-500">Interactive 3D • Drag to orbit</span>
      </div>
    </div>
  );
};
