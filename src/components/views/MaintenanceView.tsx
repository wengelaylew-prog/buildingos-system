import React, { useEffect, useState } from 'react';
import {
  Wrench,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  AlertCircle,
  User,
} from 'lucide-react';
import { api } from '../../api/client.ts';
import { MaintenanceRequest, Building, Unit } from '../../types/index.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

export const MaintenanceView: React.FC = () => {
  const { hasPermission } = useAuth();
  const { t } = useLanguage();
  const [requestsList, setRequestsList] = useState<MaintenanceRequest[]>([]);
  const [buildingsList, setBuildingsList] = useState<Building[]>([]);
  const [unitsList, setUnitsList] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    buildingId: '',
    unitId: '',
    title: '',
    description: '',
    priority: 'MEDIUM',
    photoUrl: '',
  });
  
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [updateData, setUpdateData] = useState<any>({
    id: '',
    status: 'PENDING',
    contractorName: '',
    cost: '',
    isBillable: false,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reqs, bldgs, units] = await Promise.all([
        api.getMaintenance(),
        api.getBuildings(),
        api.getUnits(),
      ]);
      setRequestsList(reqs);
      setBuildingsList(bldgs);
      setUnitsList(units);
      if (bldgs.length > 0) {
        setFormData((prev) => ({ ...prev, buildingId: bldgs[0].id }));
      }
    } catch (err) {
      console.error('Failed to load maintenance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      setSubmitting(true);
      await api.createMaintenance(formData);
      setIsCreateOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to file maintenance request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      setSubmitting(true);
      const payload: any = { status: updateData.status };
      if (updateData.contractorName) payload.contractorName = updateData.contractorName;
      if (updateData.cost) payload.cost = Number(updateData.cost);
      payload.isBillable = updateData.isBillable;
      
      await api.updateMaintenance(updateData.id, payload);
      setIsUpdateOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update maintenance request');
    } finally {
      setSubmitting(false);
    }
  };

  const openUpdateModal = (req: any) => {
    setUpdateData({
      id: req.id,
      status: req.status || 'PENDING',
      contractorName: req.contractorName || '',
      cost: req.cost || '',
      isBillable: req.isBillable || false,
    });
    setIsUpdateOpen(true);
  };

  return (
    <div id="maintenance-view" className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{t('workOrdersTitle')}</h2>
          <p className="text-xs text-slate-500">{t('workOrdersDesc')}</p>
        </div>

        {hasPermission('maintenance.create') && (
          <button
            id="create-maintenance-button"
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t('newWorkOrder')}</span>
          </button>
        )}
      </div>

      {/* Requests Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading work orders...</div>
      ) : requestsList.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200 p-6 text-xs text-slate-400">
          No maintenance tickets active. All facilities operational.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requestsList.map((req) => (
            <div
              key={req.id}
              id={`maintenance-card-${req.id}`}
              className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{req.title}</h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge status={req.priority} size="sm" />
                    <Badge status={req.status} size="sm" />
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{req.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div>
                  <span className="font-semibold text-slate-800">{req.building?.name || 'Property'}</span>
                  {req.unit && <span className="ml-1 font-medium text-slate-600">• Unit {req.unit.unitNumber}</span>}
                </div>
                <div className="text-[11px] text-slate-400">
                  Reported by: <span className="font-medium text-slate-600">{req.reportedBy || 'Tenant'}</span>
                </div>
              </div>
              
              {hasPermission('maintenance.write') && (
                <div className="pt-2 border-t border-slate-100 text-right">
                  <button
                    onClick={() => openUpdateModal(req)}
                    className="text-xs text-indigo-600 font-medium hover:text-indigo-700"
                  >
                    {t('updateTicket')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CREATE WORK ORDER MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Dispatch New Work Order"
        subtitle="Submit a maintenance or repair ticket for a building or unit."
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
                onChange={(e) => setFormData({ ...formData, buildingId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              >
                {buildingsList.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit (Optional)</label>
              <select
                value={formData.unitId}
                onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="">General Building / Common Area</option>
                {unitsList
                  .filter((u) => !formData.buildingId || u.buildingId === formData.buildingId)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      Unit {u.unitNumber}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Executive HVAC temperature sensor calibration"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority Level</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="EMERGENCY">Emergency (Immediate)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
            <textarea
              rows={3}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe symptoms, location within the space, and any immediate hazard..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t('photoUrlPlaceholder')}</label>
            <input
              type="text"
              value={formData.photoUrl}
              onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
              placeholder="https://example.com/photo.jpg"
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
              {submitting ? 'Submitting...' : 'Register Ticket'}
            </button>
          </div>
        </form>
      </Modal>

      {/* UPDATE WORK ORDER MODAL */}
      <Modal
        isOpen={isUpdateOpen}
        onClose={() => setIsUpdateOpen(false)}
        title={t('updateTicket')}
        subtitle="Assign contractor, update status, and log repair costs."
      >
        <form onSubmit={handleUpdateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select
              value={updateData.status}
              onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            >
              <option value="PENDING">{t('statusPending')}</option>
              <option value="IN_PROGRESS">{t('statusInProgress')}</option>
              <option value="RESOLVED">{t('statusResolved')}</option>
              <option value="CANCELLED">{t('statusCancelled')}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t('assignContractor')}</label>
            <input
              type="text"
              value={updateData.contractorName}
              onChange={(e) => setUpdateData({ ...updateData, contractorName: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('enterCost')}</label>
              <input
                type="number"
                step="0.01"
                value={updateData.cost}
                onChange={(e) => setUpdateData({ ...updateData, cost: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div className="flex items-center mt-6">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateData.isBillable}
                  onChange={(e) => setUpdateData({ ...updateData, isBillable: e.target.checked })}
                  className="rounded-sm border-slate-300"
                />
                {t('markBillable')}
              </label>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsUpdateOpen(false)}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Updating...' : t('updateTicket')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
