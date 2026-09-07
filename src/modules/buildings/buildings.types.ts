export type BuildingStatus = 'ACTIVE' | 'INACTIVE' | 'UNDER_CONSTRUCTION';

export interface BuildingEntity {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  description: string | null;
  numberOfFloors: number;
  totalUnits: number;
  status: string;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BuildingStatistics {
  floors: number;
  units: number;
  occupied: number;
  vacant: number;
  maintenance: number;
  reserved: number;
}

export interface BuildingDetailResponse extends BuildingEntity {
  statistics: BuildingStatistics;
  building?: BuildingEntity;
  floors?: any[];
  units?: any[];
  tenants?: any[];
  contracts?: any[];
  documents?: any[];
  maintenance?: any[];
  payments?: any[];
}

export interface CreateBuildingDTO {
  name: string;
  code: string;
  address: string;
  city: string;
  description?: string;
  numberOfFloors?: number;
  status?: BuildingStatus;
}

export interface UpdateBuildingDTO {
  name?: string;
  code?: string;
  address?: string;
  city?: string;
  description?: string;
  numberOfFloors?: number;
  status?: BuildingStatus;
}

export interface BuildingListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: 'name' | 'code' | 'createdAt' | 'numberOfFloors' | 'totalUnits' | 'status';
  sortOrder?: 'asc' | 'desc';
}
