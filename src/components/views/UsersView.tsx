import React, { useEffect, useState } from 'react';
import { api } from '../../api/client.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { Users, Shield, ShieldCheck } from 'lucide-react';
import { Badge } from '../common/Badge.tsx';

export const UsersView: React.FC = () => {
  const { hasPermission, activeRole } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hasPermission('user.manage') || activeRole === 'SUPER_ADMIN') {
      loadUsers();
    } else {
      setError('Forbidden: You do not have permission to view users.');
      setLoading(false);
    }
  }, [hasPermission, activeRole]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="py-16 text-center text-xs text-slate-400">Loading Users...</div>;
  if (error) return <div className="py-16 text-center text-sm text-rose-500">{error}</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            {t('globalUsers')}
          </h2>
          <p className="text-xs text-slate-500">Manage system users, tenant roles, and access controls.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Organization ID</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                        {(user.fullName || user.email || '?')[0].toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-900">{user.fullName || 'Unnamed'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-indigo-700 font-semibold bg-indigo-50 px-2 py-1 rounded-md w-max">
                      {user.roleId ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3 text-slate-400" />}
                      {user.roleId || 'TENANT'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-[10px]">
                    {user.organizationId || 'SYSTEM'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge status={user.isActive ? 'ACTIVE' : 'INACTIVE'} size="sm" />
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
