import React, { useEffect, useState } from 'react';
import { api } from '../../api/client.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { Server, Globe, Shield, Power, Users, CreditCard, CheckCircle, XCircle, ExternalLink, Activity, Database, History, Building2 } from 'lucide-react';
import { Badge } from '../common/Badge.tsx';

export const SuperAdminView: React.FC = () => {
  const { activeRole } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<any>(null);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [pendingSubscriptions, setPendingSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ORGANIZATIONS' | 'SUBSCRIPTIONS' | 'GLOBAL_AUDIT' | 'SYSTEM_HEALTH'>('OVERVIEW');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [editingOrg, setEditingOrg] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: '', subscriptionPlan: '' });

  useEffect(() => {
    if (activeRole === 'SUPER_ADMIN') {
      loadData();
    } else {
      setError('Forbidden: Super Administrator access required');
      setLoading(false);
    }
  }, [activeRole]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, orgsData, subsData, logsData] = await Promise.all([
        api.getSystemStats(),
        api.getOrganizations(),
        api.getPendingSubscriptions(),
        api.getGlobalAuditLogs()
      ]);
      setAuditLogs(logsData);
      setStats(statsData);
      setOrgs(orgsData);
      setPendingSubscriptions(subsData);
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

  const handleApprove = async (id: string) => {
    try {
      await api.approveSubscription(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to approve');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const reason = prompt('Enter rejection reason:');
      await api.rejectSubscription(id, reason || 'Invalid payment');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to reject');
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
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'OVERVIEW' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('SUBSCRIPTIONS')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center gap-1 ${activeTab === 'SUBSCRIPTIONS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Subscriptions
            {pendingSubscriptions.length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">
                {pendingSubscriptions.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'OVERVIEW' && (
        <>
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
                    <th className="px-4 py-3">Plan</th>
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
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${org.subscriptionStatus === 'PENDING_VERIFICATION' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                          {org.subscriptionPlan || 'FREE'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingOrg(org);
                              setEditForm({ name: org.name, subscriptionPlan: org.subscriptionPlan || 'FREE' });
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                          >
                            <Settings className="w-3 h-3" />
                            Edit
                          </button>
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
        </>
      )}

      {activeTab === 'SUBSCRIPTIONS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Pending Subscriptions</h3>
          </div>
          {pendingSubscriptions.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-900">All caught up!</p>
              <p className="text-xs text-slate-500">No pending subscription payments to review.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Organization</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Txn Code</th>
                    <th className="px-4 py-3">Submitted</th>
                    <th className="px-4 py-3">Receipt</th>
                    <th className="px-4 py-3 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingSubscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{sub.organization.name}</p>
                        <p className="text-[10px] text-slate-400">{sub.organization.code}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 font-bold rounded text-[10px] uppercase">
                          {sub.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">{sub.transactionCode}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(sub.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <a href={sub.receiptUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors font-medium">
                          <ExternalLink className="w-3 h-3" /> View Receipt
                        </a>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleReject(sub.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors border border-rose-200"
                        >
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                        <button
                          onClick={() => handleApprove(sub.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                          <CheckCircle className="w-3 h-3" /> Approve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


