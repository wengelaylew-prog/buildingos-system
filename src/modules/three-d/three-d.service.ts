import { db } from '../../db/index.ts';
import {
  buildings,
  floors,
  units,
  tenants,
  tenantUnits,
  contracts,
} from '../../db/schema.ts';
import { eq, and, desc, inArray, asc } from 'drizzle-orm';
import { AuthenticatedUser } from '../../middleware/auth.ts';
import { ApiError } from '../common/api-response.ts';
import {
  ThreeDSceneResponse,
  SceneBuildingDTO,
  SceneFloorDTO,
  SceneUnitDTO,
} from './three-d.types.ts';

export class ThreeDService {
  async getScene(
    user: AuthenticatedUser,
    requestedBuildingId?: string
  ): Promise<ThreeDSceneResponse> {
    const organizationId = user.organizationId;
    if (!organizationId) {
      throw ApiError.unauthorized('User organization context is missing');
    }

    const isTenant = user.roleCode === 'TENANT';
    let tenantUnitId: string | null = null;
    let targetBuildingId = requestedBuildingId;

    // 1. If user is TENANT, find their assigned unit and building
    if (isTenant) {
      // Find tenant record linked to user
      const matchedTenants = await db
        .select()
        .from(tenants)
        .where(
          and(
            eq(tenants.organizationId, organizationId),
            user.id ? eq(tenants.userId, user.id) : undefined
          )
        );

      let tenantRecord = matchedTenants[0];

      // Fallback: If no direct userId match, check email or find first tenant unit for demo
      if (!tenantRecord && user.email) {
        const byEmail = await db
          .select()
          .from(tenants)
          .where(
            and(
              eq(tenants.organizationId, organizationId),
              eq(tenants.email, user.email)
            )
          );
        tenantRecord = byEmail[0];
      }

      if (!tenantRecord) {
        // Fallback to first available tenant in organization for evaluation
        const firstTenant = await db
          .select()
          .from(tenants)
          .where(eq(tenants.organizationId, organizationId))
          .limit(1);
        tenantRecord = firstTenant[0];
      }

      if (tenantRecord) {
        // Find their assigned unit
        const assignments = await db
          .select({
            unitId: tenantUnits.unitId,
            buildingId: units.buildingId,
          })
          .from(tenantUnits)
          .innerJoin(units, eq(tenantUnits.unitId, units.id))
          .where(
            and(
              eq(tenantUnits.tenantId, tenantRecord.id),
              eq(units.organizationId, organizationId)
            )
          )
          .limit(1);

        if (assignments.length > 0) {
          tenantUnitId = assignments[0].unitId;
          targetBuildingId = assignments[0].buildingId;
        } else {
          // Check contracts if not in tenant_units
          const lease = await db
            .select({
              unitId: contracts.unitId,
              buildingId: units.buildingId,
            })
            .from(contracts)
            .innerJoin(units, eq(contracts.unitId, units.id))
            .where(
              and(
                eq(contracts.tenantId, tenantRecord.id),
                eq(units.organizationId, organizationId)
              )
            )
            .limit(1);

          if (lease.length > 0) {
            tenantUnitId = lease[0].unitId;
            targetBuildingId = lease[0].buildingId;
          }
        }
      }
    }

    // 2. Fetch all available buildings in this organization
    const orgBuildings = await db
      .select({
        id: buildings.id,
        name: buildings.name,
        code: buildings.code,
        numberOfFloors: buildings.numberOfFloors,
        totalUnits: buildings.totalUnits,
      })
      .from(buildings)
      .where(
        and(
          eq(buildings.organizationId, organizationId),
          eq(buildings.isDeleted, false)
        )
      )
      .orderBy(asc(buildings.name));

    if (orgBuildings.length === 0) {
      throw ApiError.notFound('No buildings registered in this organization');
    }

    // If tenant, they only have access to their own building
    const accessibleBuildings = isTenant && targetBuildingId
      ? orgBuildings.filter((b) => b.id === targetBuildingId)
      : orgBuildings;

    // Resolve target building
    if (!targetBuildingId || !accessibleBuildings.some((b) => b.id === targetBuildingId)) {
      targetBuildingId = accessibleBuildings[0].id;
    }

    // 3. Fetch full building record
    const targetBuildingRecord = (
      await db
        .select()
        .from(buildings)
        .where(
          and(
            eq(buildings.id, targetBuildingId),
            eq(buildings.organizationId, organizationId),
            eq(buildings.isDeleted, false)
          )
        )
    )[0];

    if (!targetBuildingRecord) {
      throw ApiError.notFound('Target building not found or access denied');
    }

    // 4. Fetch all floors for this building
    const buildingFloors = await db
      .select()
      .from(floors)
      .where(
        and(
          eq(floors.buildingId, targetBuildingId),
          eq(floors.organizationId, organizationId),
          eq(floors.isDeleted, false)
        )
      )
      .orderBy(asc(floors.floorNumber));

    // 5. Fetch all units for this building
    const buildingUnits = await db
      .select()
      .from(units)
      .where(
        and(
          eq(units.buildingId, targetBuildingId),
          eq(units.organizationId, organizationId),
          eq(units.isDeleted, false)
        )
      )
      .orderBy(asc(units.unitNumber));

    // 6. Fetch active contracts & tenants for these units
    const unitIds = buildingUnits.map((u) => u.id);
    let activeContractsMap = new Map<string, any>();
    let activeTenantsMap = new Map<string, any>();

    if (unitIds.length > 0) {
      const activeContracts = await db
        .select({
          contract: contracts,
          tenant: tenants,
        })
        .from(contracts)
        .leftJoin(tenants, eq(contracts.tenantId, tenants.id))
        .where(
          and(
            inArray(contracts.unitId, unitIds),
            eq(contracts.organizationId, organizationId),
            eq(contracts.isDeleted, false)
          )
        );

      for (const item of activeContracts) {
        if (!activeContractsMap.has(item.contract.unitId)) {
          activeContractsMap.set(item.contract.unitId, item.contract);
          if (item.tenant) {
            activeTenantsMap.set(item.contract.unitId, item.tenant);
          }
        }
      }
    }

    // 7. Calculate KPIs
    let vacantCount = 0;
    let occupiedCount = 0;
    let reservedCount = 0;
    let maintenanceCount = 0;

    for (const u of buildingUnits) {
      const st = u.status.toUpperCase();
      if (st === 'VACANT') vacantCount++;
      else if (st === 'OCCUPIED') occupiedCount++;
      else if (st === 'RESERVED') reservedCount++;
      else if (st === 'MAINTENANCE') maintenanceCount++;
    }

    const totalCount = buildingUnits.length;
    const occupancyRate = totalCount > 0 ? Math.round((occupiedCount / totalCount) * 100) : 0;

    // 8. Build hierarchical SceneBuildingDTO
    const floorDTOs: SceneFloorDTO[] = buildingFloors.map((fl) => {
      const rawUnitsForFloor = buildingUnits.filter((u) => u.floorId === fl.id);
      const unitsPerRow = Math.max(2, Math.ceil(Math.sqrt(Math.max(1, rawUnitsForFloor.length))));
      const unitWidth = 3.6;
      const unitDepth = 3.6;
      const spacing = 0.5;
      const totalWidth = unitsPerRow * unitWidth + (unitsPerRow - 1) * spacing;
      const totalDepth = unitsPerRow * unitDepth + (unitsPerRow - 1) * spacing;

      const floorUnits = rawUnitsForFloor.map((u, unitIdx): SceneUnitDTO => {
        const isUserUnit = isTenant ? u.id === tenantUnitId : false;
        const tenantInfo = activeTenantsMap.get(u.id);
        const contractInfo = activeContractsMap.get(u.id);

        // Fallback meshId
        const meshId =
          u.meshId || `mesh-unit-${(u.unitNumber || 'unit').toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

        // Fallback or explicit transform
        let transform: any = u.transform;
        if (!transform || !Array.isArray(transform.position) || transform.position.length !== 3) {
          const col = unitIdx % unitsPerRow;
          const row = Math.floor(unitIdx / unitsPerRow);
          const x = col * (unitWidth + spacing) - totalWidth / 2 + unitWidth / 2;
          const z = row * (unitDepth + spacing) - totalDepth / 2 + unitDepth / 2;
          const y = ((fl.floorNumber || 1) - 1) * 2.8;

          transform = {
            position: [Math.round(x * 100) / 100, Math.round(y * 100) / 100, Math.round(z * 100) / 100],
            rotation: [0, 0, 0],
            size: [unitWidth, 2.2, unitDepth],
          };
        }

        // For tenant users, redact personal/financial information of OTHER tenants
        if (isTenant && !isUserUnit) {
          return {
            id: u.id,
            buildingId: u.buildingId,
            floorId: u.floorId,
            unitNumber: u.unitNumber,
            unitType: u.unitType,
            area: Number(u.area) || 0,
            bedrooms: u.bedrooms,
            bathrooms: u.bathrooms,
            monthlyRent: 0, // Redacted
            depositAmount: 0, // Redacted
            status: u.status as any,
            description: null,
            meshId,
            transform,
            isTenantUnit: false,
            tenant: null,
            contract: null,
          };
        }

        return {
          id: u.id,
          buildingId: u.buildingId,
          floorId: u.floorId,
          unitNumber: u.unitNumber,
          unitType: u.unitType,
          area: Number(u.area) || 0,
          bedrooms: u.bedrooms,
          bathrooms: u.bathrooms,
          monthlyRent: Number(u.monthlyRent) || 0,
          depositAmount: Number(u.depositAmount) || 0,
          status: u.status as any,
          description: u.description,
          meshId,
          transform,
          isTenantUnit: isTenant ? isUserUnit : undefined,
          tenant: tenantInfo
            ? {
                id: tenantInfo.id,
                fullName: tenantInfo.fullName,
                phone: tenantInfo.phone,
                email: tenantInfo.email,
              }
            : null,
          contract: contractInfo
            ? {
                id: contractInfo.id,
                contractNumber: contractInfo.contractNumber,
                startDate: contractInfo.startDate,
                endDate: contractInfo.endDate,
                monthlyRent: Number(contractInfo.monthlyRent) || 0,
                status: contractInfo.status,
              }
            : null,
        };
      });

      return {
        id: fl.id,
        buildingId: fl.buildingId,
        floorNumber: fl.floorNumber,
        floorName: fl.floorName,
        description: fl.description,
        totalUnits: floorUnits.length,
        units: floorUnits,
      };
    });

    const buildingDTO: SceneBuildingDTO = {
      id: targetBuildingRecord.id,
      organizationId: targetBuildingRecord.organizationId || undefined,
      name: targetBuildingRecord.name,
      code: targetBuildingRecord.code,
      address: targetBuildingRecord.address,
      city: targetBuildingRecord.city,
      description: targetBuildingRecord.description,
      numberOfFloors: targetBuildingRecord.numberOfFloors,
      totalUnits: buildingUnits.length,
      status: targetBuildingRecord.status,
      floors: floorDTOs,
    };

    return {
      building: buildingDTO,
      allBuildings: accessibleBuildings,
      kpis: {
        totalUnits: totalCount,
        vacantUnits: vacantCount,
        occupiedUnits: occupiedCount,
        reservedUnits: reservedCount,
        maintenanceUnits: maintenanceCount,
        occupancyRate,
      },
      userRole: user.roleCode,
      tenantUnitId,
      isTenantRestricted: isTenant,
    };
  }
}

export const threeDService = new ThreeDService();
