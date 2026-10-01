const fs = require('fs');
let client = fs.readFileSync('src/api/client.ts', 'utf8');

const target = `verifyDigitalId: (token: string, direction?: string) => request<any>('/api/v1/security/digital-id/verify', { method: 'POST', body: JSON.stringify({ token, direction }) }),`;
const replacement = `verifyDigitalId: (token: string, direction?: string) => request<any>('/api/v1/security/digital-id/verify', { method: 'POST', body: JSON.stringify({ token, direction }) }),
  scanShopperId: (token: string, direction: string) => request<any>('/api/v1/security/shopper-scan', { method: 'POST', body: JSON.stringify({ token, direction }) }),`;

if (!client.includes('scanShopperId')) {
  client = client.replace(target, replacement);
  fs.writeFileSync('src/api/client.ts', client);
  console.log('client.ts patched for shopper scan.');
}

