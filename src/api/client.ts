import {
  Building,
  Floor,
  Unit,
  Tenant,
  Contract,
  Document,
  AuditLog,
  Payment,
  MaintenanceRequest,
  DashboardKPIs,
  AlertItem,
  UserRole,
  AuthUser,
} from '../types/index.ts';
import { ThreeDSceneResponse } from '../modules/three-d/three-d.types.ts';

let currentRole = localStorage.getItem('apex_active_role') || 'SUPER_ADMIN';
let currentToken: string | null = null;

export const setApiRole = (role: string) => {
  currentRole = role;
  localStorage.setItem('apex_active_role', role);
};

export const getApiRole = () => currentRole;

export const setApiToken = (token: string | null) => {
  currentToken = token;
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  headers.set('x-demo-role', currentRole);

  if (currentToken) {
    headers.set('Authorization', `Bearer ${currentToken}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    const errorMsg = json.message || 'An unexpected error occurred';
    throw new Error(errorMsg);
  }

  return json.data;
}

export const api = {
  // Auth
  getCurrentUser: () => request<AuthUser>('/api/v1/auth/me'),

  // Dashboard
  getDashboard: () =>
    request<{
      kpis: DashboardKPIs;
      recentActivity: AuditLog[];
      alerts: AlertItem[];
    }>('/api/v1/dashboard/kpis'),

  // 3D Property Viewer
  get3DScene: (buildingId?: string) => {
    const q = buildingId ? `?buildingId=${encodeURIComponent(buildingId)}` : '';
    return request<ThreeDSceneResponse>(`/api/v1/properties/3d-scene${q}`);
  },

  // Buildings
  getBuildings: (params?: string | { search?: string; status?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: string }, legacyStatus?: string) => {
    const q = new URLSearchParams();
    if (typeof params === 'string') {
      if (params) q.append('search', params);
      if (legacyStatus && legacyStatus !== 'ALL') q.append('status', legacyStatus);
    } else if (params) {
      if (params.search) q.append('search', params.search);
      if (params.status && params.status !== 'ALL') q.append('status', params.status);
      if (params.page) q.append('page', String(params.page));
      if (params.limit) q.append('limit', String(params.limit));
      if (params.sortBy) q.append('sortBy', params.sortBy);
      if (params.sortOrder) q.append('sortOrder', params.sortOrder);
    }
    const queryStr = q.toString();
    return request<Building[]>(`/api/v1/buildings${queryStr ? `?${queryStr}` : ''}`);
  },
  getBuilding: (id: string) =>
    request<{
      building: Building;
      floors: Floor[];
      units: Unit[];
      tenants: Tenant[];
      contracts: Contract[];
      maintenance: MaintenanceRequest[];
      documents: Document[];
      payments: Payment[];
    }>(`/api/v1/buildings/${id}`),
  createBuilding: (data: Partial<Building>) =>
    request<Building>('/api/v1/buildings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateBuilding: (id: string, data: Partial<Building>) =>
    request<Building>(`/api/v1/buildings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteBuilding: (id: string) =>
    request<{ id: string }>(`/api/v1/buildings/${id}`, {
      method: 'DELETE',
    }),

  // Floors
  getFloors: (params?: string | { buildingId?: string; search?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (typeof params === 'string') {
      if (params) q.append('buildingId', params);
    } else if (params) {
      if (params.buildingId) q.append('buildingId', params.buildingId);
      if (params.search) q.append('search', params.search);
      if (params.page) q.append('page', String(params.page));
      if (params.limit) q.append('limit', String(params.limit));
    }
    const queryStr = q.toString();
    return request<Floor[]>(`/api/v1/floors${queryStr ? `?${queryStr}` : ''}`);
  },
  createFloor: (buildingId: string, data: { floorNumber: number; floorName: string; description?: string }) =>
    request<Floor>(`/api/v1/buildings/${buildingId}/floors`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateFloor: (id: string, data: { floorNumber?: number; floorName?: string; description?: string }) =>
    request<Floor>(`/api/v1/floors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteFloor: (id: string) =>
    request<{ id: string }>(`/api/v1/floors/${id}`, {
      method: 'DELETE',
    }),

  // Units
  getUnits: (params?: {
    buildingId?: string;
    floorId?: string;
    status?: string;
    unitType?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.buildingId && params.buildingId !== 'ALL') q.append('buildingId', params.buildingId);
    if (params?.floorId && params.floorId !== 'ALL') q.append('floorId', params.floorId);
    if (params?.status && params.status !== 'ALL') q.append('status', params.status);
    if (params?.unitType && params.unitType !== 'ALL') q.append('unitType', params.unitType);
    if (params?.search) q.append('search', params.search);
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    if (params?.sortBy) q.append('sortBy', params.sortBy);
    if (params?.sortOrder) q.append('sortOrder', params.sortOrder);
    const queryStr = q.toString();
    return request<Unit[]>(`/api/v1/units${queryStr ? `?${queryStr}` : ''}`);
  },
  getUnit: (id: string) =>
    request<{
      unit: Unit;
      building: Building;
      floor: Floor;
      tenant: Tenant | null;
      contract: Contract | null;
      contracts: Contract[];
      payments: Payment[];
      receipts: any[];
      maintenance: MaintenanceRequest[];
      documents: Document[];
      activity: AuditLog[];
    }>(`/api/v1/units/${id}`),
  createUnit: (data: any) =>
    request<Unit>('/api/v1/units', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUnit: (id: string, data: any) =>
    request<Unit>(`/api/v1/units/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteUnit: (id: string) =>
    request<{ id: string }>(`/api/v1/units/${id}`, {
      method: 'DELETE',
    }),

  // Tenants
  getTenants: (search?: string) => {
    const q = new URLSearchParams();
    if (search) q.append('search', search);
    return request<Tenant[]>(`/api/v1/tenants?${q.toString()}`);
  },
  getTenant: (id: string) =>
    request<{
      tenant: Tenant;
      unit: Unit | null;
      building: Building | null;
      currentLease: Contract | null;
      contracts: Contract[];
      paymentHistory: Payment[];
      documents: Document[];
      maintenance: MaintenanceRequest[];
      activity: AuditLog[];
    }>(`/api/v1/tenants/${id}`),
  createTenant: (data: any) =>
    request<Tenant>('/api/v1/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTenant: (id: string, data: any) =>
    request<Tenant>(`/api/v1/tenants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTenant: (id: string) =>
    request<{ id: string }>(`/api/v1/tenants/${id}`, {
      method: 'DELETE',
    }),

  // Contracts
  getContracts: (params?: { status?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.search) q.append('search', params.search);
    return request<Contract[]>(`/api/v1/contracts?${q.toString()}`);
  },
  createContract: (data: any) =>
    request<Contract>('/api/v1/contracts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateContract: (id: string, data: any) =>
    request<Contract>(`/api/v1/contracts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Documents
  getDocuments: (params?: { entityType?: string; entityId?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.entityType) q.append('entityType', params.entityType);
    if (params?.entityId) q.append('entityId', params.entityId);
    if (params?.search) q.append('search', params.search);
    return request<Document[]>(`/api/v1/documents?${q.toString()}`);
  },
  uploadDocument: (data: {
    entityType: string;
    entityId: string;
    fileName: string;
    fileType?: string;
    fileSize?: number;
    fileContent?: string;
  }) =>
    request<Document>('/api/v1/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteDocument: (id: string) =>
    request<{ id: string }>(`/api/v1/documents/${id}`, {
      method: 'DELETE',
    }),

  // Payments & Invoicing
  getPayments: () => request<Payment[]>('/api/v1/payments'),
  getInvoices: () => request<any[]>('/api/v1/billing/invoices'),
  generateInvoices: () => request<{ created: number }>('/api/v1/billing/invoices/generate', { method: 'POST' }),
  applyLateFees: () => request<{ applied: number }>('/api/v1/billing/invoices/late-fees', { method: 'POST' }),

  // Receipts
  getReceipts: () => request<any[]>('/api/v1/receipts'),
  getReceipt: (id: string) => request<any>(`/api/v1/receipts/${id}`),

  // Reports
  getReportMetrics: () => request<any>('/api/v1/reports'),
  exportReport: (type: string) => `/api/v1/reports/export?type=${type}`,

  // Messages
  getMessages: () => request<any[]>('/api/v1/messages'),
  sendMessage: (data: any) =>
    request<any>('/api/v1/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Notifications
  getNotifications: () => request<any[]>('/api/v1/notifications'),
  markNotificationRead: (id: string) =>
    request<any>(`/api/v1/notifications/${id}/read`, {
      method: 'PATCH',
    }),

  // Admin & SaaS Management
  getSystemStats: () => request<any>('/api/v1/admin/stats'),
  getOrganizations: () => request<any[]>('/api/v1/admin/organizations'),
  updateOrganizationStatus: (id: string, status: string) =>
    request<any>(`/api/v1/admin/organizations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  getAdminUsers: () => request<any[]>('/api/v1/admin/users'),
  getGlobalAuditLogs: () => request<any[]>('/api/v1/admin/audit'),

  // Maintenance
  getMaintenance: () => request<MaintenanceRequest[]>('/api/v1/maintenance'),
  createMaintenance: (data: any) =>
    request<MaintenanceRequest>('/api/v1/maintenance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateMaintenance: (id: string, data: any) =>
    request<{ success: boolean; invoiceId?: string }>(`/api/v1/maintenance/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Audit Logs
  getAuditLogs: (params?: { action?: string; entityType?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.action) q.append('action', params.action);
    if (params?.entityType) q.append('entityType', params.entityType);
    if (params?.search) q.append('search', params.search);
    return request<AuditLog[]>(`/api/v1/audit-logs?${q.toString()}`);
  },

  // Roles & RBAC
  getRoles: () => request<{ roles: UserRole[]; allPermissions: any[] }>('/api/v1/roles'),
  getUsers: () => request<any[]>('/api/v1/users'),
  updateUserRole: (userId: string, roleId: string) =>
    request<any>(`/api/v1/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ roleId }),
    }),

  // Settings
  getSettings: () => request<Record<string, string>>('/api/v1/settings'),
  updateSettings: (data: Record<string, string>) =>
    request<Record<string, string>>('/api/v1/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Database Seed
  reseedDatabase: () =>
    request<any>('/api/v1/seed', {
      method: 'POST',
    }),
};
