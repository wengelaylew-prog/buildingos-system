import React, { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Building2,
  DoorOpen,
  Eye,
  Edit2,
  Trash2,
  FileText,
  AlertCircle,
  CreditCard,
  Wrench,
  Shield,
  Upload,
} from 'lucide-react';
import { api } from '../../api/client.ts';
import { Tenant, Unit, Building, Contract, Payment, MaintenanceRequest, Document, AuditLog } from '../../types/index.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface TenantsViewProps {
  showCreateModalInitial?: boolean;
  onCloseCreateModalInitial?: () => void;
}

export const TenantsView: React.FC<TenantsViewProps> = ({
  showCreateModalInitial,
  onCloseCreateModalInitial,
}) => {
  const { hasPermission } = useAuth();
  const [tenantsList, setTenantsList] = useState<Tenant[]>([]);
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals & Details
  const [isCreateOpen, setIsCreateOpen] = useState(showCreateModalInitial || false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [tenantDetails, setTenantDetails] = useState<{
    tenant: Tenant;
    unit: Unit | null;
    building: Building | null;
    currentLease: Contract | null;
    contracts: Contract[];
    paymentHistory: Payment[];
    documents: Document[];
    maintenance: MaintenanceRequest[];
    activity: AuditLog[];
  } | null>(null);
  const [detailTab, setDetailTab] = useState<'profile' | 'lease' | 'payments' | 'docs' | 'maintenance'>('profile');

  // Form
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    idType: 'National ID',
    idNumber: '',
    address: '',
    emergencyContact: '',
    notes: '',
    assignedUnitId: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (showCreateModalInitial) {
      openCreateModal();
    }
  }, [showCreateModalInitial]);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const data = await api.getTenants(search);
      setTenantsList(data);
    } catch (err) {
      console.error('Failed to load tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadTenants();
  };

  const openCreateModal = async () => {
    setFormData({
      fullName: '',
      phone: '',
      email: '',
      idType: 'National ID',
      idNumber: '',
      address: 'Addis Ababa',
      emergencyContact: '',
      notes: '',
      assignedUnitId: '',
    });

    try {
      // Load vacant units for optional immediate placement
      const units = await api.getUnits({ status: 'VACANT' });
      setAvailableUnits(units);
    } catch (err) {
      console.error('Failed to load vacant units:', err);
    }

    setFormError(null);
    setIsCreateOpen(true);
  };

  const openEditModal = (t: Tenant) => {
    setSelectedTenant(t);
    setFormData({
      fullName: t.fullName,
      phone: t.phone,
      email: t.email,
      idType: t.idType,
      idNumber: t.idNumber,
      address: t.address || '',
      emergencyContact: t.emergencyContact || '',
      notes: t.notes || '',
      assignedUnitId: '',
    });
    setFormError(null);
    setIsEditOpen(true);
  };

  const openDetailModal = async (t: Tenant) => {
    setSelectedTenant(t);
    setIsDetailOpen(true);
    try {
      const details = await api.getTenant(t.id);
      setTenantDetails(details);
    } catch (err) {
      console.error('Failed to load tenant profile details:', err);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      setSubmitting(true);
      await api.createTenant(formData);
      setIsCreateOpen(false);
      onCloseCreateModalInitial?.();
      loadTenants();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create tenant profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;
    setFormError(null);
    try {
      setSubmitting(true);
      await api.updateTenant(selectedTenant.id, formData);
      setIsEditOpen(false);
      loadTenants();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update tenant');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove tenant "${name}"? Active leases will need manual review.`)) return;
    try {
      await api.deleteTenant(id);
      loadTenants();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div id="tenants-view" className="space-y-6">
      {/* Top Search & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200">
        <form onSubmit={handleSearch} className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="tenant-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenant name, phone, email, unit..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
          />
        </form>

        {hasPermission('tenant.create') && (
          <button
            id="create-tenant-button"
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Tenant</span>
          </button>
        )}
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading occupants directory...</div>
        ) : tenantsList.length === 0 ? (
          <div className="py-16 text-center p-6">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">No tenants found</h3>
            <p className="text-xs text-slate-500 mt-1">Add tenants to link them to units and lease contracts.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Tenant Name</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">ID Reference</th>
                  <th className="py-3 px-4">Assigned Property & Unit</th>
                  <th className="py-3 px-4">Lease Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenantsList.map((t) => (
                  <tr key={t.id} id={`tenant-row-${t.id}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => openDetailModal(t)}
                        className="font-bold text-slate-900 hover:text-indigo-600 hover:underline flex items-center gap-2"
                      >
                        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {t.fullName.charAt(0)}
                        </div>
                        <span>{t.fullName}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-800">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{t.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{t.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{t.idType}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{t.idNumber}</div>
                    </td>
                    <td className="py-3 px-4">
                      {t.unit ? (
                        <div>
                          <span className="font-semibold text-slate-900">Unit {t.unit.unitNumber}</span>
                          <div className="text-[11px] text-slate-400">{t.building?.name}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No Unit Assigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={t.leaseStatus || 'ACTIVE'} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openDetailModal(t)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {hasPermission('tenant.update') && (
                          <button
                            type="button"
                            onClick={() => openEditModal(t)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                            title="Edit Tenant"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {hasPermission('tenant.delete') && (
                          <button
                            type="button"
                            onClick={() => handleDelete(t.id, t.fullName)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Remove Tenant"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE TENANT MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          onCloseCreateModalInitial?.();
        }}
        title="Register New Tenant"
        subtitle="Collect tenant contact, legal identification, and unit placement."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="e.g. Almaz Bekele"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+251 91 234 5678"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="tenant@example.com"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ID Document Type *</label>
              <select
                value={formData.idType}
                onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="National ID">National ID (Fayda / Kebele)</option>
                <option value="Passport">International Passport</option>
                <option value="Business License">Commercial Registration / TIN</option>
                <option value="Driver License">Driver License</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ID / Reg Number *</label>
              <input
                type="text"
                required
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                placeholder="e.g. ET-NID-884920"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact</label>
              <input
                type="text"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                placeholder="Name, relation & phone"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Vacant Space (Optional)</label>
              <select
                value={formData.assignedUnitId}
                onChange={(e) => setFormData({ ...formData, assignedUnitId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="">Do not assign unit now</option>
                {availableUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    Unit {u.unitNumber} ({u.unitType}) - {u.building?.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Background</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Verified commercial enterprise with good credit standing..."
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
              {submitting ? 'Registering...' : 'Register Tenant'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT TENANT MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Tenant Profile: ${selectedTenant?.fullName}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ID Document Type</label>
              <select
                value={formData.idType}
                onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="National ID">National ID</option>
                <option value="Passport">Passport</option>
                <option value="Business License">Business License</option>
                <option value="Driver License">Driver License</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ID Number</label>
              <input
                type="text"
                required
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact</label>
            <input
              type="text"
              value={formData.emergencyContact}
              onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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

      {/* TENANT FULL PROFILE MODAL */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedTenant?.fullName || 'Tenant Profile'}
        subtitle={`${selectedTenant?.idType}: ${selectedTenant?.idNumber} • ${selectedTenant?.phone}`}
        maxWidth="4xl"
      >
        {tenantDetails ? (
          <div className="space-y-4">
            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-medium text-slate-600">
              <button
                type="button"
                onClick={() => setDetailTab('profile')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  detailTab === 'profile' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'
                }`}
              >
                Profile & Unit
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('lease')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  detailTab === 'lease' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'
                }`}
              >
                Lease Agreement
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('payments')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  detailTab === 'payments' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'
                }`}
              >
                Payments ({tenantDetails.paymentHistory.length})
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('docs')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  detailTab === 'docs' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'
                }`}
              >
                Documents ({tenantDetails.documents.length})
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('maintenance')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  detailTab === 'maintenance' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'
                }`}
              >
                Maintenance ({tenantDetails.maintenance.length})
              </button>
            </div>

            {/* Profile Tab */}
            {detailTab === 'profile' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Occupant Details
                    </span>
                    <div className="text-sm font-bold text-slate-900">{tenantDetails.tenant.fullName}</div>
                    <div className="text-slate-600">Phone: {tenantDetails.tenant.phone}</div>
                    <div className="text-slate-600">Email: {tenantDetails.tenant.email}</div>
                    <div className="text-slate-600">
                      Emergency: {tenantDetails.tenant.emergencyContact || 'None recorded'}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Current Space Assignment
                    </span>
                    {tenantDetails.unit ? (
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          Unit {tenantDetails.unit.unitNumber} ({tenantDetails.unit.unitType})
                        </div>
                        <div className="text-slate-600">{tenantDetails.building?.name}</div>
                        <div className="text-slate-600">
                          Rent: {parseFloat(tenantDetails.unit.monthlyRent).toLocaleString()} ETB/month
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-400 italic py-2">No unit currently occupied.</div>
                    )}
                  </div>
                </div>

                {tenantDetails.tenant.notes && (
                  <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg text-indigo-900">
                    <span className="font-semibold">Notes: </span>
                    <span>{tenantDetails.tenant.notes}</span>
                  </div>
                )}
              </div>
            )}

            {/* Lease Tab */}
            {detailTab === 'lease' && (
              <div>
                {tenantDetails.currentLease ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {tenantDetails.currentLease.contractNumber}
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          Lease from {tenantDetails.currentLease.startDate} to {tenantDetails.currentLease.endDate}
                        </div>
                      </div>
                      <Badge status={tenantDetails.currentLease.contractStatus} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                      <div>
                        <div className="text-[10px] text-slate-400">Monthly Rent</div>
                        <div className="text-sm font-bold text-slate-900">
                          {parseFloat(tenantDetails.currentLease.monthlyRent).toLocaleString()} ETB
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">Deposit Amount</div>
                        <div className="text-sm font-bold text-slate-900">
                          {parseFloat(tenantDetails.currentLease.deposit).toLocaleString()} ETB
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No active contract registered for this tenant.
                  </div>
                )}
              </div>
            )}

            {/* Payments Tab */}
            {detailTab === 'payments' && (
              <div className="divide-y divide-slate-100 text-xs">
                {tenantDetails.paymentHistory.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">No payment records found.</div>
                ) : (
                  tenantDetails.paymentHistory.map((p) => (
                    <div key={p.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-900">{p.paymentNumber}</div>
                        <div className="text-[11px] text-slate-400">{p.paymentDate} • {p.paymentMethod}</div>
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

            {/* Documents Tab */}
            {detailTab === 'docs' && (
              <div className="divide-y divide-slate-100 text-xs">
                {tenantDetails.documents.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">No documents uploaded for this tenant.</div>
                ) : (
                  tenantDetails.documents.map((d) => (
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
                      <a href={d.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                        Download
                      </a>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Maintenance Tab */}
            {detailTab === 'maintenance' && (
              <div className="divide-y divide-slate-100 text-xs">
                {tenantDetails.maintenance.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">No maintenance requests submitted.</div>
                ) : (
                  tenantDetails.maintenance.map((m) => (
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
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">Loading tenant profile...</div>
        )}
      </Modal>
    </div>
  );
};
