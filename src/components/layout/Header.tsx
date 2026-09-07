import React from 'react';
import {
  Search,
  Bell,
  Database,
  Plus,
  Building2,
  Users,
  FileText,
  KeyRound,
  CheckCircle2,
  Globe,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { ActiveTab } from './Sidebar.tsx';

interface HeaderProps {
  activeTab: string;
  onQuickAction?: (action: any) => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onQuickAction,
  searchQuery,
  setSearchQuery,
}) => {
  const { hasPermission } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [internalQuery, setInternalQuery] = React.useState('');
  const query = searchQuery !== undefined ? searchQuery : internalQuery;
  const setQuery = setSearchQuery || setInternalQuery;

  const titleMap: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: 'Overview', subtitle: 'Occupancy metrics, portfolio KPIs & active alerts' },
    '3d-viewer': { title: '3D Building Viewer', subtitle: 'Interactive 3D Digital Twin, floor stacks & space allocation' },
    buildings: { title: 'Buildings', subtitle: 'Manage properties, towers, and floor layouts' },
    units: { title: 'Units', subtitle: 'Occupancy tracking, rent ledger, and unit status' },
    tenants: { title: 'Tenants', subtitle: 'Tenant profiles, emergency contacts, and active contracts' },
    contracts: { title: 'Contracts', subtitle: 'Track agreements, renewals, and expiration dates' },
    payments: { title: 'Payments', subtitle: 'Collection history, overdue tracking, and receipts' },
    maintenance: { title: 'Maintenance', subtitle: 'Technician dispatches, repair tickets, and resolution logs' },
    documents: { title: 'Documents', subtitle: 'Polymorphic storage for title deeds, leases, IDs, and blueprints' },
    audit: { title: 'Audit Trail', subtitle: 'Immutable record of changes, user actions, and timestamps' },
    settings: { title: 'Settings', subtitle: 'Role permissions matrix, currency setup, and database controls' },
  };

  const currentMeta = titleMap[activeTab] || { title: 'Overview', subtitle: 'Building & Tenant Management' };

  return (
    <header
      id="app-header"
      className="h-16 px-6 lg:px-8 bg-white border-b border-slate-200 flex items-center justify-between shrink-0"
    >
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-400 font-medium">Dashboard</span>
        <span className="text-slate-300 font-light">/</span>
        <span className="font-semibold text-slate-800 tracking-tight">{currentMeta.title}</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Global Filter / Search */}
        <div className="relative">
          <input
            id="global-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Global search..."
            className="bg-slate-100 border-none rounded-full px-4 py-1.5 text-xs w-44 sm:w-64 text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        {/* Language Switcher (EN / AM) */}
        <button
          type="button"
          onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
          title={`Switch language (${language === 'en' ? 'Amharic' : 'English'})`}
        >
          <Globe className="w-3.5 h-3.5 text-indigo-600" />
          <span className="uppercase">{language}</span>
        </button>

        {/* Bell Notification */}
        <button
          type="button"
          aria-label="System Notifications"
          className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-200/80 transition-colors"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* PostgreSQL Database Indicator */}
        <div
          id="db-status-badge"
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80 text-[11px] font-medium"
        >
          <Database className="w-3 h-3 text-indigo-600" />
          <span>PostgreSQL</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </div>

        {/* Quick Action Buttons */}
        {onQuickAction && hasPermission('building.create') && (
          <div className="flex items-center gap-2">
            <button
              id="quick-add-building"
              type="button"
              onClick={() => onQuickAction('new-building')}
              className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Building</span>
            </button>
            <button
              id="quick-add-unit"
              type="button"
              onClick={() => onQuickAction('new-unit')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Unit</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
