import { Request } from 'express';
import { tenantsRepository, TenantsRepository } from './tenants.repository.ts';
import {
  TenantListQuery,
  CreateTenantDTO,
  UpdateTenantDTO,
  TenantEntity,
  TenantDetailResponse,
} from './tenants.types.ts';
import { ApiError } from '../common/api-response.ts';
import { validateCreateTenant, validateUpdateTenant } from './tenants.schema.ts';
import { logAudit, AuthenticatedUser } from '../../middleware/auth.ts';

export class TenantsService {
  constructor(private repo: TenantsRepository = tenantsRepository) {}

  async listTenants(query: TenantListQuery, organizationId: string) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

    const { items, total } = await this.repo.findMany(query, organizationId);
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getTenantById(id: string, organizationId: string): Promise<TenantDetailResponse> {
    const tenant = await this.repo.findById(id, organizationId);
    if (!tenant) {
      throw ApiError.notFound(`Tenant with ID '${id}' not found`);
    }

    const details = await this.repo.getDetailEntities(id, organizationId);

    return {
      tenant,
      activeLease: details.activeLease,
      currentLease: details.activeLease,
      unit: details.unit,
      floor: details.floor,
      building: details.building,
      leaseHistory: details.leaseHistory,
      contracts: details.leaseHistory,
      documents: details.documents,
      payments: details.payments,
      paymentHistory: details.payments,
      maintenance: details.maintenance,
      activity: details.activity,
    };
  }

  async getMyTenantProfile(user: AuthenticatedUser): Promise<TenantDetailResponse> {
    const tenant = await this.repo.findByUserIdOrEmail(user.id, user.email, user.organizationId);
    if (!tenant) {
      throw ApiError.notFound('No tenant profile associated with this authenticated account');
    }

    const details = await this.repo.getDetailEntities(tenant.id, user.organizationId);

    return {
      tenant,
      activeLease: details.activeLease,
      currentLease: details.activeLease,
      unit: details.unit,
      floor: details.floor,
      building: details.building,
      leaseHistory: details.leaseHistory,
      contracts: details.leaseHistory,
      documents: details.documents,
      payments: details.payments,
      paymentHistory: details.payments,
      maintenance: details.maintenance,
      activity: details.activity,
    };
  }

  async createTenant(
    rawBody: any,
    user: AuthenticatedUser,
    req?: Request
  ): Promise<TenantEntity> {
    const { isValid, errors, validatedData } = validateCreateTenant(rawBody);
    if (!isValid || !validatedData) {
      throw ApiError.badRequest('Validation failed for tenant creation', errors);
    }

    const organizationId = user.organizationId;
    const created = await this.repo.create(validatedData, organizationId);

    if (user && req) {
      await logAudit({
        userId: user.id,
        userEmail: user.email,
        organizationId: user.organizationId,
        action: 'TENANT_CREATED',
        entityType: 'tenant',
        entityId: created.id,
        oldValues: null,
        newValues: {
          fullName: created.fullName,
          phone: created.phone,
          email: created.email,
          idNumber: created.idNumber,
        },
        req,
      });
    }

    return created;
  }

  async updateTenant(
    id: string,
    rawBody: any,
    user: AuthenticatedUser,
    req?: Request
  ): Promise<TenantEntity> {
    const organizationId = user.organizationId;
    const current = await this.repo.findById(id, organizationId);
    if (!current) {
      throw ApiError.notFound(`Tenant with ID '${id}' not found`);
    }

    const { isValid, errors, validatedData } = validateUpdateTenant(rawBody);
    if (!isValid || !validatedData) {
      throw ApiError.badRequest('Validation failed for tenant update', errors);
    }

    const updated = await this.repo.update(id, validatedData, organizationId);
    if (!updated) {
      throw ApiError.internal('Failed to update tenant');
    }

    if (user && req) {
      await logAudit({
        userId: user.id,
        userEmail: user.email,
        organizationId: user.organizationId,
        action: 'TENANT_UPDATED',
        entityType: 'tenant',
        entityId: updated.id,
        oldValues: {
          fullName: current.fullName,
          phone: current.phone,
          email: current.email,
          idNumber: current.idNumber,
        },
        newValues: {
          fullName: updated.fullName,
          phone: updated.phone,
          email: updated.email,
          idNumber: updated.idNumber,
        },
        req,
      });
    }

    return updated;
  }

  async deleteTenant(id: string, user: AuthenticatedUser, req?: Request): Promise<{ id: string }> {
    const organizationId = user.organizationId;
    const current = await this.repo.findById(id, organizationId);
    if (!current) {
      throw ApiError.notFound(`Tenant with ID '${id}' not found`);
    }

    // Safety checks: do not physically or soft-delete if tenant has active or historical leases
    const { hasActive, hasHistory, count } = await this.repo.hasHistoryOrActiveLease(id, organizationId);
    if (hasActive) {
      throw ApiError.conflict(
        `Cannot delete tenant '${current.fullName}'. Tenant currently has an active lease agreement. Please terminate the lease first.`,
        [{ field: 'id', code: 'TENANT_HAS_ACTIVE_LEASE', message: 'Tenant has an active lease' }]
      );
    }

    if (hasHistory) {
      throw ApiError.conflict(
        `Cannot delete tenant '${current.fullName}'. Tenant has ${count} historical lease/contract record(s) on file. Preserving tenancy history is required.`,
        [{ field: 'id', code: 'TENANT_HAS_HISTORY', message: 'Tenant has historical lease records' }]
      );
    }

    const deleted = await this.repo.softDelete(id, organizationId);
    if (!deleted) {
      throw ApiError.internal('Failed to delete tenant');
    }

    if (user && req) {
      await logAudit({
        userId: user.id,
        userEmail: user.email,
        organizationId: user.organizationId,
        action: 'TENANT_DELETED',
        entityType: 'tenant',
        entityId: id,
        oldValues: { fullName: current.fullName, phone: current.phone },
        newValues: { isDeleted: true },
        req,
      });
    }

    return { id };
  }
}

export const tenantsService = new TenantsService();
