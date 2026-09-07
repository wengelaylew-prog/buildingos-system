export interface FloorEntity {
  id: string;
  buildingId: string;
  floorNumber: number;
  floorName: string;
  name?: string; // alias for floorName
  description: string | null;
  totalUnits: number;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFloorDTO {
  buildingId: string;
  floorNumber: number;
  name?: string;
  floorName?: string;
  description?: string;
}

export interface UpdateFloorDTO {
  floorNumber?: number;
  name?: string;
  floorName?: string;
  description?: string;
}

export interface FloorListQuery {
  page?: number;
  limit?: number;
  buildingId?: string;
  search?: string;
  sortBy?: 'floorNumber' | 'floorName' | 'createdAt' | 'totalUnits';
  sortOrder?: 'asc' | 'desc';
}
