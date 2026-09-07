export type UnitStatus = 'OCCUPIED' | 'VACANT' | 'RESERVED' | 'MAINTENANCE';
export type ContractStatus = 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'TERMINATED' | 'DRAFT';
export type PaymentStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'PARTIAL';
export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
export type MaintenanceStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface Building {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  description: string | null;
  numberOfFloors: number;
  totalUnits: number;
  status: string;
  floorsCount?: number;
  unitsCount?: number;
  occupiedCount?: number;
  vacantCount?: number;
  occupancyRate?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Floor {
  id: string;
  buildingId: string;
  floorNumber: number;
  floorName: string;
  description: string | null;
  totalUnits: number;
  createdAt: string;
}

export interface Unit {
  id: string;
  buildingId: string;
  floorId: string;
  unitNumber: string;
  unitType: string;
  area: string;
  bedrooms: number;
  bathrooms: number;
  monthlyRent: string;
  depositAmount: string;
  status: UnitStatus;
  description: string | null;
  building?: { id: string; name: string; code: string };
  floor?: { id: string; floorNumber: number; floorName: string };
  currentTenant?: Tenant | null;
  currentContract?: Contract | null;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  idType: string;
  idNumber: string;
  address: string | null;
  emergencyContact: string | null;
  notes: string | null;
  profilePhoto: string | null;
  unit?: { id: string; unitNumber: string; unitType: string } | null;
  building?: { id: string; name: string; code: string } | null;
  contract?: {
    id: string;
    contractNumber: string;
    status: string;
    endDate: string;
    monthlyRent: string;
  } | null;
  leaseStatus?: string;
  createdAt: string;
}

export interface Contract {
  id: string;
  contractNumber: string;
  tenantId: string;
  unitId: string;
  startDate: string;
  endDate: string;
  monthlyRent: string;
  deposit: string;
  paymentFrequency: string;
  contractStatus: string;
  calculatedStatus?: string;
  daysRemaining?: number;
  documentUrl: string | null;
  notes: string | null;
  tenant?: { id: string; fullName: string; phone: string; email: string };
  unit?: { id: string; unitNumber: string; unitType: string };
  building?: { id: string; name: string; code: string };
  createdAt: string;
}

export interface Document {
  id: string;
  entityType: 'building' | 'floor' | 'unit' | 'tenant' | 'contract';
  entityId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storageKey: string;
  url: string;
  uploadedBy: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  entityType: string;
  entityId: string;
  oldValues: any;
  newValues: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  tenantId: string;
  unitId: string;
  amount: string;
  paymentDate: string;
  paymentMethod: string;
  status: PaymentStatus;
  referenceNumber: string | null;
  notes: string | null;
  tenant?: { fullName: string; phone: string };
  unit?: { unitNumber: string };
  receipt?: { receiptNumber: string; issuedDate: string } | null;
}

export interface MaintenanceRequest {
  id: string;
  unitId: string | null;
  buildingId: string | null;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  reportedBy: string | null;
  assignedTo: string | null;
  cost: string | null;
  completedAt: string | null;
  createdAt: string;
  unit?: { unitNumber: string };
  building?: { name: string; code: string };
}

export interface DashboardKPIs {
  totalBuildings: number;
  totalFloors?: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  reservedUnits: number;
  maintenanceUnits: number;
  occupancyRate: number;
  totalTenants: number;
  monthlyRent: number;
  outstandingRent: number;
  expiringContracts: number;
  expiredContracts: number;
}

export interface AlertItem {
  id: string;
  type: 'ALERT' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  count: number;
  link: string;
}

export type UserRoleType =
  | 'SUPER_ADMIN'
  | 'BUILDING_MANAGER'
  | 'PROPERTY_ACCOUNTANT'
  | 'AUDITOR'
  | 'TENANT';

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: [
    'building.create', 'building.read', 'building.update', 'building.delete',
    'unit.create', 'unit.read', 'unit.update', 'unit.delete',
    'tenant.create', 'tenant.read', 'tenant.update', 'tenant.delete',
    'contract.create', 'contract.read', 'contract.update', 'contract.delete',
    'payment.create', 'payment.read', 'payment.update',
    'maintenance.create', 'maintenance.read', 'maintenance.update',
    'document.upload', 'document.read', 'document.delete',
    'audit.read', 'user.manage',
  ],
  BUILDING_MANAGER: [
    'building.read', 'building.update',
    'unit.create', 'unit.read', 'unit.update',
    'tenant.create', 'tenant.read', 'tenant.update',
    'contract.create', 'contract.read', 'contract.update',
    'payment.read',
    'maintenance.create', 'maintenance.read', 'maintenance.update',
    'document.upload', 'document.read',
    'audit.read',
  ],
  PROPERTY_ACCOUNTANT: [
    'building.read',
    'unit.read',
    'tenant.read',
    'contract.read',
    'payment.create', 'payment.read', 'payment.update',
    'document.read',
  ],
  AUDITOR: [
    'building.read',
    'unit.read',
    'tenant.read',
    'contract.read',
    'payment.read',
    'maintenance.read',
    'document.read',
    'audit.read',
  ],
  TENANT: [
    'building.read',
    'unit.read',
    'contract.read',
    'payment.read',
    'maintenance.create', 'maintenance.read',
    'document.read',
  ],
};

export interface UserRole {
  id: string;
  name: string;
  code: string;
  description: string;
  permissions?: { id: string; code: string; name: string }[];
}

export interface AuthUser {
  id: string;
  uid: string;
  email: string;
  fullName: string;
  roleCode: string;
  roleName: string;
  permissions: string[];
}
