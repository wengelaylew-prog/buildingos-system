const fs = require('fs');

const filePath = 'src/components/views/UnitsView.tsx';
let source = fs.readFileSync(filePath, 'utf8');

source = source.replace(/const \[unitsMenu/g, 'const [unitsList');
source = source.replace(/const \[buildingsMenu/g, 'const [buildingsList');
source = source.replace(/filterFloorsMenu/g, 'filterFloorsList');

fs.writeFileSync(filePath, source, 'utf8');
