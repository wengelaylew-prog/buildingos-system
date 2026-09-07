export type UnitType =
  | 'OFFICE'
  | 'APARTMENT'
  | 'SHOP'
  | 'WAREHOUSE'
  | 'STUDIO'
  | 'OTHER';

export type UnitStatus =
  | 'VACANT'
  | 'OCCUPIED'
  | 'RESERVED'
  | 'MAINTENANCE'
  | 'INACTIVE';

export interface UnitEntity {
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
  status: string;
  description: string | null;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Joins
  buildingName?: string;
  buildingCode?: string;
  floorNumber?: number;
  floorName?: string;
}

export interface CreateUnitDTO {
  buildingId: string;
  floorId: string;
  unitNumber: string;
  unitType: UnitType;
  status: UnitStatus;
  monthlyRent: string;
  area?: string;
  bedrooms?: number;
  bathrooms?: number;
  depositAmount?: string;
  description?: string;
}

export interface UpdateUnitDTO {
  buildingId?: string;
  floorId?: string;
  unitNumber?: string;
  unitType?: UnitType;
  status?: UnitStatus;
  monthlyRent?: string;
  area?: string;
  bedrooms?: number;
  bathrooms?: number;
  depositAmount?: string;
  description?: string;
}

export interface UnitListQuery {
  page?: number;
  limit?: number;
  buildingId?: string;
  floorId?: string;
  status?: string;
  unitType?: string;
  search?: string;
  sortBy?: 'unitNumber' | 'monthlyRent' | 'area' | 'status' | 'unitType' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface UnitDetailResponse {
  unit: UnitEntity;
  building: any;
  floor: any;
  tenant: any | null;
  contract: any | null;
  contracts: any[];
  payments: any[];
  receipts: any[];
  maintenance: any[];
  documents: any[];
  activity: any[];
}
