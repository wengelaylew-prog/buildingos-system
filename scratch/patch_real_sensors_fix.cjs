const fs = require('fs');

let code = fs.readFileSync('src/components/three-d/ThreeDViewerView.tsx', 'utf8');

// Replace api.get and api.post with the new methods
code = code.replace(/api\.get\('\/api\/v1\/security\/cameras'\)/g, 'api.getSecurityCameras()');
code = code.replace(/api\.get\('\/api\/v1\/security\/seismic\/live\?lat=9\.03&lng=38\.74&radius=1000'\)/g, 'api.getLiveSeismic(9.03, 38.74, 1000)');
code = code.replace(/api\.post\('\/api\/v1\/security\/cameras',\s*\{\s*cameras:\s*updated\s*\}\)/g, 'api.saveSecurityCameras(updated)');

// Ensure res.data vs res handling. My 'request' function in client.ts returns 'json.data' directly.
// So `res.data` in ThreeDViewerView needs to just be `res`.
// Let's fix that.
code = code.replace(/api\.getSecurityCameras\(\)\.then\(\(res: any\) => \{/g, 'api.getSecurityCameras().then((res: any) => {');
code = code.replace(/if \(res\.data && res\.data\.length > 0\)/g, 'if (res && res.length > 0)');
code = code.replace(/setRealCameras\(res\.data\)/g, 'setRealCameras(res)');

code = code.replace(/api\.getLiveSeismic\(9\.03, 38\.74, 1000\)\.then\(\(res: any\) => \{/g, 'api.getLiveSeismic(9.03, 38.74, 1000).then((res: any) => {');
code = code.replace(/const quake = res\.data\[0\];/g, 'const quake = res[0];');

fs.writeFileSync('src/components/three-d/ThreeDViewerView.tsx', code);
console.log('Patched ThreeDViewerView.tsx to use typed api methods.');

