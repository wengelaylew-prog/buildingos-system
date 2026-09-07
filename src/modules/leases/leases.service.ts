import { Request } from 'express';
import { leasesRepository, LeasesRepository } from './leases.repository.ts';
import { unitsRepository } from '../units/units.repository.ts';
import { tenantsRepository } from '../tenants/tenants.repository.ts';
import {
  validateCreateLease,
  validateUpdateLease,
  validateRenewLease,
} from './leases.schema.ts';
import {
  LeaseEntity,
  LeaseListQuery,
  LeaseListResponse,
  LeaseDetailResponse,
} from './leases.types.ts';
import { ApiError } from '../common/api-response.ts';
import { AuthenticatedUser, logAudit } from '../../middleware/auth.ts';

export class LeasesService {
  constructor(private repo: LeasesRepository = leasesRepository) {}

  async listLeases(
    query: LeaseListQuery,
    organizationId: string
  ): Promise<LeaseListResponse> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

    const { items, total } = await this.repo.findMany(query, organizationId);
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getLeaseById(
    id: string,
    organizationId: string
  ): Promise<LeaseDetailResponse> {
    const details = await this.repo.getDetailEntities(id, organizationId);
    if (!details) {
      throw ApiError.notFound(`Lease agreement with ID '${id}' not found`);
    }

    return details;
  }

  async createLease(
    rawBody: any,
    user: AuthenticatedUser,
    req?: Request
  ): Promise<LeaseEntity> {
    const { isValid, errors, validatedData } = validateCreateLease(rawBody);
    if (!isValid || !validatedData) {
      throw ApiError.badRequest('Validation failed for lease creation', errors);
    }

    const organizationId = user.organizationId;

    // RULE 1, 2, 3: Verify Tenant and Unit belong to authenticated organization
    const tenant = await tenantsRepository.findById(validatedData.tenantId, organizationId);
    if (!tenant) {
      throw ApiError.notFound(
        `Tenant with ID '${validatedData.tenantId}' not found in your organization`,
        [{ field: 'tenantId', code: 'TENANT_NOT_FOUND', message: 'Tenant not found' }]
      );
    }

    const unit = await unitsRepository.findById(validatedData.unitId, organizationId);
    if (!unit) {
      throw ApiError.notFound(
        `Unit with ID '${validatedData.unitId}' not found in your organization`,
        [{ field: 'unitId', code: 'UNIT_NOT_FOUND', message: 'Unit not found' }]
      );
    }

    try {
      const result = await this.repo.createWithUnitSync(validatedData, organizationId);

      if (user && req) {
        await logAudit({
          userId: user.id,
          userEmail: user.email,
          organizationId: user.organizationId,
          action: 'LEASE_CREATED',
          entityType: 'contract',
          entityId: result.lease.id,
          oldValues: null,
          newValues: {
            contractNumber: result.lease.contractNumber,
            tenantId: result.lease.tenantId,
            unitId: result.lease.unitId,
            startDate: result.lease.startDate,
            endDate: result.lease.endDate,
            monthlyRent: result.lease.monthlyRent,
            status: result.lease.contractStatus,
          },
          req,
        });

        if (result.unitStatusChanged) {
          await logAudit({
            userId: user.id,
            userEmail: user.email,
            organizationId: user.organizationId,
            action: 'UNIT_STATUS_CHANGED',
            entityType: 'unit',
            entityId: validatedData.unitId,
            oldValues: { status: result.oldUnitStatus },
            newValues: { status: result.newUnitStatus, trigger: 'LEASE_ACTIVATION' },
            req,
          });
        }
      }

      return result.lease;
    } catch (err: any) {
      if (err.message === 'UNIT_ALREADY_LEASED') {
        throw ApiError.conflict(
          `Unit '${unit.unitNumber}' already has an active lease agreement overlapping with the selected dates (${validatedData.startDate} to ${validatedData.endDate}).`,
          [{ field: 'unitId', code: 'UNIT_ALREADY_LEASED', message: 'Unit is already leased for these dates' }]
        );
      }
      if (err.message === 'UNIT_NOT_FOUND') {
        throw ApiError.notFound('Unit not found', [{ field: 'unitId', code: 'UNIT_NOT_FOUND' }]);
      }
      if (err.message === 'UNIT_ORG_MISMATCH') {
        throw ApiError.forbidden('Unit belongs to another organization');
      }
      throw err;
    }
  }

