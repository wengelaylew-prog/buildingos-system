import { db } from '../../db/index.ts';
import { floors, units } from '../../db/schema.ts';
import { eq, and, sql, desc, asc, SQL, or, ilike } from 'drizzle-orm';
import { FloorEntity, FloorListQuery, CreateFloorDTO, UpdateFloorDTO } from './floors.types.ts';

export class FloorsRepository {
  async findById(id: string, organizationId?: string, includeDeleted = false): Promise<FloorEntity | null> {
    const conditions = [eq(floors.id, id)];
    if (organizationId) {
      conditions.push(eq(floors.organizationId, organizationId));
    }
    if (!includeDeleted) {
      conditions.push(eq(floors.isDeleted, false));
    }

    const result = await db
      .select()
      .from(floors)
      .where(and(...conditions))
      .limit(1);

    if (!result[0]) return null;
    const row = result[0];
    return {
      ...row,
      name: row.floorName,
    } as FloorEntity;
  }

  async findByBuildingAndNumber(
    buildingId: string,
    floorNumber: number,
    organizationId?: string,
    excludeId?: string
  ): Promise<FloorEntity | null> {
    const conditions = [
      eq(floors.buildingId, buildingId),
      eq(floors.floorNumber, floorNumber),
      eq(floors.isDeleted, false),
    ];
    if (organizationId) {
      conditions.push(eq(floors.organizationId, organizationId));
    }
    if (excludeId) {
      conditions.push(sql`${floors.id} != ${excludeId}`);
    }

    const result = await db
      .select()
      .from(floors)
      .where(and(...conditions))
      .limit(1);

    if (!result[0]) return null;
    const row = result[0];
    return {
      ...row,
      name: row.floorName,
    } as FloorEntity;
  }

  async findMany(query: FloorListQuery, organizationId?: string): Promise<{ items: FloorEntity[]; total: number }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [eq(floors.isDeleted, false)];

    if (organizationId) {
      conditions.push(eq(floors.organizationId, organizationId));
    }

    if (query.buildingId && query.buildingId !== 'ALL') {
      conditions.push(eq(floors.buildingId, query.buildingId));
    }

    if (query.search && query.search.trim().length > 0) {
      const searchPattern = `%${query.search.trim()}%`;
      conditions.push(
        or(
          ilike(floors.floorName, searchPattern),
          sql`${floors.floorNumber}::text ILIKE ${searchPattern}`
        )!
      );
    }

    const whereClause = and(...conditions);

    // Count total
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(floors)
      .where(whereClause);
    const total = countResult[0]?.count || 0;

    let orderColumn: any = floors.floorNumber;
    if (query.sortBy === 'floorName') orderColumn = floors.floorName as any;
    else if (query.sortBy === 'totalUnits') orderColumn = floors.totalUnits;
    else if (query.sortBy === 'createdAt') orderColumn = floors.createdAt as any;

    const orderDirection = query.sortOrder === 'desc' ? desc(orderColumn) : asc(orderColumn);

    const items = await db
      .select()
      .from(floors)
      .where(whereClause)
      .orderBy(orderDirection)
      .limit(limit)
      .offset(offset);

    const formatted = items.map((row) => ({
      ...row,
      name: row.floorName,
    })) as FloorEntity[];

    return { items: formatted, total };
  }

  async create(data: CreateFloorDTO, organizationId: string): Promise<FloorEntity> {
    const floorName = data.floorName || data.name || `Floor ${data.floorNumber}`;

    const result = await db
      .insert(floors)
      .values({
        organizationId,
        buildingId: data.buildingId,
        floorNumber: data.floorNumber,
        floorName,
        description: data.description || null,
        totalUnits: 0,
        isDeleted: false,
      })
      .returning();

    const row = result[0];
    return {
      ...row,
      name: row.floorName,
    } as FloorEntity;
  }

  async update(id: string, organizationId: string, data: UpdateFloorDTO): Promise<FloorEntity | null> {
    const updatePayload: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (data.floorNumber !== undefined) updatePayload.floorNumber = data.floorNumber;
    if (data.floorName !== undefined) updatePayload.floorName = data.floorName;
    else if (data.name !== undefined) updatePayload.floorName = data.name;
    if (data.description !== undefined) updatePayload.description = data.description;

    const result = await db
      .update(floors)
      .set(updatePayload)
      .where(and(eq(floors.id, id), eq(floors.organizationId, organizationId)))
      .returning();

    if (!result[0]) return null;
    const row = result[0];
    return {
      ...row,
      name: row.floorName,
    } as FloorEntity;
  }

  async softDelete(id: string, organizationId: string): Promise<boolean> {
    const result = await db
      .update(floors)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(floors.id, id), eq(floors.organizationId, organizationId)))
      .returning();

    return result.length > 0;
  }

  async countActiveUnits(floorId: string, organizationId?: string): Promise<number> {
    const conditions = [eq(units.floorId, floorId), eq(units.isDeleted, false)];
    if (organizationId) {
      conditions.push(eq(units.organizationId, organizationId));
    }
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(units)
      .where(and(...conditions));

    return result[0]?.count || 0;
  }

  async getUnitsForFloor(floorId: string, organizationId?: string) {
    const conditions = [eq(units.floorId, floorId), eq(units.isDeleted, false)];
    if (organizationId) {
      conditions.push(eq(units.organizationId, organizationId));
    }
    return await db
      .select()
      .from(units)
      .where(and(...conditions))
      .orderBy(units.unitNumber);
  }
}

export const floorsRepository = new FloorsRepository();
