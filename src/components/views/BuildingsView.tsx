import React, { useEffect, useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Layers,
  DoorOpen,
  Eye,
  Edit2,
  Trash2,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Box,
} from 'lucide-react';
import { api } from '../../api/client.ts';
import { Building, Floor, Unit, Tenant, Contract, Document, MaintenanceRequest } from '../../types/index.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface BuildingsViewProps {
  onSelectBuildingForUnits?: (buildingId: string, floorId?: string) => void;
  onNavigateUnits?: (buildingId: string, floorId?: string) => void;
  onNavigate3D?: (buildingId: string) => void;
  showCreateModalInitial?: boolean;
  onCloseCreateModalInitial?: () => void;
}

export const BuildingsView: React.FC<BuildingsViewProps> = ({
  onSelectBuildingForUnits,
  onNavigateUnits,
  onNavigate3D,
  showCreateModalInitial,
  onCloseCreateModalInitial,
}) => {
  const handleUnitsNavigation = onSelectBuildingForUnits || onNavigateUnits;
  const { hasPermission } = useAuth();
  const [buildingsList, setBuildingsList] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(showCreateModalInitial || false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [buildingDetails, setBuildingDetails] = useState<{
    building: Building;
    floors: Floor[];
    units: Unit[];
    tenants: Tenant[];
    contracts: Contract[];
    maintenance: MaintenanceRequest[];
    documents: Document[];
  } | null>(null);
  const [detailsTab, setDetailsTab] = useState<'floors' | 'units' | 'tenants' | 'docs' | 'maintenance'>('floors');

  // Delete Confirmation State
  const [deleteConfirmBuilding, setDeleteConfirmBuilding] = useState<Building | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Floor Quick Add State
  const [isAddFloorOpen, setIsAddFloorOpen] = useState(false);
  const [floorFormData, setFloorFormData] = useState({
    floorNumber: 1,
    floorName: '',
    description: '',
  });
  const [floorFormError, setFloorFormError] = useState<string | null>(null);
  const [submittingFloor, setSubmittingFloor] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: 'Addis Ababa',
    numberOfFloors: 5,
    description: '',
    status: 'ACTIVE',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (showCreateModalInitial) {
      setIsCreateOpen(true);
    }
  }, [showCreateModalInitial]);

  useEffect(() => {
    loadBuildings();
  }, [statusFilter]);

  const loadBuildings = async () => {
    try {
      setLoading(true);
      const data = await api.getBuildings(search, statusFilter);
      setBuildingsList(data);
    } catch (err: any) {
      console.error('Failed to load buildings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadBuildings();
  };

  const openCreateModal = () => {
    setFormData({
      name: '',
      code: '',
      address: '',
      city: 'Addis Ababa',
      numberOfFloors: 5,
      description: '',
      status: 'ACTIVE',
    });
    setFormError(null);
    setIsCreateOpen(true);
  };

  const openEditModal = (b: Building) => {
    setSelectedBuilding(b);
    setFormData({
      name: b.name,
      code: b.code,
      address: b.address,
      city: b.city,
      numberOfFloors: b.numberOfFloors,
      description: b.description || '',
      status: b.status,
    });
    setFormError(null);
    setIsEditOpen(true);
  };

  const openDetailDrawer = async (b: Building) => {
    setSelectedBuilding(b);
    setIsDetailOpen(true);
    try {
      const details = await api.getBuilding(b.id);
      setBuildingDetails(details);
    } catch (err) {
      console.error('Failed to load building details:', err);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      setSubmitting(true);
      await api.createBuilding(formData);
      setIsCreateOpen(false);
      onCloseCreateModalInitial?.();
      loadBuildings();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create building');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuilding) return;
    setFormError(null);
    try {
      setSubmitting(true);
      await api.updateBuilding(selectedBuilding.id, formData);
      setIsEditOpen(false);
      loadBuildings();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update building');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (bldg: Building) => {
    setDeleteConfirmBuilding(bldg);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmBuilding) return;
    try {
      setIsDeleting(true);
      setDeleteError(null);
      await api.deleteBuilding(deleteConfirmBuilding.id);
      setDeleteConfirmBuilding(null);
      setNotification({
        type: 'success',
        message: `Building "${deleteConfirmBuilding.name}" archived successfully.`,
      });
      setTimeout(() => setNotification(null), 4000);
      loadBuildings();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete building');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddFloorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuilding) return;
    try {
      setSubmittingFloor(true);
      setFloorFormError(null);
      await api.createFloor(selectedBuilding.id, floorFormData);
      setIsAddFloorOpen(false);
      // Reload building details to show new floor
      const refreshed = await api.getBuilding(selectedBuilding.id);
      setBuildingDetails(refreshed);
      // Reload buildings list to refresh unit/floor stats
      loadBuildings();
    } catch (err: any) {
      setFloorFormError(err.message || 'Failed to add floor');
    } finally {
      setSubmittingFloor(false);
    }
  };

  return (
    <div id="buildings-view" className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          id="building-notification"
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="building-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, code, or address..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
          />
        </form>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            id="building-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="UNDER_MAINTENANCE">Maintenance</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          {hasPermission('building.create') && (
            <button
              id="create-building-button"
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Building</span>
            </button>
          )}
        </div>
      </div>

      {/* Buildings Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading buildings directory...</div>
      ) : buildingsList.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200 p-8">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-900">No properties found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Get started by adding your first building to structure floors, spaces, and tenant leases.
          </p>
          {hasPermission('building.create') && (
            <button
              onClick={openCreateModal}
              className="mt-4 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700"
            >
              Add Building Now
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {buildingsList.map((bldg) => {
            const occupancy = bldg.occupancyRate || 0;
            return (
              <div
                key={bldg.id}
                id={`building-card-${bldg.id}`}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {bldg.code}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1.5">{bldg.name}</h3>
                    </div>
                    <Badge status={bldg.status} size="sm" />
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{bldg.address}, {bldg.city}</span>
                  </div>

                  {bldg.description && (
                    <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                      {bldg.description}
                    </p>
                  )}

                  {/* Structural & Occupancy Metrics */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-slate-400" />
                      <div>
                        <div className="text-[10px] text-slate-400">Structure</div>
                        <div className="font-semibold text-slate-900">{bldg.numberOfFloors} Floors</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DoorOpen className="w-4 h-4 text-slate-400" />
                      <div>
                        <div className="text-[10px] text-slate-400">Total Units</div>
                        <div className="font-semibold text-slate-900">{bldg.unitsCount || bldg.totalUnits} Units</div>
                      </div>
                    </div>
                  </div>

                  {/* Occupancy Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-500 font-medium">Occupancy</span>
                      <span className="font-bold text-slate-800">{occupancy}% ({bldg.occupiedCount || 0} leased)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          occupancy >= 80 ? 'bg-emerald-500' : occupancy >= 50 ? 'bg-indigo-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${occupancy}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => openDetailDrawer(bldg)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Profile</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {onNavigate3D && (
                      <button
                        type="button"
                        onClick={() => onNavigate3D(bldg.id)}
                        className="px-2 py-1 text-[11px] font-medium text-indigo-700 hover:bg-indigo-50 bg-indigo-50/50 border border-indigo-200/60 rounded flex items-center gap-1 transition-colors"
                        title="View building in 3D"
                      >
                        <Box className="w-3 h-3 text-indigo-600" />
                        <span>3D View</span>
                      </button>
                    )}
                    {handleUnitsNavigation && (
                      <button
                        type="button"
                        onClick={() => handleUnitsNavigation(bldg.id)}
                        className="px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-200 rounded"
                      >
                        Browse Units
                      </button>
                    )}
                    {hasPermission('building.update') && (
                      <button
                        type="button"
                        onClick={() => openEditModal(bldg)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded"
                        title="Edit building"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {hasPermission('building.delete') && (
                      <button
                        type="button"
                        onClick={() => handleDelete(bldg)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Delete building"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE BUILDING MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          onCloseCreateModalInitial?.();
        }}
        title="Add New Building / Property"
        subtitle="Register a new building and generate floor structures."
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Building Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Apex Central Plaza"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Building Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. ACP-01"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Address *</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g. Bole Road, Olympia area"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Addis Ababa"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Floors *</label>
              <input
                type="number"
                min="1"
                max="50"
                required
                value={formData.numberOfFloors}
                onChange={(e) => setFormData({ ...formData, numberOfFloors: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Will automatically scaffold floor records.</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="ACTIVE">Active</option>
                <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Notes</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Commercial hub with retail bank on ground floor..."
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
              {submitting ? 'Creating Property...' : 'Create Building'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT BUILDING MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Building Details"
        subtitle={selectedBuilding?.name}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Building Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Building Code</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg uppercase focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="ACTIVE">Active</option>
                <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
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

      {/* BUILDING FULL PROFILE DRAWER / MODAL */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedBuilding?.name || 'Building Profile'}
        subtitle={`${selectedBuilding?.code} • ${selectedBuilding?.address}, ${selectedBuilding?.city}`}
        maxWidth="4xl"
      >
        {buildingDetails ? (
          <div className="space-y-4">
            {/* Header Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-medium text-slate-600">
              <button
                type="button"
                onClick={() => setDetailsTab('floors')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  detailsTab === 'floors' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'
                }`}
              >
                Floors ({buildingDetails.floors.length})
              </button>
              <button
                type="button"
                onClick={() => setDetailsTab('units')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  detailsTab === 'units' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'
                }`}
              >
                Units ({buildingDetails.units.length})
              </button>
              <button
                type="button"
                onClick={() => setDetailsTab('tenants')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  detailsTab === 'tenants' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'
                }`}
              >
                Tenants ({buildingDetails.tenants.length})
              </button>
              <button
                type="button"
                onClick={() => setDetailsTab('docs')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  detailsTab === 'docs' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'
                }`}
              >
                Documents ({buildingDetails.documents.length})
              </button>
              <button
                type="button"
                onClick={() => setDetailsTab('maintenance')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  detailsTab === 'maintenance' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'
                }`}
              >
                Maintenance ({buildingDetails.maintenance.length})
              </button>
            </div>

            {/* Tab Contents */}
            {detailsTab === 'floors' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">
                    Configured levels in this building ({buildingDetails.floors.length})
                  </span>
                  {hasPermission('building.update') && (
                    <button
                      type="button"
                      onClick={() => {
                        const nextNum =
                          buildingDetails.floors.length > 0
                            ? Math.max(...buildingDetails.floors.map((f) => f.floorNumber)) + 1
                            : 1;
                        setFloorFormData({
                          floorNumber: nextNum,
                          floorName: `Floor ${nextNum}`,
                          description: `Level ${nextNum}`,
                        });
                        setFloorFormError(null);
                        setIsAddFloorOpen(!isAddFloorOpen);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAddFloorOpen ? 'Cancel' : 'Add Floor'}</span>
                    </button>
                  )}
                </div>

                {/* Add Floor Inline Form */}
                {isAddFloorOpen && (
                  <form
                    onSubmit={handleAddFloorSubmit}
                    className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg space-y-3 text-xs"
                  >
                    <div className="font-semibold text-indigo-950">Configure New Floor</div>
                    {floorFormError && (
                      <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded text-xs">
                        {floorFormError}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-600 font-medium mb-1">Floor Level # *</label>
                        <input
                          type="number"
                          required
                          value={floorFormData.floorNumber}
                          onChange={(e) =>
                            setFloorFormData({
                              ...floorFormData,
                              floorNumber: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-medium mb-1">Floor Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Ground Floor or Floor 3"
                          value={floorFormData.floorName}
                          onChange={(e) =>
                            setFloorFormData({ ...floorFormData, floorName: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-medium mb-1">Description</label>
                        <input
                          type="text"
                          placeholder="e.g. Executive Suites"
                          value={floorFormData.description}
                          onChange={(e) =>
                            setFloorFormData({ ...floorFormData, description: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddFloorOpen(false)}
                        className="px-3 py-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingFloor}
                        className="px-3 py-1 bg-indigo-600 text-white hover:bg-indigo-700 rounded font-semibold disabled:opacity-50"
                      >
                        {submittingFloor ? 'Adding...' : 'Save Floor'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Floor List */}
                <div className="divide-y divide-slate-100">
                  {buildingDetails.floors.length === 0 ? (
                    <div className="py-6 text-center text-slate-400">No floors added yet.</div>
                  ) : (
                    buildingDetails.floors.map((fl) => {
                      const floorUnits = buildingDetails.units.filter((u) => u.floorId === fl.id);
                      return (
                        <div
                          key={fl.id}
                          className="py-2.5 px-3 hover:bg-slate-50 rounded-lg flex items-center justify-between transition-colors"
                        >
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span>{fl.floorName}</span>
                              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                Level {fl.floorNumber}
                              </span>
                            </div>
                            <div className="text-slate-500 text-[11px] mt-0.5">
                              {fl.description || `Floor level ${fl.floorNumber}`}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full text-xs">
                              {floorUnits.length} units
                            </span>
                            {handleUnitsNavigation && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsDetailOpen(false);
                                  handleUnitsNavigation(selectedBuilding.id, fl.id);
                                }}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-colors"
                                title={`View units on ${fl.floorName}`}
                              >
                                <span>View Units</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {detailsTab === 'units' && (
              <div className="divide-y divide-slate-100 text-xs">
                {buildingDetails.units.map((u) => (
                  <div key={u.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">Unit {u.unitNumber}</span>
                      <span className="text-slate-500 ml-2">({u.unitType})</span>
                      <div className="text-[11px] text-slate-400">
                        {u.area} sqm • {parseFloat(u.monthlyRent).toLocaleString()} ETB/mo
                      </div>
                    </div>
                    <Badge status={u.status} size="sm" />
                  </div>
                ))}
              </div>
            )}

            {detailsTab === 'tenants' && (
              <div className="divide-y divide-slate-100 text-xs">
                {buildingDetails.tenants.length === 0 ? (
                  <div className="py-6 text-center text-slate-400">No active tenants in this building yet.</div>
                ) : (
                  buildingDetails.tenants.map((t) => (
                    <div key={t.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{t.fullName}</div>
                        <div className="text-[11px] text-slate-500">{t.phone} • {t.email}</div>
                      </div>
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                        Active Tenant
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {detailsTab === 'docs' && (
              <div className="divide-y divide-slate-100 text-xs">
                {buildingDetails.documents.length === 0 ? (
                  <div className="py-6 text-center text-slate-400">No documents attached to this building.</div>
                ) : (
                  buildingDetails.documents.map((d) => (
                    <div key={d.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <div>
                          <div className="font-medium text-slate-900">{d.fileName}</div>
                          <div className="text-[11px] text-slate-400">
                            {Math.round(d.fileSize / 1024)} KB • Attached {new Date(d.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline flex items-center gap-1 text-[11px]"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))
                )}
              </div>
            )}

            {detailsTab === 'maintenance' && (
              <div className="divide-y divide-slate-100 text-xs">
                {buildingDetails.maintenance.length === 0 ? (
                  <div className="py-6 text-center text-slate-400">No maintenance tickets recorded.</div>
                ) : (
                  buildingDetails.maintenance.map((m) => (
                    <div key={m.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{m.title}</div>
                        <div className="text-[11px] text-slate-500">{m.description}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge status={m.priority} size="sm" />
                        <Badge status={m.status} size="sm" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">Loading building records...</div>
        )}
      </Modal>

      {/* SAFE DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={!!deleteConfirmBuilding}
        onClose={() => {
          if (!isDeleting) {
            setDeleteConfirmBuilding(null);
            setDeleteError(null);
          }
        }}
        title="Confirm Building Deletion"
        subtitle={`Action for ${deleteConfirmBuilding?.name} (${deleteConfirmBuilding?.code})`}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Soft Delete Policy & Cascade Rules</p>
              <p className="mt-1 text-[11px] text-amber-800 leading-relaxed">
                Archiving this building will soft-delete all associated floors and units. Active
                lease contracts and occupied units block deletion to prevent orphan business records.
              </p>
            </div>
          </div>

          {deleteError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium">
              <p className="font-bold mb-0.5">Cannot Archive Building</p>
              <p>{deleteError}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => {
                setDeleteConfirmBuilding(null);
                setDeleteError(null);
              }}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
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
