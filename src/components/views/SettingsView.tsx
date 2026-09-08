import React, { useState } from 'react';
import {
  ShieldCheck,
  Database,
  RefreshCw,
  CheckCircle2,
  Lock,
  UserCheck,
  Server,
  KeyRound,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ROLE_PERMISSIONS, UserRoleType } from '../../types/index.ts';
import { api } from '../../api/client.ts';

export const SettingsView: React.FC = () => {
  const { activeRole, setActiveRole, user } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  const roles: UserRoleType[] = [
    'SUPER_ADMIN',
    'BUILDING_MANAGER',
    'PROPERTY_ACCOUNTANT',
    'AUDITOR',
    'TENANT',
  ];

  const permissionCategories = [
    {
      category: 'Buildings & Floors',
      perms: ['building.create', 'building.read', 'building.update', 'building.delete'],
    },
    {
      category: 'Units & Space',
      perms: ['unit.create', 'unit.read', 'unit.update', 'unit.delete'],
    },
    {
      category: 'Tenants & Occupants',
      perms: ['tenant.create', 'tenant.read', 'tenant.update', 'tenant.delete'],
    },
    {
      category: 'Contracts & Leases',
      perms: ['contract.create', 'contract.read', 'contract.update', 'contract.delete'],
    },
    {
      category: 'Financials & Payments',
      perms: ['payment.create', 'payment.read', 'payment.update'],
    },
    {
      category: 'Facility Maintenance',
      perms: ['maintenance.create', 'maintenance.read', 'maintenance.update'],
    },
    {
      category: 'Document Storage',
      perms: ['document.upload', 'document.read', 'document.delete'],
    },
    {
      category: 'Audit & Compliance',
      perms: ['audit.read', 'user.manage'],
    },
  ];

  const handleReSeed = async () => {
    if (!confirm('Re-run database seeding? This will refresh all mock demo buildings, units, leases, and receipts.')) {
      return;
    }

    try {
      setSeeding(true);
      setSeedResult(null);
      const res = await api.reseedDatabase();
      setSeedResult(res.message || 'Database successfully populated with realistic commercial enterprise data.');
    } catch (err: any) {
      setSeedResult(`Failed: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div id="settings-view" className="space-y-6">
      {/* Overview Banner */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Access Control & System Configuration</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise Role-Based Access Control (RBAC) matrix and Cloud SQL database operations.
          </p>
        </div>

        <button
          id="reseed-database-button"
          type="button"
          disabled={seeding}
          onClick={handleReSeed}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
          <span>{seeding ? 'Re-seeding Database...' : 'Re-seed Demo Data'}</span>
        </button>
      </div>

      {seedResult && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-600" />
          <span>{seedResult}</span>
        </div>
      )}

      {/* Role Simulator Tool */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Live Role Simulator</h3>
            <p className="text-xs text-slate-500">
              Switch roles to experience real-time UI permission restrictions and backend header validation.
            </p>
          </div>
          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold text-[11px] rounded-lg border border-indigo-200">
            Active: {activeRole}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {roles.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setActiveRole(r)}
              disabled={!!user?.uid && !user.uid.includes('demo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                activeRole === r
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {r.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* RBAC Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Permission Enforcement Matrix
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict granular capabilities granted per organizational authorization level.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Functional Capability</th>
                {roles.map((r) => (
                  <th key={r} className="py-3 px-3 text-center">
                    {r.replace('_', ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permissionCategories.map((cat) => (
                <React.Fragment key={cat.category}>
                  <tr className="bg-slate-50/80">
                    <td
                      colSpan={roles.length + 1}
                      className="py-2 px-4 font-bold text-[11px] uppercase tracking-wider text-slate-500"
                    >
                      {cat.category}
                    </td>
                  </tr>
                  {cat.perms.map((perm) => (
                    <tr key={perm} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-700">{perm}</td>
                      {roles.map((r) => {
                        const has = ROLE_PERMISSIONS[r]?.includes(perm);
                        return (
                          <td key={r} className="py-2.5 px-3 text-center">
                            {has ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                            ) : (
                              <span className="inline-block w-2 h-0.5 bg-slate-200 rounded-full mx-auto" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Infrastructure & Architecture Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
            <Database className="w-4 h-4 text-indigo-600" />
            <span>Database Architecture</span>
          </div>
          <p className="text-xs text-slate-500">
            Relational PostgreSQL managed via Drizzle ORM. Strictly typed foreign keys, cascading references, and JSON diff audit history.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
            <Server className="w-4 h-4 text-emerald-600" />
            <span>Storage Service</span>
          </div>
          <p className="text-xs text-slate-500">
            Decoupled polymorphic storage interface allowing transparent switching between Local Disk, Cloudflare R2, and S3.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Compliance & Audit</span>
          </div>
          <p className="text-xs text-slate-500">
            Every critical state mutation writes immutable audit entries with actor IP, email, timestamp, and old vs new JSON snapshots.
          </p>
        </div>
      </div>
    </div>
  );
};