  async updateLease(
    id: string,
    rawBody: any,
    user: AuthenticatedUser,
    req?: Request
  ): Promise<LeaseEntity> {
    const organizationId = user.organizationId;
    const current = await this.repo.findById(id, organizationId);
    if (!current) {
      throw ApiError.notFound(`Lease with ID '${id}' not found`);
    }

    const { isValid, errors, validatedData } = validateUpdateLease(rawBody);
    if (!isValid || !validatedData) {
      throw ApiError.badRequest('Validation failed for lease update', errors);
    }

    try {
      const result = await this.repo.updateWithUnitSync(id, validatedData, organizationId);

      if (user && req) {
        await logAudit({
          userId: user.id,
          userEmail: user.email,
          organizationId: user.organizationId,
          action: 'LEASE_UPDATED',
          entityType: 'contract',
          entityId: id,
          oldValues: {
            startDate: current.startDate,
            endDate: current.endDate,
            monthlyRent: current.monthlyRent,
            status: current.contractStatus,
          },
          newValues: {
            startDate: result.lease.startDate,
            endDate: result.lease.endDate,
            monthlyRent: result.lease.monthlyRent,
            status: result.lease.contractStatus,
          },
          req,
        });

        if (result.unitStatusChanged) {
          await logAudit({
            userId: user.id,
            userEmail: user.email,
            organizationId: user.organizationId,
            action: 'UNIT_STATUS_CHANGED',
            entityType: 'unit',
            entityId: current.unitId,
            oldValues: { status: result.oldUnitStatus },
            newValues: { status: result.newUnitStatus, trigger: 'LEASE_STATUS_CHANGE' },
            req,
          });
        }
      }

      return result.lease;
    } catch (err: any) {
      if (err.message === 'UNIT_ALREADY_LEASED') {
        throw ApiError.conflict('Modification causes an overlap with another active lease for this unit', [
          { field: 'dates', code: 'UNIT_ALREADY_LEASED', message: 'Overlapping active lease exists' },
        ]);
      }
      if (err.message === 'LEASE_NOT_FOUND') {
        throw ApiError.notFound('Lease not found');
      }
      throw err;
    }
  }

  async terminateLease(
    id: string,
    notes?: string,
    user?: AuthenticatedUser,
    req?: Request
  ): Promise<{ lease: LeaseEntity; unit: any }> {
    const organizationId = user?.organizationId || 'a0000000-0000-0000-0000-000000000001';
    const current = await this.repo.findById(id, organizationId);
    if (!current) {
      throw ApiError.notFound(`Lease with ID '${id}' not found`);
    }

    if (current.contractStatus !== 'ACTIVE' && current.contractStatus !== 'EXPIRING') {
      throw ApiError.badRequest(`Cannot terminate lease with status '${current.contractStatus}'. Only active leases can be terminated.`, [
        { field: 'status', code: 'LEASE_NOT_ACTIVE', message: 'Lease is not active' },
      ]);
    }

    try {
      const result = await this.repo.terminateWithUnitSync(id, notes, organizationId);

      if (user && req) {
        await logAudit({
          userId: user?.id,
          userEmail: user?.email,
          organizationId: user?.organizationId,
          action: 'LEASE_TERMINATED',
          entityType: 'contract',
          entityId: id,
          oldValues: { status: current.contractStatus },
          newValues: { status: 'TERMINATED', reason: notes || 'Manual termination' },
          req,
        });

        if (result.unitStatusChanged) {
          await logAudit({
            userId: user?.id,
            userEmail: user?.email,
            organizationId: user?.organizationId,
            action: 'UNIT_STATUS_CHANGED',
            entityType: 'unit',
            entityId: current.unitId,
            oldValues: { status: 'OCCUPIED' },
            newValues: { status: 'VACANT', trigger: 'LEASE_TERMINATION' },
            req,
          });
        }
      }

      return {
        lease: result.lease,
        unit: result.unit,
      };
    } catch (err: any) {
      if (err.message === 'LEASE_NOT_ACTIVE') {
        throw ApiError.badRequest('Only active leases can be terminated', [
          { field: 'status', code: 'LEASE_NOT_ACTIVE' },
        ]);
      }
      throw err;
    }
  }

