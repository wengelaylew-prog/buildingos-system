const fs = require('fs');
let client = fs.readFileSync('src/api/client.ts', 'utf8');

const target = `verifyGatePass: (token: string) => request<any>('/api/v1/security/gate-passes/verify', { method: 'POST', body: JSON.stringify({ token }) }),`;
const replacement = `verifyGatePass: (token: string) => request<any>('/api/v1/security/gate-passes/verify', { method: 'POST', body: JSON.stringify({ token }) }),
  verifyDigitalId: (token: string, direction?: string) => request<any>('/api/v1/security/digital-id/verify', { method: 'POST', body: JSON.stringify({ token, direction }) }),`;

if (!client.includes('verifyDigitalId')) {
  client = client.replace(target, replacement);
  fs.writeFileSync('src/api/client.ts', client);
  console.log('client.ts patched.');
}
