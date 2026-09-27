const fs = require('fs');

let code = fs.readFileSync('src/components/three-d/ThreeDViewerView.tsx', 'utf8');

const oldSeismicTarget = `    const fetchSeismic = () => {
      // Addis Ababa coordinates for demo, in production this comes from the building model
      api.getLiveSeismic(9.03, 38.74, 1000).then((res: any) => {`;

const newSeismicTarget = `    const fetchSeismic = () => {
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
      api.getLiveSeismic(lat, lng, 100).then((res: any) => {`;

if (code.includes(oldSeismicTarget)) {
  code = code.replace(oldSeismicTarget, newSeismicTarget);
  fs.writeFileSync('src/components/three-d/ThreeDViewerView.tsx', code);
  console.log('Patched fetchSeismic to use dynamic building coordinates with 100km radius.');
} else {
  console.log('Target not found or already patched.');
}

