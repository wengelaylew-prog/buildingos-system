const fs = require('fs');
let code = fs.readFileSync('src/components/views/UnitsView.tsx', 'utf8');

code = code.replace(/const \[unitsMenu/g, 'const [unitsList');
code = code.replace(/const \[buildingsMenu/g, 'const [buildingsList');
code = code.replace(/filterFloorsMenu/g, 'filterFloorsList');

// The replacements above update the menu state and filter variable names.
