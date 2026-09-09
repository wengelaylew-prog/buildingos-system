import React, { useEffect, useState } from 'react';
import {
  Building2,
  DoorOpen,
  Users,
  Wallet,
  AlertTriangle,
  FileClock,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Activity,
  Plus,
  FileText,
  CreditCard,
  Wrench,
  ChevronRight,
  BarChart3,
  LayoutGrid,
  Box,
} from 'lucide-react';
import { api } from '../../api/client.ts';
import { DashboardKPIs, AlertItem, AuditLog, Contract } from '../../types/index.ts';
import { StatCard } from '../common/StatCard.tsx';
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Compact3DPreview } from '../three-d/Compact3DPreview.tsx';

interface DashboardViewProps {
  onNavigate?: (tab: string, buildingId?: string, floorId?: string, unitId?: string) => void;
  onNavigateUnits?: (bldgId?: string) => void;
  onNavigateContracts?: () => void;
  onQuickAction?: (action: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onNavigateUnits,
  onNavigateContracts,
  onQuickAction,
}) => {
  const [data, setData] = useState<{
    kpis: DashboardKPIs;
    recentActivity: AuditLog[];
    alerts: AlertItem[];
  } | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [occupancyView, setOccupancyView] = useState<'3d' | 'matrix' | 'chart'>('3d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashRes, contractsRes] = await Promise.all([
        api.getDashboard(),
        api.getContracts().catch(() => [] as Contract[]),
      ]);
      setData(dashRes);
      setContracts(contractsRes || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (tab: string) => {
    if (tab === 'contracts' && onNavigateContracts) {
      onNavigateContracts();
    } else if (tab === 'units' && onNavigateUnits) {
      onNavigateUnits();
    } else if (onNavigate) {
      onNavigate(tab);
    }
  };

  if (loading) {
    return (
      <div id="dashboard-loading" className="flex items-center justify-center min-h-[420px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading Bento portfolio analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
        <p className="font-semibold">Unable to fetch dashboard metrics</p>
        <p className="mt-1">{error}</p>
        <button
          onClick={loadDashboard}
          className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded-md text-xs font-semibold hover:bg-rose-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const { kpis, recentActivity, alerts } = data;

  const chartData = [
    { name: 'Occupied', value: kpis.occupiedUnits, fill: '#4f46e5' },
    { name: 'Vacant', value: kpis.vacantUnits, fill: '#94a3b8' },
    { name: 'Reserved', value: kpis.reservedUnits, fill: '#f59e0b' },
    { name: 'Maintenance', value: kpis.maintenanceUnits, fill: '#f43f5e' },
  ];

  // Visual matrix cells representing the 40 portfolio units (23 Occupied, 12 Vacant, 3 Reserved, 2 Maintenance)
  const matrixCells: Array<{ id: number; status: 'occupied' | 'vacant' | 'reserved' | 'maintenance'; title: string }> = [];
  let idCounter = 1;
  for (let i = 0; i < kpis.occupiedUnits; i++) {
    matrixCells.push({ id: idCounter, status: 'occupied', title: `Unit #${100 + idCounter} (Occupied)` });
    idCounter++;
  }
  for (let i = 0; i < kpis.vacantUnits; i++) {
    matrixCells.push({ id: idCounter, status: 'vacant', title: `Unit #${100 + idCounter} (Vacant)` });
    idCounter++;
  }
  for (let i = 0; i < kpis.reservedUnits; i++) {
    matrixCells.push({ id: idCounter, status: 'reserved', title: `Unit #${100 + idCounter} (Reserved)` });
    idCounter++;
  }
  for (let i = 0; i < kpis.maintenanceUnits; i++) {
    matrixCells.push({ id: idCounter, status: 'maintenance', title: `Unit #${100 + idCounter} (Under Maintenance)` });
    idCounter++;
  }

  // Filter expiring or active contracts
  const expiringContractsList = contracts
    .filter((c) => c.contractStatus === 'EXPIRING' || c.contractStatus === 'ACTIVE')
    .slice(0, 4);

  const getActivityBadge = (action: string, entityType: string) => {
    const act = (action || '').toUpperCase();
    const ent = (entityType || '').toUpperCase();
    if (ent.includes('TENANT') || act.includes('TENANT')) {
      return { label: 'TN', bg: 'bg-indigo-100 text-indigo-600' };
    }
    if (ent.includes('PAYMENT') || act.includes('PAYMENT')) {
      return { label: 'PY', bg: 'bg-emerald-100 text-emerald-600' };
    }
    if (ent.includes('MAINT') || act.includes('MAINT')) {
      return { label: 'MN', bg: 'bg-amber-100 text-amber-600' };
    }
    if (ent.includes('CONTRACT') || act.includes('LEASE')) {
      return { label: 'CT', bg: 'bg-indigo-100 text-indigo-600' };
    }
    return { label: 'BD', bg: 'bg-slate-100 text-slate-700' };
  };

  return (
    <div id="dashboard-view" className="space-y-4">
      {/* 1. Top 4 Bento Stat Cards (12-col grid) */}
      <div className="grid grid-cols-12 gap-4">
        {/* Total Portfolio */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Total Portfolio</p>
            <p className="text-2xl font-bold text-slate-900">{kpis.totalBuildings} Buildings</p>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold mt-3">
            <span>{kpis.totalBuildings} Active Commercial Properties</span>
          </div>
        </div>

        {/* Total Units */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Total Units</p>
            <p className="text-2xl font-bold text-indigo-600">{kpis.totalUnits}</p>
          </div>
          <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-[10px] font-bold mt-3">
            <span className="text-indigo-600">{kpis.occupiedUnits} Occupied</span>
            <span className="text-slate-500">{kpis.vacantUnits} Vacant</span>
            <span className="text-amber-600">{kpis.reservedUnits} Reserved</span>
            <span className="text-rose-600">{kpis.maintenanceUnits} Maint</span>
          </div>
        </div>

        {/* Outstanding / Monthly Rent */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Monthly Pipeline</p>
            <p className="text-2xl font-bold text-slate-900 truncate">
              ETB {kpis.monthlyRent.toLocaleString()}
            </p>
          </div>
          <div className="text-[10px] text-slate-500 mt-3 font-medium">
            {kpis.occupancyRate}% portfolio occupancy rate
          </div>
        </div>

        {/* Maintenance */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Maintenance</p>
            <p className="text-2xl font-bold text-slate-900">
              {kpis.maintenanceUnits} Open
            </p>
          </div>
          <div className="text-[10px] text-amber-600 font-bold mt-3">
            {kpis.maintenanceUnits} Active Work Orders
          </div>
        </div>
      </div>

      {/* 2. Middle Bento Row: Building Occupancy Snapshot (8 cols) & Recent Activity (4 cols) */}
      <div className="grid grid-cols-12 gap-4">
        {/* Building Occupancy Snapshot */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Building Occupancy Snapshot</h3>
              <p className="text-[11px] text-slate-400">Real-time space utilization matrix (40 units balanced)</p>
            </div>
            <div className="flex gap-1.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
              <button
                type="button"
                onClick={() => setOccupancyView('3d')}
                className={`px-3 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1 ${
                  occupancyView === '3d'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Box className="w-3 h-3" />
                <span>3D Preview</span>
              </button>
              <button
                type="button"
                onClick={() => setOccupancyView('matrix')}
                className={`px-3 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1 ${
                  occupancyView === 'matrix'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3 h-3" />
                <span>Unit Matrix</span>
              </button>
              <button
                type="button"
                onClick={() => setOccupancyView('chart')}
                className={`px-3 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1 ${
                  occupancyView === 'chart'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3 h-3" />
                <span>Bar Chart</span>
              </button>
            </div>
          </div>

          {/* 3D view, Matrix view, or Chart view */}
          {occupancyView === '3d' ? (
            <div className="flex-1 min-h-[220px] py-1">
              <Compact3DPreview
                onExpandToStudio={(bldgId, unitId) => onNavigate?.('3d-viewer', bldgId, undefined, unitId)}
              />
            </div>
          ) : occupancyView === 'matrix' ? (
            <div className="flex-1 min-h-[170px] grid grid-cols-10 grid-rows-4 gap-2 py-2">
              {matrixCells.map((cell) => {
                let cellColor = 'bg-indigo-600';
                if (cell.status === 'vacant') cellColor = 'bg-slate-200';
                if (cell.status === 'reserved') cellColor = 'bg-amber-400';
                if (cell.status === 'maintenance') cellColor = 'bg-rose-500';

                return (
                  <div
                    key={cell.id}
                    title={cell.title}
                    className={`${cellColor} rounded-xs cursor-pointer hover:opacity-85 hover:scale-105 transition-transform min-h-[22px]`}
                    onClick={() => navigateTo('units')}
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex-1 min-h-[170px] pt-2">
              <ResponsiveContainer width="100%" height={170} minWidth={100} minHeight={170}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Bottom Legend */}
          <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-indigo-600 rounded-xs" />
              <span className="text-[10px] text-slate-600 font-bold uppercase">
                Occupied ({kpis.occupiedUnits})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-slate-200 rounded-xs" />
              <span className="text-[10px] text-slate-600 font-bold uppercase">
                Vacant ({kpis.vacantUnits})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-amber-400 rounded-xs" />
              <span className="text-[10px] text-slate-600 font-bold uppercase">
                Reserved ({kpis.reservedUnits})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-rose-500 rounded-xs" />
              <span className="text-[10px] text-slate-600 font-bold uppercase">
                Maintenance ({kpis.maintenanceUnits})
              </span>
            </div>
            <div className="ml-auto text-[10px] font-semibold text-slate-400">
              Total: {kpis.occupiedUnits + kpis.vacantUnits + kpis.reservedUnits + kpis.maintenanceUnits} Units
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm">Recent Activity</h3>
            <button
              type="button"
              onClick={() => navigateTo('audit')}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              View All
            </button>
          </div>

          <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[260px] pr-1">
            {recentActivity.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No recent logs recorded.</div>
            ) : (
              recentActivity.slice(0, 4).map((log) => {
                const badge = getActivityBadge(log.action, log.entityType);
                return (
                  <div key={log.id} className="flex gap-3 items-start">
                    <div
                      className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold shrink-0 ${badge.bg}`}
                    >
                      {badge.label}
                    </div>
                    <div className="flex-1 min-w-0 border-b border-slate-50 pb-2">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {log.action}: {log.entityType}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        By {log.userEmail || 'System'}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-1 uppercase font-medium">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 3. Bottom Bento Row: Expiring Contracts (6 cols) & Quick Actions (6 cols) */}
      <div className="grid grid-cols-12 gap-4">
        {/* Expiring Contracts */}
        <div className="col-span-12 lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-sm">Expiring Contracts (Next 30 Days)</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
                {kpis.expiringContracts} Expiring
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 rounded-lg">
                  <tr>
                    <th className="px-2.5 py-1.5 rounded-l-md">Tenant</th>
                    <th className="px-2.5 py-1.5">Unit</th>
                    <th className="px-2.5 py-1.5">Expiry</th>
                    <th className="px-2.5 py-1.5 text-right rounded-r-md">Action</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-50">
                  {expiringContractsList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-xs text-slate-400">
                        No lease agreements expiring soon.
                      </td>
                    </tr>
                  ) : (
                    expiringContractsList.map((contract) => (
                      <tr key={contract.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-2.5 py-2.5 font-semibold text-slate-800">
                          {contract.tenant?.fullName || 'Commercial Tenant'}
                        </td>
                        <td className="px-2.5 py-2.5 text-slate-600">
                          {contract.unit?.unitNumber || 'BT-204'}
                        </td>
                        <td className="px-2.5 py-2.5 font-bold text-rose-500">
                          {new Date(contract.endDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-2.5 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => navigateTo('contracts')}
                            className="text-indigo-600 font-bold hover:text-indigo-800 text-xs transition-colors"
                          >
                            Renew
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-[11px] text-slate-400">
              Track renewals to maintain full portfolio occupancy
            </span>
            <button
              type="button"
              onClick={() => navigateTo('contracts')}
              className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-1"
            >
              <span>Manage Leases</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Actions (2x2 Bento Action Cards) */}
        <div className="col-span-12 lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800 text-sm">Quick Actions</h3>
            <p className="text-[11px] text-slate-400">Instant workflow launchers</p>
          </div>

          <div className="grid grid-cols-2 gap-3 flex-1">
            <div
              onClick={() => {
                if (onQuickAction) onQuickAction('new-building');
                else navigateTo('buildings');
              }}
              className="p-3 bg-slate-50 rounded-lg hover:bg-indigo-50/80 cursor-pointer border border-transparent hover:border-indigo-100 flex items-center gap-3 transition-all group"
            >
              <div className="w-8 h-8 bg-indigo-100 rounded flex items-center justify-center text-indigo-600 shrink-0 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">New Building</span>
                <span className="text-[10px] text-slate-400 block">Add tower / estate</span>
              </div>
            </div>

            <div
              onClick={() => {
                if (onQuickAction) onQuickAction('new-tenant');
                else navigateTo('tenants');
              }}
              className="p-3 bg-slate-50 rounded-lg hover:bg-indigo-50/80 cursor-pointer border border-transparent hover:border-indigo-100 flex items-center gap-3 transition-all group"
            >
              <div className="w-8 h-8 bg-indigo-100 rounded flex items-center justify-center text-indigo-600 shrink-0 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Add Tenant</span>
                <span className="text-[10px] text-slate-400 block">Register occupant</span>
              </div>
            </div>

            <div
              onClick={() => {
                if (onQuickAction) onQuickAction('new-contract');
                else navigateTo('contracts');
              }}
              className="p-3 bg-slate-50 rounded-lg hover:bg-indigo-50/80 cursor-pointer border border-transparent hover:border-indigo-100 flex items-center gap-3 transition-all group"
            >
              <div className="w-8 h-8 bg-indigo-100 rounded flex items-center justify-center text-indigo-600 shrink-0 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Create Lease</span>
                <span className="text-[10px] text-slate-400 block">New contract & rent</span>
              </div>
            </div>

            <div
              onClick={() => navigateTo('payments')}
              className="p-3 bg-slate-50 rounded-lg hover:bg-indigo-50/80 cursor-pointer border border-transparent hover:border-indigo-100 flex items-center gap-3 transition-all group"
            >
              <div className="w-8 h-8 bg-indigo-100 rounded flex items-center justify-center text-indigo-600 shrink-0 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Add Payment</span>
                <span className="text-[10px] text-slate-400 block">Record receipt</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400">
            <span>Enterprise workflow shortcuts</span>
            <span className="font-semibold text-indigo-600">PropertyCore PMS</span>
          </div>
        </div>
      </div>

      {/* 4. Alerts & Notifications Bento Section */}
      {alerts && alerts.length > 0 && (
        <div id="dashboard-alerts-section" className="pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {alerts.map((alert) => {
              const isAlert = alert.type === 'ALERT';
              const isWarning = alert.type === 'WARNING';
              const bgClass = isAlert
                ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                : isWarning
                ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                : 'bg-indigo-50/70 border-indigo-200 text-indigo-900';

              const badgeBg = isAlert
                ? 'bg-rose-600 text-white'
                : isWarning
                ? 'bg-amber-600 text-white'
                : 'bg-indigo-600 text-white';

              return (
                <div
                  key={alert.id}
                  id={`alert-card-${alert.id}`}
                  className={`p-3.5 rounded-xl border ${bgClass} flex flex-col justify-between transition-all hover:shadow-xs`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold">{alert.title}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${badgeBg}`}>
                        {alert.count}
                      </span>
                    </div>
                    <p className="text-[11px] opacity-80 leading-relaxed">{alert.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (alert.link.includes('contracts')) navigateTo('contracts');
                      else if (alert.link.includes('payments')) navigateTo('payments');
                      else if (alert.link.includes('units')) navigateTo('units');
                      else if (alert.link.includes('maintenance')) navigateTo('maintenance');
                    }}
                    className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold hover:underline self-start"
                  >
                    <span>Resolve</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
