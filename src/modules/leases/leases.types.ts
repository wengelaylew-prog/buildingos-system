export type LeaseStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'EXPIRING'
  | 'EXPIRED'
  | 'TERMINATED'
  | 'CANCELLED';

export interface LeaseEntity {
  id: string;
  organizationId: string | null;
  contractNumber: string;
  tenantId: string;
  unitId: string;
  startDate: string;
  endDate: string;
  monthlyRent: string;
  deposit: string;
  paymentFrequency: string;
  contractStatus: string;
  renewalOf: string | null;
  documentUrl: string | null;
  notes: string | null;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaseListQuery {
  page?: number | string;
  limit?: number | string;
  search?: string;
  status?: string;
  buildingId?: string;
  floorId?: string;
  unitId?: string;
  tenantId?: string;
  sortBy?: 'startDate' | 'endDate' | 'createdAt' | 'monthlyRent' | 'contractNumber';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateLeaseDTO {
  tenantId: string;
  unitId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  rentAmount: string; // or monthlyRent
  depositAmount?: string; // or deposit
  paymentFrequency?: string;
  status?: LeaseStatus;
  notes?: string;
  documentUrl?: string;
}

export interface UpdateLeaseDTO {
  startDate?: string;
  endDate?: string;
  rentAmount?: string;
  depositAmount?: string;
  paymentFrequency?: string;
  notes?: string;
  documentUrl?: string;
  status?: LeaseStatus;
}

export interface TerminateLeaseDTO {
  terminationDate?: string;
  reason?: string;
  notes?: string;
}

export interface RenewLeaseDTO {
  startDate: string;
  endDate: string;
  rentAmount?: string;
  depositAmount?: string;
  paymentFrequency?: string;
  notes?: string;
}

export interface LeaseJoinedItem {
  id: string;
  contractNumber: string;
  organizationId: string | null;
  tenantId: string;
  unitId: string;
  startDate: string;
  endDate: string;
  monthlyRent: string;
  deposit: string;
  paymentFrequency: string;
  status: string;
  contractStatus?: string;
  calculatedStatus?: string;
  daysRemaining?: number;
  renewalOf: string | null;
  notes: string | null;
  documentUrl: string | null;
  createdAt: Date;
  tenant?: {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
    idNumber: string | null;
  } | null;
  unit?: {
    id: string;
    unitNumber: string;
    unitType: string;
    status: string;
    monthlyRent: string;
  } | null;
  floor?: {
    id: string;
    floorNumber: number;
    floorName: string;
  } | null;
  building?: {
    id: string;
    name: string;
    code: string;
    address: string;
  } | null;
}

export interface LeaseListResponse {
  items: LeaseJoinedItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LeaseDetailResponse {
  lease: LeaseEntity;
  tenant: any;
  unit: any;
  floor: any;
  building: any;
  previousLease?: LeaseEntity | null;
  renewedLeases?: LeaseEntity[];
  payments?: any[];
  documents?: any[];
}
