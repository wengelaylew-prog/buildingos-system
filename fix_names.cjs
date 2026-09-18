const fs = require('fs');
let code = fs.readFileSync('src/components/views/UnitsView.tsx', 'utf8');

code = code.replace(/const \[unitsMenu/g, 'const [unitsList');
code = code.replace(/const \[buildingsMenu/g, 'const [buildingsList');
code = code.replace(/filterFloorsMenu/g, 'filterFloorsList');
// Did it replace anywhere else?
// Wait, the regex was `/List,/g`.
// Let's check for any `Menu,` that shouldn't be there.

