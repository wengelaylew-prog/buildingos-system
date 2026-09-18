const fs = require('fs');
let tds = fs.readFileSync('src/modules/three-d/three-d.service.ts', 'utf8');

tds = tds.replace(
  "numberOfFloors: buildings.numberOfFloors,\n          })",
  "numberOfFloors: buildings.numberOfFloors,\n          latitude: buildings.latitude,\n          longitude: buildings.longitude,\n          }) // ADDED LAT LNG HERE FOR FALLBACK"
);
// Also totalUnits is missing in fallbackBuildings select? Wait:
// `totalUnits: buildings.totalUnits,`
// Let's replace the whole block to be safe.
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

// Actually, I'll just do a string replace on `numberOfFloors: buildings.numberOfFloors,` inside fallbackBuildings context.
fs.writeFileSync('src/modules/three-d/three-d.service.ts', tds, 'utf8');

// I will just use PowerShell if this script is too complex, no wait, Amharic. Let me just write a very specific script.
