import React, { useEffect, useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Building2,
  DoorOpen,
  User,
  Trash2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { api } from '../../api/client.ts';
import { Contract, Tenant, Unit, Building } from '../../types/index.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface ContractsViewProps {
  showCreateModalInitial?: boolean;
  onCloseCreateModalInitial?: () => void;
}

export const ContractsView: React.FC<ContractsViewProps> = ({
  showCreateModalInitial,
  onCloseCreateModalInitial,
}) => {
  const { hasPermission } = useAuth();
  const [contractsList, setContractsList] = useState<Contract[]>([]);
  const [tenantsList, setTenantsList] = useState<Tenant[]>([]);
  const [unitsList, setUnitsList] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(showCreateModalInitial || false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    tenantId: '',
    unitId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    monthlyRent: '',
    deposit: '',
    paymentFrequency: 'Monthly',
    contractStatus: 'ACTIVE',
    notes: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (showCreateModalInitial) {
      openCreateModal();
    }
  }, [showCreateModalInitial]);

  useEffect(() => {
    loadContracts();
  }, [statusFilter]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const data = await api.getContracts({ status: statusFilter, search });
      setContractsList(data);
    } catch (err) {
      console.error('Failed to load contracts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadContracts();
  };

  const openCreateModal = async () => {
    try {
      const [tenants, units] = await Promise.all([
        api.getTenants(),
        api.getUnits({ status: 'VACANT' }),
      ]);
      setTenantsList(tenants);
      setUnitsList(units);

      const firstUnit = units[0];
      setFormData({
        tenantId: tenants[0]?.id || '',
        unitId: firstUnit?.id || '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        monthlyRent: firstUnit ? firstUnit.monthlyRent : '35000',
        deposit: firstUnit ? firstUnit.depositAmount : '70000',
        paymentFrequency: 'Monthly',
        contractStatus: 'ACTIVE',
        notes: '',
      });
    } catch (err) {
      console.error('Failed to load dependencies for contract modal:', err);
    }

    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleUnitSelection = (unitId: string) => {
    const selected = unitsList.find((u) => u.id === unitId);
    setFormData((prev) => ({
      ...prev,
      unitId,
      monthlyRent: selected ? selected.monthlyRent : prev.monthlyRent,
      deposit: selected ? selected.depositAmount : prev.deposit,
    }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      setSubmitting(true);
      await api.createContract(formData);
      setIsCreateOpen(false);
      onCloseCreateModalInitial?.();
      loadContracts();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create contract');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTerminate = async (contract: Contract) => {
    if (
      !confirm(
        `Are you sure you want to terminate contract ${contract.contractNumber}? This will mark the contract as TERMINATED and restore Unit ${contract.unit?.unitNumber} to VACANT status.`
      )
    ) {
      return;
    }

    try {
      await api.updateContract(contract.id, { contractStatus: 'TERMINATED' });
      loadContracts();
    } catch (err: any) {
      alert(`Termination failed: ${err.message}`);
    }
  };

  const handleRenew = async (contract: Contract) => {
    const currentEnd = new Date(contract.endDate);
    const newEnd = new Date(currentEnd);
    newEnd.setFullYear(newEnd.getFullYear() + 1);

    if (
      !confirm(
        `Renew contract ${contract.contractNumber} for 1 additional year (until ${newEnd.toISOString().split('T')[0]})?`
      )
    ) {
      return;
    }

    try {
      await api.updateContract(contract.id, {
        endDate: newEnd.toISOString().split('T')[0],
        contractStatus: 'ACTIVE',
      });
      loadContracts();
    } catch (err: any) {
      alert(`Renewal failed: ${err.message}`);
    }
  };

  return (
    <div id="contracts-view" className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200">
        <form onSubmit={handleSearch} className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="contract-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agreement #, tenant, unit..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
          />
        </form>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            id="contract-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRING">Expiring Soon (&lt;30d)</option>
            <option value="EXPIRED">Expired</option>
            <option value="TERMINATED">Terminated</option>
          </select>

          {hasPermission('contract.create') && (
            <button
              id="create-contract-button"
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Contract</span>
            </button>
          )}
        </div>
      </div>

      {/* Contracts Registry Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading contracts registry...</div>
        ) : contractsList.length === 0 ? (
          <div className="py-16 text-center p-6">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">No contracts found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Create an agreement to assign a tenant to a unit with lease terms.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Contract #</th>
                  <th className="py-3 px-4">Tenant</th>
                  <th className="py-3 px-4">Assigned Unit</th>
                  <th className="py-3 px-4">Lease Period</th>
                  <th className="py-3 px-4">Monthly Rate</th>
                  <th className="py-3 px-4">Status & Days Left</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contractsList.map((contract) => {
                  const status = contract.calculatedStatus || contract.contractStatus;
                  const isExpiring = status === 'EXPIRING';
                  const isExpired = status === 'EXPIRED';

                  return (
                    <tr
                      key={contract.id}
                      id={`contract-row-${contract.id}`}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isExpiring ? 'bg-amber-50/20' : isExpired ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                        {contract.contractNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{contract.tenant?.fullName}</div>
                        <div className="text-[11px] text-slate-400">{contract.tenant?.phone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">Unit {contract.unit?.unitNumber}</div>
                        <div className="text-[11px] text-slate-400">{contract.building?.name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">
                          {contract.startDate} → {contract.endDate}
                        </div>
                        <div className="text-[10px] text-slate-400">{contract.paymentFrequency} billing</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900">
                          {parseFloat(contract.monthlyRent).toLocaleString()} ETB
                        </span>
                        <div className="text-[10px] text-slate-400">
                          Dep: {parseFloat(contract.deposit).toLocaleString()} ETB
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <Badge status={status} size="sm" />
                          {contract.daysRemaining !== undefined && status !== 'TERMINATED' && (
                            <span
                              className={`text-[10px] font-medium ${
                                contract.daysRemaining < 0
                                  ? 'text-rose-600'
                                  : contract.daysRemaining <= 30
                                  ? 'text-amber-600'
                                  : 'text-slate-400'
                              }`}
                            >
                              {contract.daysRemaining < 0
                                ? `Expired ${Math.abs(contract.daysRemaining)} days ago`
                                : `${contract.daysRemaining} days remaining`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {status !== 'TERMINATED' && hasPermission('contract.update') && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleRenew(contract)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px]"
                                title="Extend contract 1 year"
                              >
                                Renew
                              </button>
                              <button
                                type="button"
                                onClick={() => handleTerminate(contract)}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded text-[11px]"
                                title="Terminate Lease & Vacate Unit"
                              >
                                Terminate
                              </button>
                            </>
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

      {/* CREATE CONTRACT MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          onCloseCreateModalInitial?.();
        }}
        title="Execute Lease Contract"
        subtitle="Associate a tenant with an available unit, set dates, and finalize rent terms."
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tenant *</label>
              <select
                required
                value={formData.tenantId}
                onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="" disabled>Select Tenant</option>
                {tenantsList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName} ({t.phone})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit to Lease *</label>
              <select
                required
                value={formData.unitId}
                onChange={(e) => handleUnitSelection(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="" disabled>Select Vacant Unit</option>
                {unitsList.map((u) => (
                  <option key={u.id} value={u.id}>
                    Unit {u.unitNumber} ({u.unitType}) - {u.building?.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date *</label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                value={formData.deposit}
                onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Frequency</label>
              <select
                value={formData.paymentFrequency}
                onChange={(e) => setFormData({ ...formData, paymentFrequency: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Semi-Annual">Semi-Annual</option>
                <option value="Annual">Annual</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contract Notes / Terms</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Standard 12-month commercial tenancy with 60-day renewal notice..."
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
              {submitting ? 'Executing...' : 'Execute Agreement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
