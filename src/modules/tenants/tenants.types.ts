export interface TenantEntity {
  id: string;
  organizationId: string | null;
  userId: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  phone: string;
  email: string | null;
  idType: string;
  idNumber: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContact: string | null;
  notes: string | null;
  profilePhoto: string | null;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantListQuery {
  page?: number | string;
  limit?: number | string;
  search?: string;
  buildingId?: string;
  floorId?: string;
  unitId?: string;
  leaseStatus?: string;
  sortBy?: 'name' | 'createdAt' | 'email' | 'phone';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateTenantDTO {
  firstName: string;
  lastName: string;
  fullName?: string;
  phone: string;
  email?: string;
  idType?: string;
  idNumber?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContact?: string;
  notes?: string;
  profilePhoto?: string;
  userId?: string;
}

export interface UpdateTenantDTO {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  idType?: string;
  idNumber?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContact?: string;
  notes?: string;
  profilePhoto?: string;
  userId?: string;
}

export interface TenantWithActiveLease extends TenantEntity {
  activeLease?: {
    id: string;
    contractNumber: string;
    status: string;
    startDate: string;
    endDate: string;
    monthlyRent: string;
    deposit: string;
    unitId: string;
    unitNumber: string;
    buildingId?: string;
    buildingName?: string;
    floorId?: string;
    floorName?: string;
  } | null;
}

export interface TenantDetailResponse {
  tenant: TenantEntity;
  activeLease: any | null;
  currentLease?: any | null;
  unit: any | null;
  floor: any | null;
  building: any | null;
  leaseHistory: any[];
  contracts?: any[];
  documents?: any[];
  payments?: any[];
  paymentHistory?: any[];
  maintenance?: any[];
  activity?: any[];
}
