import React, { useEffect, useState } from 'react';
import {
  Grid3X3,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Building2,
  Layers,
  User,
  FileText,
  AlertCircle,
  Clock,
  ArrowRight,
  Box,
} from 'lucide-react';
import { api } from '../../api/client.ts';
import { Unit, Building, Floor, Tenant, Contract, Payment, MaintenanceRequest, Document, AuditLog } from '../../types/index.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface UnitsViewProps {
  initialBuildingId?: string;
  initialFloorId?: string;
  onNavigate3D?: (buildingId: string, floorId?: string, unitId?: string) => void;
  showCreateModalInitial?: boolean;
  onCloseCreateModalInitial?: () => void;
}

export const UnitsView: React.FC<UnitsViewProps> = ({
  initialBuildingId,
  initialFloorId,
  onNavigate3D,
  showCreateModalInitial,
  onCloseCreateModalInitial,
}) => {
  const { hasPermission } = useAuth();
  const [unitsList, setUnitsList] = useState<Unit[]>([]);
  const [buildingsList, setBuildingsList] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(initialBuildingId || 'ALL');
  const [selectedFloorId, setSelectedFloorId] = useState<string>(initialFloorId || 'ALL');
  const [filterFloorsList, setFilterFloorsList] = useState<Floor[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // Delete & Notification State
  const [deleteConfirmUnit, setDeleteConfirmUnit] = useState<Unit | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals & Details
  const [isCreateOpen, setIsCreateOpen] = useState(showCreateModalInitial || false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [unitDetails, setUnitDetails] = useState<{
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
  } | null>(null);
  const [detailTab, setDetailTab] = useState<'info' | 'tenant' | 'payments' | 'maintenance' | 'docs' | 'audit'>('info');

  // Form
  const [availableFloors, setAvailableFloors] = useState<Floor[]>([]);
  const [formData, setFormData] = useState({
    buildingId: '',
    floorId: '',
    unitNumber: '',
    unitType: 'Office',
    area: '120',
    bedrooms: 0,
    bathrooms: 1,
    monthlyRent: '35000',
    depositAmount: '70000',
    status: 'VACANT',
    description: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (showCreateModalInitial) {
      openCreateModal();
    }
  }, [showCreateModalInitial]);

  useEffect(() => {
    loadBuildings();
  }, []);

  useEffect(() => {
    if (initialBuildingId) {
      setSelectedBuildingId(initialBuildingId);
    }
  }, [initialBuildingId]);

  useEffect(() => {
    if (initialFloorId) {
      setSelectedFloorId(initialFloorId);
    }
  }, [initialFloorId]);

  // Load floors for the filter dropdown when a building is selected
  useEffect(() => {
    if (selectedBuildingId && selectedBuildingId !== 'ALL') {
      api
        .getFloors(selectedBuildingId)
        .then((floors) => {
          setFilterFloorsList(floors);
          if (selectedFloorId !== 'ALL' && !floors.some((f) => f.id === selectedFloorId)) {
            setSelectedFloorId('ALL');
          }
        })
        .catch(() => setFilterFloorsList([]));
    } else {
      setFilterFloorsList([]);
      setSelectedFloorId('ALL');
    }
  }, [selectedBuildingId]);

  useEffect(() => {
    loadUnits();
  }, [selectedBuildingId, selectedFloorId, statusFilter, typeFilter]);

  const loadBuildings = async () => {
    try {
      const bldgs = await api.getBuildings();
      setBuildingsList(bldgs);
    } catch (err) {
      console.error('Failed to load buildings list:', err);
    }
  };

  const loadUnits = async () => {
    try {
      setLoading(true);
      const data = await api.getUnits({
        buildingId: selectedBuildingId,
        floorId: selectedFloorId,
        status: statusFilter,
        unitType: typeFilter,
        search,
      });
      setUnitsList(data);
    } catch (err) {
      console.error('Failed to load units:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadUnits();
  };

  const openCreateModal = async () => {
    const defaultBldgId = buildingsList[0]?.id || '';
    setFormData({
      buildingId: defaultBldgId,
      floorId: '',
      unitNumber: '',
      unitType: 'Office',
      area: '120',
      bedrooms: 0,
      bathrooms: 1,
      monthlyRent: '35000',
      depositAmount: '70000',
      status: 'VACANT',
      description: '',
    });

    if (defaultBldgId) {
      try {
        const floors = await api.getFloors(defaultBldgId);
        setAvailableFloors(floors);
        if (floors.length > 0) {
          setFormData((prev) => ({ ...prev, floorId: floors[0].id }));
        }
      } catch (err) {
        console.error('Failed to load floors for default building:', err);
      }
    }

    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleBuildingChange = async (bId: string) => {
    setFormData((prev) => ({ ...prev, buildingId: bId, floorId: '' }));
    try {
      const floors = await api.getFloors(bId);
      setAvailableFloors(floors);
      if (floors.length > 0) {
        setFormData((prev) => ({ ...prev, floorId: floors[0].id }));
      }
    } catch (err) {
      console.error('Failed to load floors:', err);
    }
  };

  const openEditModal = (u: Unit) => {
    setSelectedUnit(u);
    setFormData({
      buildingId: u.buildingId,
      floorId: u.floorId,
      unitNumber: u.unitNumber,
      unitType: u.unitType,
      area: u.area,
      bedrooms: u.bedrooms,
      bathrooms: u.bathrooms,
      monthlyRent: u.monthlyRent,
      depositAmount: u.depositAmount,
      status: u.status,
      description: u.description || '',
    });
    setFormError(null);
    setIsEditOpen(true);
  };

  const openDetailModal = async (u: Unit) => {
    setSelectedUnit(u);
    setIsDetailOpen(true);
    try {
      const details = await api.getUnit(u.id);
      setUnitDetails(details);
    } catch (err) {
      console.error('Failed to load unit details:', err);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      setSubmitting(true);
      await api.createUnit(formData);
      setIsCreateOpen(false);
      onCloseCreateModalInitial?.();
      loadUnits();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create unit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit) return;
    setFormError(null);
    try {
      setSubmitting(true);
      await api.updateUnit(selectedUnit.id, formData);
      setIsEditOpen(false);
      loadUnits();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update unit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (unit: Unit) => {
    setDeleteConfirmUnit(unit);
    setDeleteError(null);
  };

  const handleConfirmDeleteUnit = async () => {
    if (!deleteConfirmUnit) return;
    try {
      setIsDeleting(true);
      setDeleteError(null);
      await api.deleteUnit(deleteConfirmUnit.id);
      setDeleteConfirmUnit(null);
      setNotification({
        type: 'success',
        message: `Unit ${deleteConfirmUnit.unitNumber} archived successfully.`,
      });
      setTimeout(() => setNotification(null), 4000);
      loadUnits();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete unit');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleQuickStatusChange = async (unit: Unit, newStatus: string) => {
    try {
      await api.updateUnit(unit.id, { status: newStatus });
      loadUnits();
      if (unitDetails && unitDetails.unit.id === unit.id) {
        const refreshed = await api.getUnit(unit.id);
        setUnitDetails(refreshed);
      }
      setNotification({
        type: 'success',
        message: `Unit ${unit.unitNumber} status changed to ${newStatus}.`,
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: `Status update failed: ${err.message}`,
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  return (
    <div id="units-view" className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          id="unit-notification"
          className={`p-3 text-xs font-semibold rounded-lg flex items-center justify-between transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs font-bold hover:opacity-75 ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Filter Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200">
        <form onSubmit={handleSearch} className="relative flex-1 w-full lg:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="unit-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search unit number, type..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Building Filter */}
          <select
            id="unit-building-filter"
            value={selectedBuildingId}
            onChange={(e) => {
              setSelectedBuildingId(e.target.value);
              setSelectedFloorId('ALL');
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Buildings</option>
            {buildingsList.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>

          {/* Floor Filter (available when building is chosen) */}
          {selectedBuildingId !== 'ALL' && filterFloorsList.length > 0 && (
            <select
              id="unit-floor-filter"
              value={selectedFloorId}
              onChange={(e) => setSelectedFloorId(e.target.value)}
              className="text-xs bg-slate-50 border border-indigo-200 rounded-lg py-1.5 px-3 text-indigo-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              <option value="ALL">All Floors ({filterFloorsList.length})</option>
              {filterFloorsList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.floorName} (Level {f.floorNumber})
                </option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          <select
            id="unit-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="OCCUPIED">Occupied</option>
            <option value="VACANT">Vacant</option>
            <option value="RESERVED">Reserved</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>

          {/* Type Filter */}
          <select
            id="unit-type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Unit Types</option>
            <option value="Office">Office</option>
            <option value="Retail">Retail</option>
            <option value="Apartment">Apartment</option>
            <option value="Penthouse">Penthouse</option>
            <option value="Storage">Storage</option>
            <option value="Medical">Medical</option>
            <option value="Commercial">Commercial</option>
          </select>

          {hasPermission('unit.create') && (
            <button
              id="create-unit-button"
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0 ml-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Unit</span>
            </button>
          )}
        </div>
      </div>

      {/* Units Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading units registry...</div>
        ) : unitsList.length === 0 ? (
          <div className="py-16 text-center p-6">
            <Grid3X3 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">No units match your criteria</h3>
            <p className="text-xs text-slate-500 mt-1">Try broadening your search or filter selections.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Unit #</th>
                  <th className="py-3 px-4">Building & Floor</th>
                  <th className="py-3 px-4">Type & Area</th>
                  <th className="py-3 px-4">Monthly Rent</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Current Tenant</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unitsList.map((unit) => {
                  return (
                    <tr
                      key={unit.id}
                      id={`unit-row-${unit.id}`}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <button
                          onClick={() => openDetailModal(unit)}
                          className="hover:text-indigo-600 hover:underline"
                        >
                          Unit {unit.unitNumber}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{unit.building?.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {unit.floor?.floorName || `Floor ${unit.floor?.floorNumber}`}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{unit.unitType}</div>
                        <div className="text-[11px] text-slate-400">{unit.area} sqm</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900">
                          {parseFloat(unit.monthlyRent).toLocaleString()} ETB
                        </span>
                        <div className="text-[10px] text-slate-400">
                          Deposit: {parseFloat(unit.depositAmount).toLocaleString()} ETB
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge status={unit.status} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        {unit.currentTenant ? (
                          <div className="flex items-center gap-1.5 text-slate-800">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-medium truncate max-w-[140px]">
                              {unit.currentTenant.fullName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">None (Vacant)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {onNavigate3D && (
                            <button
                              type="button"
                              onClick={() => onNavigate3D(unit.buildingId, unit.floorId, unit.id)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                              title="View in 3D"
                            >
                              <Box className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openDetailModal(unit)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded"
                            title="Inspect details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {hasPermission('unit.update') && (
                            <button
                              type="button"
                              onClick={() => openEditModal(unit)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                              title="Edit unit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission('unit.delete') && (
                            <button
                              type="button"
                              onClick={() => handleDelete(unit)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                              title="Delete unit"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE UNIT MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          onCloseCreateModalInitial?.();
        }}
        title="Add New Unit"
        subtitle="Specify space specifications, dimensions, and rental pricing."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Building *</label>
              <select
                required
                value={formData.buildingId}
                onChange={(e) => handleBuildingChange(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="" disabled>Select Building</option>
                {buildingsList.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Floor *</label>
              <select
                required
                value={formData.floorId}
                onChange={(e) => setFormData({ ...formData, floorId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="" disabled>Select Floor</option>
                {availableFloors.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.floorName} (Level {f.floorNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Number *</label>
              <input
                type="text"
                required
                value={formData.unitNumber}
                onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                placeholder="e.g. 402"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Type *</label>
              <select
                value={formData.unitType}
                onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="Office">Office</option>
                <option value="Retail">Retail</option>
                <option value="Apartment">Apartment</option>
                <option value="Penthouse">Penthouse</option>
                <option value="Storage">Storage</option>
                <option value="Medical">Medical</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Area (sqm)</label>
              <input
                type="number"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Rent (ETB) *</label>
              <input
                type="number"
                required
                value={formData.monthlyRent}
                onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Security Deposit (ETB)</label>
              <input
                type="number"
                value={formData.depositAmount}
                onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="VACANT">Vacant</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="RESERVED">Reserved</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bedrooms / Rooms</label>
              <input
                type="number"
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bathrooms</label>
              <input
                type="number"
                value={formData.bathrooms}
                onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Notes</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Corner unit with panoramic road frontage..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Unit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT UNIT MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Unit ${selectedUnit?.unitNumber}`}
        subtitle={`${selectedUnit?.building?.name} • Floor ${selectedUnit?.floor?.floorNumber}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Number</label>
              <input
                type="text"
                required
                value={formData.unitNumber}
                onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Type</label>
              <select
                value={formData.unitType}
                onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="Office">Office</option>
                <option value="Retail">Retail</option>
                <option value="Apartment">Apartment</option>
                <option value="Penthouse">Penthouse</option>
                <option value="Storage">Storage</option>
                <option value="Medical">Medical</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="VACANT">Vacant</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="RESERVED">Reserved</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Rent (ETB)</label>
              <input
                type="number"
                required
                value={formData.monthlyRent}
                onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Deposit (ETB)</label>
              <input
                type="number"
                value={formData.depositAmount}
                onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* UNIT FULL DETAILS MODAL */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Unit ${selectedUnit?.unitNumber} Profile`}
        subtitle={`${selectedUnit?.building?.name} • Level ${selectedUnit?.floor?.floorNumber} • ${selectedUnit?.unitType}`}
        maxWidth="4xl"
      >
        {unitDetails ? (
          <div className="space-y-4">
            {/* Quick Status Bar */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Operational Status:</span>
                <Badge status={unitDetails.unit.status} />
              </div>

              {hasPermission('unit.update') && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 mr-1">Switch:</span>
                  {(['VACANT', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleQuickStatusChange(unitDetails.unit, st)}
                      disabled={unitDetails.unit.status === st}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                        unitDetails.unit.status === st
                          ? 'bg-slate-900 text-white border-slate-900 opacity-50 cursor-default'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-medium text-slate-600">
              <button
                type="button"
                onClick={() => setDetailTab('info')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  detailTab === 'info' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'
                }`}
              >
                Specifications
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('tenant')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  detailTab === 'tenant' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'
                }`}
              >
                Current Lease ({unitDetails.tenant ? '1 Active' : 'None'})
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('payments')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  detailTab === 'payments' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'
                }`}
              >
                Payments ({unitDetails.payments.length})
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('maintenance')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  detailTab === 'maintenance' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'
                }`}
              >
                Maintenance ({unitDetails.maintenance.length})
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('docs')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  detailTab === 'docs' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'
                }`}
              >
                Documents ({unitDetails.documents.length})
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('audit')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  detailTab === 'audit' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'
                }`}
              >
                Audit Log ({unitDetails.activity.length})
              </button>
            </div>

            {/* Tab: Specs */}
            {detailTab === 'info' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <div className="text-[10px] text-slate-400">Total Floor Area</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{unitDetails.unit.area} sqm</div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <div className="text-[10px] text-slate-400">Contracted Rent</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {parseFloat(unitDetails.unit.monthlyRent).toLocaleString()} ETB/mo
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <div className="text-[10px] text-slate-400">Required Deposit</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {parseFloat(unitDetails.unit.depositAmount).toLocaleString()} ETB
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <div className="text-[10px] text-slate-400">Rooms & Baths</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {unitDetails.unit.bedrooms} Rms / {unitDetails.unit.bathrooms} Bath
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Tenant */}
            {detailTab === 'tenant' && (
              <div>
                {unitDetails.tenant ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-slate-900">{unitDetails.tenant.fullName}</div>
                        <div className="text-slate-500 text-[11px]">{unitDetails.tenant.phone} • {unitDetails.tenant.email}</div>
                      </div>
                      <Badge status="OCCUPIED" />
                    </div>
                    {unitDetails.contract && (
                      <div className="pt-3 border-t border-slate-200 grid grid-cols-3 gap-2">
                        <div>
                          <div className="text-[10px] text-slate-400">Agreement #</div>
                          <div className="font-semibold text-slate-800">{unitDetails.contract.contractNumber}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">Lease Period</div>
                          <div className="font-semibold text-slate-800">
                            {unitDetails.contract.startDate} to {unitDetails.contract.endDate}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">Monthly Rent</div>
                          <div className="font-semibold text-slate-800">
                            {parseFloat(unitDetails.contract.monthlyRent).toLocaleString()} ETB
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No active tenant lease is currently registered for this unit.
                  </div>
                )}
              </div>
            )}

            {/* Tab: Payments */}
            {detailTab === 'payments' && (
              <div className="divide-y divide-slate-100 text-xs">
                {unitDetails.payments.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">No payment records found.</div>
                ) : (
                  unitDetails.payments.map((p) => (
                    <div key={p.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-900">{p.paymentNumber}</span>
                        <div className="text-[11px] text-slate-400">
                          {p.paymentDate} • {p.paymentMethod}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">{parseFloat(p.amount).toLocaleString()} ETB</div>
                        <Badge status={p.status} size="sm" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab: Maintenance */}
            {detailTab === 'maintenance' && (
              <div className="divide-y divide-slate-100 text-xs">
                {unitDetails.maintenance.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">No maintenance tickets reported for this unit.</div>
                ) : (
                  unitDetails.maintenance.map((m) => (
                    <div key={m.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{m.title}</div>
                        <div className="text-[11px] text-slate-500">{m.description}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge status={m.priority} size="sm" />
                        <Badge status={m.status} size="sm" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab: Audit Log */}
            {detailTab === 'audit' && (
              <div className="divide-y divide-slate-100 text-xs max-h-60 overflow-y-auto">
                {unitDetails.activity.map((a) => (
                  <div key={a.id} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800">{a.action}</span>
                      <span className="text-slate-400 text-[11px] ml-2">by {a.userEmail || 'System'}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{new Date(a.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">Loading unit data...</div>
        )}
      </Modal>

      {/* SAFE DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={!!deleteConfirmUnit}
        onClose={() => {
          if (!isDeleting) {
            setDeleteConfirmUnit(null);
            setDeleteError(null);
          }
        }}
        title="Confirm Unit Deletion"
        subtitle={`Action for Unit ${deleteConfirmUnit?.unitNumber} (${deleteConfirmUnit?.unitType})`}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Soft Deletion & Integrity Notice</p>
              <p className="mt-1 text-[11px] text-amber-800 leading-relaxed">
                Archiving this unit sets its status to inactive. Units with active lease agreements
                or pending transactions cannot be deleted.
              </p>
            </div>
          </div>

          {deleteError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium">
              <p className="font-bold mb-0.5">Cannot Archive Unit</p>
              <p>{deleteError}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => {
                setDeleteConfirmUnit(null);
                setDeleteError(null);
              }}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleConfirmDeleteUnit}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              {isDeleting ? (
                <span>Archiving...</span>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirm Archive</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
