import React, { useEffect, useState } from 'react';
import { api } from '../../api/client.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { Server, Globe, Shield, Power, Users } from 'lucide-react';
import { Badge } from '../common/Badge.tsx';

export const SuperAdminView: React.FC = () => {
  const { roleCode } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<any>(null);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (roleCode === 'SUPER_ADMIN') {
      loadData();
    } else {
      setError('Forbidden: Super Administrator access required');
      setLoading(false);
    }
  }, [roleCode]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, orgsData] = await Promise.all([
        api.getSystemStats(),
        api.getOrganizations()
      ]);
      setStats(statsData);
      setOrgs(orgsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load system data');
    } finally {
      setLoading(false);
    }
  };

  const toggleOrgStatus = async (org: any) => {
    const newStatus = org.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.updateOrganizationStatus(org.id, newStatus);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="py-16 text-center text-xs text-slate-400">Loading SaaS Admin...</div>;

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-rose-500 mb-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-600" />
            {t('saasAdminTitle')}
          </h2>
          <p className="text-xs text-slate-500">{t('saasAdminDesc')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-indigo-600 mb-2">
            <Server className="w-4 h-4" />
            <h3 className="text-[11px] font-bold uppercase tracking-wider">{t('totalOrgs')}</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.totalOrganizations}</p>
          <p className="text-xs text-slate-500 mt-1">{stats.activeOrganizations} Active</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <Users className="w-4 h-4" />
            <h3 className="text-[11px] font-bold uppercase tracking-wider">{t('totalUsersSys')}</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.totalUsers}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Shield className="w-4 h-4" />
            <h3 className="text-[11px] font-bold uppercase tracking-wider">Total Units</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.totalUnits}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <Users className="w-4 h-4" />
            <h3 className="text-[11px] font-bold uppercase tracking-wider">Total Tenants</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.totalTenants}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">{t('orgsList')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Organization</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Users</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orgs.map((org) => (
                <tr key={org.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900">{org.name}</td>
                  <td className="px-4 py-3 text-slate-600 font-mono bg-slate-100 rounded-md px-1 py-0.5 mx-4">{org.code}</td>
                  <td className="px-4 py-3 text-slate-500">{org.contactEmail}</td>
                  <td className="px-4 py-3 text-slate-700 font-medium">{org.userCount}</td>
                  <td className="px-4 py-3"><Badge status={org.status} size="sm" /></td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleOrgStatus(org)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${org.status === 'ACTIVE' ? 'text-rose-600 bg-rose-50 hover:bg-rose-100' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'}`}
                    >
                      <Power className="w-3 h-3" />
                      {org.status === 'ACTIVE' ? t('suspendOrg') : t('activateOrg')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

