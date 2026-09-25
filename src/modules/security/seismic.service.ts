import { db } from '../../db';
import { buildings, securityLogs } from '../../db/schema';
import { eq } from 'drizzle-orm';

const USGS_API = 'https://earthquake.usgs.gov/fdsnws/event/1/query';

export interface EarthquakeEvent {
  magnitude: number;
  place: string;
  time: number;
  latitude: number;
  longitude: number;
  depth: number;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export class SeismicService {
  /**
   * Query USGS for recent earthquakes globally and check proximity to all buildings.
   * Called by a cron job every 5 minutes.
   */
  static async scanGlobalEarthquakes(): Promise<{ alerts: any[] }> {
    const alerts: any[] = [];

    try {
      const now = new Date();
      const from = new Date(now.getTime() - 10 * 60 * 1000); // Last 10 minutes

      const url = `${USGS_API}?format=geojson&starttime=${from.toISOString()}&endtime=${now.toISOString()}&minmagnitude=1.5&limit=50`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`USGS API failed: ${response.status}`);

      const data = await response.json();
      const earthquakes: EarthquakeEvent[] = (data.features || []).map((f: any) => ({
        magnitude: f.properties.mag,
        place: f.properties.place,
        time: f.properties.time,
        latitude: f.geometry.coordinates[1],
        longitude: f.geometry.coordinates[0],
        depth: f.geometry.coordinates[2],
      }));

      if (earthquakes.length === 0) return { alerts };

      // Load all buildings with coordinates
      const allBuildings = await db.select().from(buildings);

      for (const building of allBuildings) {
        if (!building.latitude || !building.longitude) continue;

        const bLat = parseFloat(building.latitude);
        const bLon = parseFloat(building.longitude);

        for (const quake of earthquakes) {
          const distKm = haversineDistance(bLat, bLon, quake.latitude, quake.longitude);

          // Alert radius scales with magnitude: M3=150km, M5=500km, M7=1000km
          const alertRadiusKm = Math.pow(10, quake.magnitude - 1.5) * 30;

          if (distKm <= alertRadiusKm) {
            const severity = quake.magnitude >= 6.0 ? 'CRITICAL' : quake.magnitude >= 4.0 ? 'HIGH' : quake.magnitude >= 2.5 ? 'MEDIUM' : 'LOW';

            const alertEntry = {
              buildingId: building.id,
              buildingName: building.name,
              organizationId: building.organizationId,
              distanceKm: Math.round(distKm),
              quake,
              severity,
              message: `🚨 SEISMIC ALERT — M${quake.magnitude.toFixed(1)} earthquake at ${quake.place} (${Math.round(distKm)}km from ${building.name})`,
            };

            alerts.push(alertEntry);

            // Log to DB (using security_logs table — scanType=SEISMIC_EVENT)
            await db.insert(securityLogs).values({
              organizationId: building.organizationId!,
              scanType: 'SEISMIC_EVENT',
              scannedId: `M${quake.magnitude.toFixed(1)}_${quake.time}`,
              direction: 'IN',
              scannedBy: '00000000-0000-0000-0000-000000000000', // system user placeholder
              status: severity === 'CRITICAL' ? 'FLAG' : 'SUCCESS',
              notes: alertEntry.message,
            }).catch(e => console.error('Failed to log seismic event:', e));

            // Emit live socket notification
            if ((global as any).io) {
              (global as any).io.emit('new_notification', {
                icon: '🌍',
                message: alertEntry.message,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('SeismicService.scanGlobalEarthquakes error:', error);
    }

    return { alerts };
  }

  /**
   * Get live USGS feed data for a specific lat/lng (for frontend display).
   */
  static async getLiveDataNearLocation(lat: number, lng: number, radiusKm = 500) {
    const url = `${USGS_API}?format=geojson&latitude=${lat}&longitude=${lng}&maxradiuskm=${radiusKm}&minmagnitude=1.0&orderby=time&limit=20`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`USGS API failed: ${response.status}`);
    const data = await response.json();

    return (data.features || []).map((f: any) => ({
      magnitude: f.properties.mag,
      place: f.properties.place,
      time: new Date(f.properties.time).toISOString(),
      latitude: f.geometry.coordinates[1],
      longitude: f.geometry.coordinates[0],
      depth: f.geometry.coordinates[2],
      alert: f.properties.alert,
    }));
  }
}
