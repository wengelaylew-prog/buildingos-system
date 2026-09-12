import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Box,
  Grid3X3,
  Users,
  FileText,
  CreditCard,
  Receipt,
  Wrench,
  MessageSquare,
  FolderArchive,
  BarChart3,
  Users2,
  History,
  Settings,
  ShieldCheck,
  ChevronRight,
  LogOut,
  LogIn,
} from 'lucide-react';
import { useAuth, AVAILABLE_ROLES } from '../../context/AuthContext.tsx';

export type ActiveTab =
  | 'dashboard'
  | '3d-viewer'
  | 'buildings'
  | 'units'
  | 'tenants'
  | 'contracts'
  | 'payments'
  | 'receipts'
  | 'maintenance'
  | 'security'
  | 'messages'
  | 'documents'
  | 'reports'
  | 'users'
  | 'audit'
  | 'saas'
  | 'settings';

interface SidebarProps {
  activeTab: string;
  setActiveTab?: (tab: ActiveTab) => void;
  onSelectTab?: (tab: ActiveTab) => void;
  collapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onSelectTab }) => {
  const { user, activeRole, setActiveRole, signInWithGoogle, signOut } = useAuth();

  const handleSelect = (tab: ActiveTab) => {
    setActiveTab?.(tab);
    onSelectTab?.(tab);
  };

  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    permission?: string;
    phaseBadge?: string;
    allowedRoles?: string[];
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, allowedRoles: ['SUPER_ADMIN', 'PROPERTY_MANAGER'] },
    { id: '3d-viewer', label: '3D Building Viewer', icon: Box, phaseBadge: 'Phase 4', allowedRoles: ['SUPER_ADMIN', 'PROPERTY_MANAGER', 'TENANT'] },
    { id: 'buildings', label: 'Buildings', icon: Building2, permission: 'building.read', allowedRoles: ['SUPER_ADMIN', 'PROPERTY_MANAGER'] },
    { id: 'units', label: 'Floors & Units', icon: Grid3X3, permission: 'unit.read', allowedRoles: ['SUPER_ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE'] },
    { id: 'tenants', label: 'Tenants', icon: Users, permission: 'tenant.read', allowedRoles: ['SUPER_ADMIN', 'PROPERTY_MANAGER', 'ACCOUNTANT'] },
    { id: 'contracts', label: 'Contracts & Leases', icon: FileText, permission: 'contract.read', allowedRoles: ['SUPER_ADMIN', 'PROPERTY_MANAGER', 'ACCOUNTANT'] },
    { id: 'payments', label: 'Payments & Revenue', icon: CreditCard, permission: 'payment.read', allowedRoles: ['SUPER_ADMIN', 'ACCOUNTANT'] },
    { id: 'receipts', label: 'Receipts', icon: Receipt, phaseBadge: 'Phase 2', allowedRoles: ['SUPER_ADMIN', 'ACCOUNTANT'] },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, permission: 'maintenance.read', allowedRoles: ['SUPER_ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE'] },
    { id: 'security', label: 'Security & Gates', icon: ShieldCheck, phaseBadge: 'Phase 3', allowedRoles: ['SUPER_ADMIN', 'SECURITY', 'PROPERTY_MANAGER'] },
    { id: 'messages', label: 'Messages', icon: MessageSquare, phaseBadge: 'Phase 2', allowedRoles: ['SUPER_ADMIN', 'PROPERTY_MANAGER'] },
    { id: 'documents', label: 'Documents', icon: FolderArchive, permission: 'document.read', allowedRoles: ['SUPER_ADMIN', 'PROPERTY_MANAGER'] },
    { id: 'reports', label: 'Reports', icon: BarChart3, phaseBadge: 'Phase 2', allowedRoles: ['SUPER_ADMIN', 'PROPERTY_MANAGER', 'ACCOUNTANT'] },
    { id: 'users', label: 'Users', icon: Users2, phaseBadge: 'Phase 2', allowedRoles: ['SUPER_ADMIN'] },
    { id: 'audit', label: 'Audit Trail', icon: History, permission: 'audit.read', allowedRoles: ['SUPER_ADMIN'] },
    { id: 'settings', label: 'Settings & RBAC', icon: Settings, permission: 'settings.manage', allowedRoles: ['SUPER_ADMIN'] },
  ];

  return (
    <aside
      id="main-sidebar"
      className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none"
    >
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-slate-800 bg-slate-950/20">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white text-lg shadow-sm shrink-0">
          P
        </div>
        <div className="min-w-0">
          <h1 className="text-white font-bold tracking-tight text-base leading-tight truncate">
            PropertyCore
          </h1>
          <div className="text-[10px] text-slate-400 font-medium truncate">
            Building & Tenant Management
          </div>
        </div>
      </div>

      {/* Role Switcher Banner */}
      <div className="px-4 py-2.5 bg-slate-800/40 border-b border-slate-800">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
          <span>Active Role</span>
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
        </div>
        <select
          id="role-selector-dropdown"
          value={activeRole}
          onChange={(e) => setActiveRole(e.target.value)}
          disabled={!!user?.uid && !user.uid.includes('demo')}
          className="w-full text-xs font-medium bg-slate-950 text-slate-200 rounded-md border border-slate-700 py-1.5 px-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {AVAILABLE_ROLES.map((r) => (
            <option key={r.code} value={r.code}>
              {r.name}
            </option>
          ))}
        </select>
        <div className="text-[10px] text-slate-400 mt-1 truncate">
          {AVAILABLE_ROLES.find((r) => r.code === activeRole)?.badge}
        </div>
      </div>

      {/* Navigation List */}
      <nav id="sidebar-navigation" className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <div className="space-y-1">
        {navItems.filter(item => item.allowedRoles ? item.allowedRoles.includes(activeRole) : true).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border-l-4 border-indigo-500 font-semibold rounded-r-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-md'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.phaseBadge && (
                    <span className="text-[9px] font-semibold tracking-tight text-amber-300/90 bg-amber-950/60 border border-amber-800/40 px-1.5 py-0.5 rounded">
                      {item.phaseBadge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-400 opacity-80" />}
                </div>
              </button>
            );
          })}

        {activeRole === 'SUPER_ADMIN' && (
          <div className="pt-2 mt-2 border-t border-slate-800">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-2">System Admin</div>
            <button
              onClick={() => handleSelect('saas')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-medium transition-colors ${
                activeTab === 'saas'
                  ? 'bg-indigo-600/15 text-indigo-400 border-l-4 border-indigo-500 font-semibold rounded-r-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-md'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className={`w-4 h-4 ${activeTab === 'saas' ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>SaaS Admin</span>
              </div>
            </button>
          </div>
        )}
      </div>
      </nav>

      {/* User Footer */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950/30">
        <div className="flex items-center justify-between gap-2 px-2 py-2 bg-slate-800/50 rounded-lg border border-slate-800/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-xs">
              {user?.fullName?.charAt(0) || 'AM'}
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate leading-none">
                {user?.fullName || 'Abebe M.'}
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-1">
                {AVAILABLE_ROLES.find((r) => r.code === activeRole)?.name || 'Super Admin'}
              </div>
            </div>
          </div>
          {user?.uid?.includes('demo') ? (
            <button
              id="google-signin-btn"
              type="button"
              onClick={signInWithGoogle}
              title="Sign in with Google"
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <LogIn className="w-4 h-4" />
            </button>
          ) : (
            <button
              id="google-signout-btn"
              type="button"
              onClick={signOut}
              title="Sign Out"
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
