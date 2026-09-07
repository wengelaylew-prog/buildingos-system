export interface SceneUnitDTO {
  id: string;
  buildingId: string;
  floorId: string;
  unitNumber: string;
  unitType: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  monthlyRent: number;
  depositAmount: number;
  status: 'VACANT' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE' | 'INACTIVE';
  description?: string | null;
  meshId?: string | null;
  transform?: any;
  isTenantUnit?: boolean;
  tenant?: {
    id: string;
    fullName: string;
    phone?: string;
    email?: string;
  } | null;
  contract?: {
    id: string;
    contractNumber: string;
    startDate: string;
    endDate: string;
    monthlyRent: number;
    status: string;
  } | null;
}

export interface SceneFloorDTO {
  id: string;
  buildingId: string;
  floorNumber: number;
  floorName: string;
  description?: string | null;
  totalUnits: number;
  units: SceneUnitDTO[];
}

export interface SceneBuildingDTO {
  id: string;
  organizationId?: string;
  name: string;
  code: string;
  address: string;
  city: string;
  description?: string | null;
  numberOfFloors: number;
  totalUnits: number;
  status: string;
  modelUrl?: string | null;
  floors: SceneFloorDTO[];
}

export interface ThreeDSceneResponse {
  building: SceneBuildingDTO;
  allBuildings: Array<{
    id: string;
    name: string;
    code: string;
    numberOfFloors: number;
    totalUnits: number;
  }>;
  kpis: {
    totalUnits: number;
    vacantUnits: number;
    occupiedUnits: number;
    reservedUnits: number;
    maintenanceUnits: number;
    occupancyRate: number;
  };
  userRole: string;
  tenantUnitId?: string | null;
  isTenantRestricted: boolean;
}
