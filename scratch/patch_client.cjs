const fs = require('fs');

let client = fs.readFileSync('src/api/client.ts', 'utf8');

const securityMethods = `
  // Advanced Security (Phase 8)
  getSecurityCameras: () => request<any>('/api/v1/security/cameras'),
  saveSecurityCameras: (cameras: any[]) => request<any>('/api/v1/security/cameras', { method: 'POST', body: JSON.stringify({ cameras }) }),
  getLiveSeismic: (lat: number, lng: number, radius: number) => request<any>(\`/api/v1/security/seismic/live?lat=\${lat}&lng=\${lng}&radius=\${radius}\`),
`;

if (!client.includes('getSecurityCameras')) {
  client = client.replace(
    'export const api = {',
    'export const api = {' + securityMethods
  );
  fs.writeFileSync('src/api/client.ts', client);
  console.log('client.ts patched.');
} else {
  console.log('client.ts already patched.');
}