  async renewLease(
    id: string,
    rawBody: any,
    user: AuthenticatedUser,
    req?: Request
  ): Promise<{ oldLease: LeaseEntity; newLease: LeaseEntity }> {
    const organizationId = user.organizationId;
    const current = await this.repo.findById(id, organizationId);
    if (!current) {
      throw ApiError.notFound(`Lease with ID '${id}' not found`);
    }

    const { isValid, errors, validatedData } = validateRenewLease(rawBody);
    if (!isValid || !validatedData) {
      throw ApiError.badRequest('Validation failed for lease renewal', errors);
    }

    try {
      const result = await this.repo.renewWithUnitSync(id, validatedData, organizationId);

      if (user && req) {
        await logAudit({
          userId: user.id,
          userEmail: user.email,
          organizationId: user.organizationId,
          action: 'LEASE_RENEWED',
          entityType: 'contract',
          entityId: id,
          oldValues: { status: current.contractStatus },
          newValues: { renewedToContractId: result.newLease.id, newContractNumber: result.newLease.contractNumber },
          req,
        });

        await logAudit({
          userId: user.id,
          userEmail: user.email,
          organizationId: user.organizationId,
          action: 'LEASE_CREATED',
          entityType: 'contract',
          entityId: result.newLease.id,
          oldValues: null,
          newValues: {
            contractNumber: result.newLease.contractNumber,
            renewalOf: id,
            startDate: result.newLease.startDate,
            endDate: result.newLease.endDate,
            monthlyRent: result.newLease.monthlyRent,
          },
          req,
        });
      }

      return {
        oldLease: result.oldLease,
        newLease: result.newLease,
      };
    } catch (err: any) {
      if (err.message === 'UNIT_ALREADY_LEASED') {
        throw ApiError.conflict(
          `Unit already has another active lease overlapping with renewal dates (${validatedData.startDate} to ${validatedData.endDate})`,
          [{ field: 'dates', code: 'UNIT_ALREADY_LEASED', message: 'Renewal dates overlap with another lease' }]
        );
      }
      throw err;
    }
  }

  async deleteLease(id: string, user: AuthenticatedUser, req?: Request): Promise<{ id: string }> {
    const organizationId = user.organizationId;
    const current = await this.repo.findById(id, organizationId);
    if (!current) {
      throw ApiError.notFound(`Lease with ID '${id}' not found`);
    }

    // Protection rule: Active or historically bound leases cannot be physically deleted
    if (current.contractStatus === 'ACTIVE' || current.contractStatus === 'EXPIRING') {
      throw ApiError.conflict(
        `Cannot delete active lease '${current.contractNumber}'. Please terminate the lease first if tenancy has concluded.`,
        [{ field: 'status', code: 'LEASE_ACTIVE', message: 'Active lease cannot be deleted' }]
      );
    }

    const deleted = await this.repo.softDelete(id, organizationId);
    if (!deleted) {
      throw ApiError.internal('Failed to delete lease');
    }

    if (user && req) {
      await logAudit({
        userId: user.id,
        userEmail: user.email,
        organizationId: user.organizationId,
        action: 'LEASE_DELETED',
        entityType: 'contract',
        entityId: id,
        oldValues: { contractNumber: current.contractNumber, status: current.contractStatus },
        newValues: { isDeleted: true },
        req,
      });
    }

    return { id };
  }
}

export const leasesService = new LeasesService();
