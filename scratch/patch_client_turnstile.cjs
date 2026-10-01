const fs = require('fs');

let client = fs.readFileSync('src/api/client.ts', 'utf8');

const t1 = `verifyGatePass: (token: string) => request<any>('/api/v1/security/gate-passes/verify', { method: 'POST', body: JSON.stringify({ token }) }),`;
const r1 = `verifyGatePass: (token: string, gateIp?: string) => request<any>('/api/v1/security/gate-passes/verify', { method: 'POST', body: JSON.stringify({ token, gateIp }) }),`;

const t2 = `verifyDigitalId: (token: string, direction?: string) => request<any>('/api/v1/security/digital-id/verify', { method: 'POST', body: JSON.stringify({ token, direction }) }),`;
const r2 = `verifyDigitalId: (token: string, direction?: string, gateIp?: string) => request<any>('/api/v1/security/digital-id/verify', { method: 'POST', body: JSON.stringify({ token, direction, gateIp }) }),`;

const t3 = `scanShopperId: (token: string, direction: string) => request<any>('/api/v1/security/shopper-scan', { method: 'POST', body: JSON.stringify({ token, direction }) }),`;
const r3 = `scanShopperId: (token: string, direction: string, gateIp?: string) => request<any>('/api/v1/security/shopper-scan', { method: 'POST', body: JSON.stringify({ token, direction, gateIp }) }),`;

if (!client.includes('gateIp?: string')) {
  client = client.replace(t1, r1).replace(t2, r2).replace(t3, r3);
  fs.writeFileSync('src/api/client.ts', client);
  console.log('client.ts patched for gateIp parameter.');
}

