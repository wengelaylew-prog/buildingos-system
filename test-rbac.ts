import { AdminController } from './src/modules/admin/admin.controller.ts';
import { AuthRequest } from './src/middleware/auth.ts';

function createMockRes() {
  const res: any = {};
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data: any) => {
    res.body = data;
    return res;
  };
  return res;
}

async function runTests() {
  console.log('--- STARTING RBAC TESTS ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  const reqSuperAdmin = { user: { roleCode: 'SUPER_ADMIN', organizationId: 'org1' } } as AuthRequest;
  const resSuperAdmin = createMockRes();
  try {
    await AdminController.getSystemStats(reqSuperAdmin, resSuperAdmin);
  } catch(e) {}
  assert(resSuperAdmin.statusCode !== 403, 'Super Administrator -> SaaS Admin = allowed');

  const reqPM = { user: { roleCode: 'PROPERTY_MANAGER', organizationId: 'org1' } } as AuthRequest;
  const resPM = createMockRes();
  await AdminController.getSystemStats(reqPM, resPM);
  assert(resPM.statusCode === 403, 'Property Manager -> SaaS Admin = forbidden');

  const reqAcct = { user: { roleCode: 'ACCOUNTANT', organizationId: 'org1' } } as AuthRequest;
  const resAcct = createMockRes();
  await AdminController.getSystemStats(reqAcct, resAcct);
  assert(resAcct.statusCode === 403, 'Accountant -> SaaS Admin = forbidden');

  const reqTenant = { user: { roleCode: 'TENANT', organizationId: 'org1' } } as AuthRequest;
  const resTenant = createMockRes();
  await AdminController.getSystemStats(reqTenant, resTenant);
  assert(resTenant.statusCode === 403, 'Tenant -> SaaS Admin = forbidden');

  console.log(`\n--- TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ---`);
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
