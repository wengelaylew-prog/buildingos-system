const fs = require('fs');
let tds = fs.readFileSync('src/modules/three-d/three-d.service.ts', 'utf8');

tds = tds.replace(
  "numberOfFloors: buildings.numberOfFloors,\n          })",
  "numberOfFloors: buildings.numberOfFloors,\n          latitude: buildings.latitude,\n          longitude: buildings.longitude,\n          }) // Include coordinates in fallback results"
);

// Ensure the fallback query includes all required building fields.
const fallbackQuery = `const fallbackBuildings = await db
          .select({
            id: buildings.id,
            name: buildings.name,
            code: buildings.code,
            numberOfFloors: buildings.numberOfFloors,
            totalUnits: buildings.totalUnits,
            latitude: buildings.latitude,
            longitude: buildings.longitude,
          })`;

tds = tds.replace(
  /const fallbackBuildings = await db[\s\S]*?totalUnits: buildings\.totalUnits,[\s\S]*?\}\)/, 
  fallbackQuery
);

// Keep the fallback query update targeted to the building selection.
fs.writeFileSync('src/modules/three-d/three-d.service.ts', tds, 'utf8');
