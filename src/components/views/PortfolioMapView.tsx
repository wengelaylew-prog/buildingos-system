import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.ts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Building as BuildingIcon, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';

// Fix Leaflet's default icon path issues with Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface PortfolioMapViewProps {
  onNavigateTo3D: (buildingId: string) => void;
}

export function PortfolioMapView({ onNavigateTo3D }: PortfolioMapViewProps) {
  const { locale } = useLanguage();
  const isAmharic = locale === 'am';

  const [buildings, setBuildings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Default center: Addis Ababa
  const addisAbabaPosition: [number, number] = [9.005401, 38.763611];

  useEffect(() => {
    loadBuildings();
  }, []);

  const loadBuildings = async () => {
    try {
      // The 3D scene API returns all buildings in the organization
      const data = await api.get3DScene();
      if (data && data.allBuildings) {
        // If a building doesn't have lat/long, we scatter them slightly around Addis Ababa for demo purposes
        const processed = data.allBuildings.map((b: any, i: number) => ({
           ...b,
           latitude: b.latitude || (9.005401 + (Math.random() - 0.5) * 0.05),
           longitude: b.longitude || (38.763611 + (Math.random() - 0.5) * 0.05),
        }));
        setBuildings(processed);
      }
    } catch (e) {
      console.error('Failed to load buildings map', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full bg-slate-50 text-slate-500 font-medium">Loading Portfolio Map...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white px-6 py-4 border-b flex justify-between items-center z-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="text-indigo-600" />
            {isAmharic ? 'የካርታ ዳሽቦርድ (Portfolio Map)' : 'Portfolio Map'}
          </h1>
          <p className="text-sm text-slate-500">
            {isAmharic ? 'የህንፃዎችዎን መገኛ እና አጠቃላይ መረጃ በካርታ ላይ ይመልከቱ' : 'View all your properties and their status on the city map'}
          </p>
        </div>
        <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-bold">
          {buildings.length} {isAmharic ? 'ህንፃዎች' : 'Properties'}
        </div>
      </div>

      <div className="flex-1 relative z-0">
        <MapContainer 
          center={addisAbabaPosition} 
          zoom={12} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {buildings.map(b => (
            <Marker key={b.id} position={[b.latitude, b.longitude]}>
              <Popup className="rounded-xl overflow-hidden shadow-lg border-0">
                <div className="w-64 p-0">
                   <div className="bg-indigo-600 p-3 text-white">
                      <h3 className="font-bold text-lg flex items-center gap-2"><BuildingIcon size={18}/> {b.name}</h3>
                      <p className="text-indigo-100 text-xs">Code: {b.code}</p>
                   </div>
                   <div className="p-4 bg-white">
                      <div className="grid grid-cols-2 gap-3 mb-4">
                         <div className="bg-slate-50 p-2 rounded-lg border text-center">
                            <p className="text-[10px] text-slate-500 font-bold uppercase">{isAmharic ? 'ወለል' : 'Floors'}</p>
                            <p className="text-xl font-bold text-slate-800">{b.numberOfFloors}</p>
                         </div>
                         <div className="bg-slate-50 p-2 rounded-lg border text-center">
                            <p className="text-[10px] text-slate-500 font-bold uppercase">{isAmharic ? 'ክፍል' : 'Units'}</p>
                            <p className="text-xl font-bold text-slate-800">{b.totalUnits}</p>
                         </div>
                      </div>
                      
                      <button 
                        onClick={() => onNavigateTo3D(b.id)}
                        className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                      >
                         <span>{isAmharic ? 'ወደ 3D እይታ ሂድ' : 'Open 3D Viewer'}</span>
                         <ArrowRight size={16}/>
                      </button>
                   </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
