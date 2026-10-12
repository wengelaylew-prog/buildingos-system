const fs = require('fs');

const filePath = 'src/modules/three-d/three-d.service.ts';
let source = fs.readFileSync(filePath, 'utf8');

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

source = source.replace(
  /const fallbackBuildings = await db[\s\S]*?totalUnits: buildings\.totalUnits,[\s\S]*?\}\)/,
  fallbackQuery
);

fs.writeFileSync(filePath, source, 'utf8');
