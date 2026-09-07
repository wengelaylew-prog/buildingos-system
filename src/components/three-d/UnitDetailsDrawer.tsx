import React, { useEffect, useState } from 'react';
import {
  X,
  Building2,
  Layers,
  FileText,
  User,
  CreditCard,
  Wrench,
  ExternalLink,
  Plus,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../api/client.ts';
import { Unit, Building, Floor, Tenant, Contract, Payment, MaintenanceRequest } from '../../types/index.ts';
import { Badge } from '../common/Badge.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

interface UnitDetailsDrawerProps {
  unitId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateLeaseCreate?: (unitId: string, buildingId: string) => void;
  onNavigateTenant?: (tenantId: string) => void;
  onNavigateContract?: (contractId: string) => void;
}

export const UnitDetailsDrawer: React.FC<UnitDetailsDrawerProps> = ({
  unitId,
  isOpen,
  onClose,
  onNavigateLeaseCreate,
  onNavigateTenant,
  onNavigateContract,
}) => {
  const { hasPermission } = useAuth();
  const { t, isAmharic } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<{
    unit: Unit;
    building: Building;
    floor: Floor;
    tenant: Tenant | null;
    contract: Contract | null;
    payments: Payment[];
    maintenance: MaintenanceRequest[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'lease' | 'payments' | 'maintenance'>('info');

  useEffect(() => {
    if (!unitId || !isOpen) {
      setDetails(null);
      return;
    }

    let isMounted = true;
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getUnit(unitId);
        if (isMounted) {
          setDetails(data as any);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load unit details');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [unitId, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      id="unit-details-drawer-container"
      className="fixed inset-y-0 right-0 z-50 flex max-w-full pl-10"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div className="relative w-screen max-w-md bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                {t('unitProfile')}
              </span>
              {details?.unit && <Badge status={details.unit.status} size="sm" />}
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mt-0.5">
              {details?.unit ? `Unit ${details.unit.unitNumber}` : 'Loading...'}
            </h2>
            {details && (
              <p className="text-xs text-slate-400 truncate">
                {details.building?.name} • Floor {details.floor?.floorNumber} ({details.unit?.unitType})
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-2 border-b border-slate-200 bg-slate-50 flex items-center gap-2 overflow-x-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`py-2 px-3 border-b-2 font-semibold transition-colors shrink-0 ${
              activeTab === 'info'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {t('specifications')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('lease')}
            className={`py-2 px-3 border-b-2 font-semibold transition-colors shrink-0 flex items-center gap-1.5 ${
              activeTab === 'lease'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>{t('currentLease')}</span>
            {details?.tenant && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`py-2 px-3 border-b-2 font-semibold transition-colors shrink-0 ${
              activeTab === 'payments'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {t('paymentLedger')} ({details?.payments?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('maintenance')}
            className={`py-2 px-3 border-b-2 font-semibold transition-colors shrink-0 ${
              activeTab === 'maintenance'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {t('maintenanceTickets')} ({details?.maintenance?.length || 0})
          </button>
        </div>

        {/* Drawer Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading ? (
            <div className="py-20 text-center text-xs text-slate-400 space-y-3">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Loading real unit details from PropertyCore API...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Notice</span>
              </div>
              <p>{error}</p>
            </div>
          ) : details ? (
            <>
              {/* Tab: Specifications */}
              {activeTab === 'info' && (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Status
                      </span>
                      <div className="mt-0.5">
                        <Badge status={details.unit.status} />
                      </div>
                    </div>

                    {/* Quick CTA depending on status */}
                    {details.unit.status === 'VACANT' && (
                      <button
                        type="button"
                        onClick={() => onNavigateLeaseCreate?.(details.unit.id, details.building.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t('createLease')}</span>
                      </button>
                    )}
                  </div>

                  {/* Core Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        {t('area')}
                      </span>
                      <span className="text-lg font-bold text-slate-900 mt-1 block">
                        {details.unit.area} {t('sqm')}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        {t('contractedRent')}
                      </span>
                      <span className="text-lg font-bold text-indigo-600 mt-1 block truncate">
                        {parseFloat(details.unit.monthlyRent).toLocaleString()} ETB
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">per month</span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        {t('requiredDeposit')}
                      </span>
                      <span className="text-base font-bold text-slate-800 mt-1 block truncate">
                        {parseFloat(details.unit.depositAmount).toLocaleString()} ETB
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Rooms / Baths
                      </span>
                      <span className="text-base font-bold text-slate-800 mt-1 block">
                        {details.unit.bedrooms} {t('bedrooms')} • {details.unit.bathrooms} {t('bathrooms')}
                      </span>
                    </div>
                  </div>

                  {/* Architectural & Structural Placement */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5 text-xs">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <span>Property Location</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-600">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Building</span>
                        <span className="font-semibold text-slate-800">{details.building.name} ({details.building.code})</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Floor</span>
                        <span className="font-semibold text-slate-800">{details.floor.floorName} (Level {details.floor.floorNumber})</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-400 block">Address</span>
                        <span className="text-slate-700">{details.building.address}, {details.building.city}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {details.unit.description && (
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Notes & Description</span>
                      <p className="text-slate-600 leading-relaxed">{details.unit.description}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Lease & Tenant */}
              {activeTab === 'lease' && (
                <div className="space-y-4">
                  {details.tenant ? (
                    <div className="space-y-4">
                      {/* Tenant Card */}
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {details.tenant.profilePhoto ? (
                              <img
                                src={details.tenant.profilePhoto}
                                alt={details.tenant.fullName}
                                className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-xs"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                {details.tenant.fullName.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <h3 className="text-sm font-bold text-slate-900">{details.tenant.fullName}</h3>
                              <p className="text-[11px] text-slate-500">{details.tenant.phone}</p>
                            </div>
                          </div>

                          {onNavigateTenant && (
                            <button
                              type="button"
                              onClick={() => onNavigateTenant(details.tenant!.id)}
                              className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="View Tenant Profile"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-200/70 text-xs text-slate-600 grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Email</span>
                            <span className="truncate block font-medium">{details.tenant.email || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">ID Reference</span>
                            <span className="truncate block font-medium">{details.tenant.idType} ({details.tenant.idNumber})</span>
                          </div>
                        </div>
                      </div>

                      {/* Lease Contract Info */}
                      {details.contract ? (
                        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-indigo-600" />
                              <span className="text-xs font-bold text-slate-800">
                                {details.contract.contractNumber}
                              </span>
                            </div>
                            <Badge status={details.contract.status} size="sm" />
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
                            <div>
                              <span className="text-[10px] text-slate-400 block">{t('leasePeriod')}</span>
                              <span className="font-semibold text-slate-800">
                                {details.contract.startDate} → {details.contract.endDate}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">{t('monthlyRent')}</span>
                              <span className="font-bold text-indigo-600">
                                {parseFloat(details.contract.monthlyRent).toLocaleString()} ETB
                              </span>
                            </div>
                          </div>

                          {onNavigateContract && (
                            <button
                              type="button"
                              onClick={() => onNavigateContract(details.contract!.id)}
                              className="w-full mt-2 py-2 px-3 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
                            >
                              <span>{t('viewLease')}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                          Tenant is registered to unit, but active contract agreement is pending.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs space-y-3">
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <p className="text-slate-600 font-medium">{t('noActiveLease')}</p>
                      {onNavigateLeaseCreate && (
                        <button
                          type="button"
                          onClick={() => onNavigateLeaseCreate(details.unit.id, details.building.id)}
                          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{t('createLease')}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Payments */}
              {activeTab === 'payments' && (
                <div className="space-y-3">
                  {details.payments && details.payments.length > 0 ? (
                    <div className="divide-y divide-slate-100 text-xs">
                      {details.payments.map((p) => (
                        <div key={p.id} className="py-3 flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-slate-900">{p.paymentNumber}</div>
                            <div className="text-[11px] text-slate-400">
                              {p.paymentDate} • {p.paymentMethod}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-slate-900">
                              {parseFloat(p.amount).toLocaleString()} ETB
                            </div>
                            <Badge status={p.status} size="sm" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-slate-400">
                      No payment records found for this unit.
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Maintenance */}
              {activeTab === 'maintenance' && (
                <div className="space-y-3">
                  {details.maintenance && details.maintenance.length > 0 ? (
                    <div className="space-y-2 text-xs">
                      {details.maintenance.map((m) => (
                        <div key={m.id} className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{m.title}</span>
                            <Badge status={m.status} size="sm" />
                          </div>
                          <p className="text-slate-600 text-[11px]">{m.description}</p>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                            <span>Priority: {m.priority}</span>
                            <span>Reported by: {m.reportedBy}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-slate-400">
                      No open or past maintenance requests for this unit.
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            PropertyCore Interactive 3D System
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
