import { threeDService } from './src/modules/three-d/three-d.service.ts';
import { db } from './src/db/index.ts';
import { units, buildings, floors, tenants, contracts } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';
import { AuthenticatedUser } from './src/middleware/auth.ts';

async function runTests() {
  console.log('--- STARTING 3D SYSTEM INTEGRATION TESTS ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: any) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`, details || '');
      failed++;
    }
  }

  try {
    const allBuildings = await db.select().from(buildings).limit(5);
    console.log(`Found ${allBuildings.length} buildings in DB.`);

    if (allBuildings.length === 0) {
      console.log('No buildings in DB to test against, skipping.');
      return;
    }

    const testBuilding = allBuildings[0];
    const orgId = testBuilding.organizationId;

    // TEST 1: Full scene retrieval as ADMIN
    console.log('\nTesting Scene Fetch as ADMIN...');
    const adminUser: AuthenticatedUser = {
      id: 'test-admin-id',
      uid: 'firebase-admin-uid',
      email: 'admin@buildingos.local',
      fullName: 'System Administrator',
      roleCode: 'ADMIN',
      roleName: 'Administrator',
      permissions: ['*'],
      organizationId: orgId,
      organizationName: 'Primary Real Estate Org',
    };

    const adminScene = await threeDService.getScene(adminUser, testBuilding.id);

    assert(!!adminScene.building, 'Admin scene contains building');
    assert(adminScene.building.id === testBuilding.id, 'Building ID matches');
    assert(Array.isArray(adminScene.building.floors), 'Building contains floors array');
    assert(adminScene.building.floors.length > 0, 'Building has at least 1 floor');

    const totalUnits = adminScene.building.floors.reduce(
      (acc, fl) => acc + fl.units.length,
      0
    );
    assert(totalUnits > 0, `Building has units rendered (${totalUnits} units found)`);
    assert(adminScene.kpis.totalUnits === totalUnits, 'kpis totalUnits matches total rendered units');
    assert(typeof adminScene.kpis.occupancyRate === 'number', 'kpis occupancyRate is a number');

    // Check unit properties
    const firstFloor = adminScene.building.floors[0];
    const firstUnit = firstFloor.units[0];
    assert(!!firstUnit.status, `Unit has status (${firstUnit.status})`);
    assert(!!firstUnit.meshId, `Unit has meshId (${firstUnit.meshId})`);
    assert(!!firstUnit.transform, 'Unit has transform object');
    assert(
      Array.isArray(firstUnit.transform.position) &&
        firstUnit.transform.position.length === 3,
      'Unit position is 3D [x, y, z]'
    );
    assert(
      Array.isArray(firstUnit.transform.size) &&
        firstUnit.transform.size.length === 3,
      'Unit size is 3D [w, h, d]'
    );

    // TEST 2: Organization Isolation Protection
    console.log('\nTesting Organization Isolation Protection...');
    try {
      const wrongOrgUser: AuthenticatedUser = {
        id: 'attacker-id',
        uid: 'attacker-uid',
        email: 'attacker@othercorp.com',
        fullName: 'Unauthorized Actor',
        roleCode: 'ADMIN',
        roleName: 'Administrator',
        permissions: ['*'],
        organizationId: 'wrong-org-9999',
        organizationName: 'Unauthorized Org',
      };
      await threeDService.getScene(wrongOrgUser, testBuilding.id);
      assert(false, 'Should throw error when querying building with wrong orgId');
    } catch (err: any) {
      assert(
        err.statusCode === 404 ||
          err.message?.toLowerCase().includes('not found') ||
          err.message?.toLowerCase().includes('no buildings') ||
          err.message?.toLowerCase().includes('organization'),
        'Throws 404 / not found error for cross-org access'
      );
    }

    // TEST 3: Tenant Role Isolation
    console.log('\nTesting Tenant Role Privacy and Redaction...');
    const tenantContracts = await db
      .select({
        contract: contracts,
        tenant: tenants,
        unit: units,
      })
      .from(contracts)
      .innerJoin(tenants, eq(contracts.tenantId, tenants.id))
      .innerJoin(units, eq(contracts.unitId, units.id))
      .where(eq(contracts.organizationId, orgId))
      .limit(1);

    if (tenantContracts.length > 0) {
      const { tenant, unit } = tenantContracts[0];
      const tenantUser: AuthenticatedUser = {
        id: tenant.userId || tenant.id,
        uid: 'tenant-firebase-uid',
        email: tenant.email || 'tenant@test.com',
        fullName: tenant.fullName,
        roleCode: 'TENANT',
        roleName: 'Tenant',
        permissions: ['unit.read'],
        organizationId: orgId,
        organizationName: 'Primary Real Estate Org',
      };

      const tenantScene = await threeDService.getScene(tenantUser, unit.buildingId);

      let assignedFound = false;
      let otherOccupiedRedacted = true;

      for (const fl of tenantScene.building.floors) {
        for (const u of fl.units) {
          if (u.id === unit.id) {
            assignedFound = true;
            assert(u.isTenantUnit === true, 'Assigned unit marked with isTenantUnit: true');
            assert(u.tenant !== null, 'Assigned unit preserves tenant data');
            assert(u.contract !== null, 'Assigned unit preserves contract lease');
          } else {
            assert(!u.isTenantUnit, 'Other unit is NOT marked as isTenantUnit');
            if (u.status === 'OCCUPIED' || u.status === 'RESERVED') {
              if (u.tenant !== null || u.contract !== null) {
                otherOccupiedRedacted = false;
              }
            }
          }
        }
      }

      assert(assignedFound, 'Tenant assigned unit was found in 3D scene');
      assert(otherOccupiedRedacted, 'Non-assigned occupied units have tenant & lease data redacted');
    } else {
      console.log('No tenant contracts found to test TENANT role privacy.');
    }

    // TEST 4: Status code validation
    console.log('\nTesting Status Code Validation...');
    // INACTIVE is a valid DB status (units removed from market but not deleted)
    const validStatuses = ['VACANT', 'OCCUPIED', 'RESERVED', 'MAINTENANCE', 'INACTIVE'];
    let allStatusesValid = true;
    for (const fl of adminScene.building.floors) {
      for (const u of fl.units) {
        if (!validStatuses.includes(u.status)) {
          allStatusesValid = false;
        }
      }
    }
    assert(allStatusesValid, 'All unit statuses conform to VACANT, OCCUPIED, RESERVED, MAINTENANCE');

    // TEST 5: Fallback transforms validation
    console.log('\nTesting 3D Transform Fallbacks...');
    let allHaveValidTransforms = true;
    for (const fl of adminScene.building.floors) {
      for (const u of fl.units) {
        if (
          !u.transform ||
          !Array.isArray(u.transform.position) ||
          u.transform.position.length !== 3 ||
          !Array.isArray(u.transform.size) ||
          u.transform.size.length !== 3
        ) {
          allHaveValidTransforms = false;
        }
      }
    }
    assert(allHaveValidTransforms, 'All units have mathematically valid 3D coordinates and bounding boxes');

    // TEST 6: Unit Selection Data Integrity
    console.log('\nTesting Unit Selection Data Integrity...');
    // Verify that each SceneUnitDTO has the required fields for 3D interaction
    let allUnitsHaveRequiredFields = true;
    const requiredUnitFields = [
      'id', 'buildingId', 'floorId', 'unitNumber', 'unitType', 'area', 'status', 'meshId', 'transform'
    ] as const;
    for (const fl of adminScene.building.floors) {
      for (const u of fl.units) {
        for (const field of requiredUnitFields) {
          if ((u as any)[field] === undefined) {
            allUnitsHaveRequiredFields = false;
            console.error(`  Unit ${u.unitNumber} is missing required field: ${field}`);
          }
        }
      }
    }
    assert(allUnitsHaveRequiredFields, 'All SceneUnitDTOs have required fields for 3D rendering and interaction');

    // TEST 7: RBAC - Different role accesses
    console.log('\nTesting RBAC Scene Access by Role...');
    const managerUser: AuthenticatedUser = {
      id: 'test-manager-id',
      uid: 'firebase-manager-uid',
      email: 'manager@buildingos.local',
      fullName: 'Property Manager',
      roleCode: 'PROPERTY_MANAGER',
      roleName: 'Property Manager',
      permissions: ['building.read', 'unit.read', 'tenant.read'],
      organizationId: orgId,
      organizationName: 'Primary Real Estate Org',
    };

    const managerScene = await threeDService.getScene(managerUser, testBuilding.id);
    assert(!!managerScene.building, 'PROPERTY_MANAGER can retrieve 3D scene data');
    assert(managerScene.isTenantRestricted === false, 'PROPERTY_MANAGER is not tenant-restricted');

    // Test: allBuildings visible to non-tenant roles
    assert(
      Array.isArray(managerScene.allBuildings) && managerScene.allBuildings.length > 0,
      'Non-tenant roles see allBuildings list'
    );

    // TEST 8: Tenant/Lease Integration in Scene Data
    console.log('\nTesting Tenant and Lease Integration in 3D Scene...');
    // Check that occupied units in admin scene have tenant/contract data
    let hasAtLeastOneOccupiedWithTenantData = false;
    for (const fl of adminScene.building.floors) {
      for (const u of fl.units) {
        if (u.status === 'OCCUPIED' && u.tenant && u.contract) {
          hasAtLeastOneOccupiedWithTenantData = true;
          // Validate tenant data shape
          assert(typeof u.tenant.id === 'string', `OCCUPIED unit ${u.unitNumber} tenant has valid id`);
          assert(typeof u.tenant.fullName === 'string', `OCCUPIED unit ${u.unitNumber} tenant has fullName`);
          // Validate contract data shape
          assert(typeof u.contract.id === 'string', `OCCUPIED unit ${u.unitNumber} contract has valid id`);
          assert(typeof u.contract.contractNumber === 'string', `OCCUPIED unit ${u.unitNumber} contract has contractNumber`);
          break;
        }
      }
      if (hasAtLeastOneOccupiedWithTenantData) break;
    }
    if (hasAtLeastOneOccupiedWithTenantData) {
      console.log('  [INFO] Found occupied units with tenant/lease data embedded in 3D scene');
    } else {
      console.log('  [INFO] No occupied units with tenant data found (data may not be seeded with contracts)');
    }

    console.log(`\n--- TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ---`);
    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Test execution failed with error:', error);
    process.exit(1);
  }
}

runTests().then(() => {
  process.exit(0);
});
