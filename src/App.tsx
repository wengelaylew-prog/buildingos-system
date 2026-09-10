import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { LanguageProvider } from './context/LanguageContext.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { Header } from './components/layout/Header.tsx';
import { DashboardView } from './components/views/DashboardView.tsx';
import { ThreeDViewerView } from './components/three-d/ThreeDViewerView.tsx';
import { BuildingsView } from './components/views/BuildingsView.tsx';
import { UnitsView } from './components/views/UnitsView.tsx';
import { TenantsView } from './components/views/TenantsView.tsx';
import { ContractsView } from './components/views/ContractsView.tsx';
import { PaymentsView } from './components/views/PaymentsView.tsx';
import { MaintenanceView } from './components/views/MaintenanceView.tsx';
import { DocumentsView } from './components/views/DocumentsView.tsx';
import { AuditLogsView } from './components/views/AuditLogsView.tsx';
import { SettingsView } from './components/views/SettingsView.tsx';
import { MessagesView } from './components/views/MessagesView.tsx';
import { ReportsView } from './components/views/ReportsView.tsx';
import { SuperAdminView } from './components/views/SuperAdminView.tsx';
import { UsersView } from './components/views/UsersView.tsx';
import { PhasePlaceholderView } from './components/views/PhasePlaceholderView.tsx';

function MainLayout() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | undefined>(undefined);
  const [selectedFloorId, setSelectedFloorId] = useState<string | undefined>(undefined);
  const [selectedUnitId, setSelectedUnitId] = useState<string | undefined>(undefined);
  const [modalInitial, setModalInitial] = useState<string | null>(null);

  const handleNavigate = (tab: string, buildingId?: string, floorId?: string, unitId?: string) => {
    setActiveTab(tab);
    if (buildingId) {
      setSelectedBuildingId(buildingId);
      setSelectedFloorId(floorId);
      setSelectedUnitId(unitId);
    } else if (tab !== 'units' && tab !== '3d-viewer') {
      setSelectedBuildingId(undefined);
      setSelectedFloorId(undefined);
      setSelectedUnitId(undefined);
    }
  };

  const handleQuickAction = (action: string) => {
    if (action === 'new-building') {
      setActiveTab('buildings');
      setModalInitial('building');
    } else if (action === 'new-unit') {
      setActiveTab('units');
      setModalInitial('unit');
    } else if (action === 'new-tenant') {
      setActiveTab('tenants');
      setModalInitial('tenant');
    } else if (action === 'new-contract') {
      setActiveTab('contracts');
      setModalInitial('contract');
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] text-slate-900 antialiased selection:bg-indigo-600 selection:text-white font-sans">
      {/* Structural Sidebar */}
      <Sidebar activeTab={activeTab} onSelectTab={handleNavigate} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header activeTab={activeTab} onQuickAction={handleQuickAction} />

        {/* Scrollable View Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/50">
          <div className="max-w-7xl mx-auto pb-12">
            {activeTab === 'dashboard' && (
              <DashboardView
                onNavigate={handleNavigate}
                onNavigateUnits={(bldgId) => handleNavigate('units', bldgId)}
                onNavigateContracts={() => handleNavigate('contracts')}
                onQuickAction={handleQuickAction}
              />
            )}

            {activeTab === '3d-viewer' && (
              <ThreeDViewerView
                initialBuildingId={selectedBuildingId}
                initialFloorId={selectedFloorId}
                initialUnitId={selectedUnitId}
                onNavigate={handleNavigate}
              />
            )}

            {activeTab === 'buildings' && (
              <BuildingsView
                onSelectBuildingForUnits={(bldgId, floorId) => handleNavigate('units', bldgId, floorId)}
                onNavigate3D={(bldgId) => handleNavigate('3d-viewer', bldgId)}
                showCreateModalInitial={modalInitial === 'building'}
                onCloseCreateModalInitial={() => setModalInitial(null)}
              />
            )}

            {activeTab === 'units' && (
              <UnitsView
                initialBuildingId={selectedBuildingId}
                initialFloorId={selectedFloorId}
                onNavigate3D={(bldgId, flId, uId) => handleNavigate('3d-viewer', bldgId, flId, uId)}
                showCreateModalInitial={modalInitial === 'unit'}
                onCloseCreateModalInitial={() => setModalInitial(null)}
              />
            )}

            {activeTab === 'tenants' && (
              <TenantsView
                showCreateModalInitial={modalInitial === 'tenant'}
                onCloseCreateModalInitial={() => setModalInitial(null)}
              />
            )}

            {activeTab === 'contracts' && (
              <ContractsView
                showCreateModalInitial={modalInitial === 'contract'}
                onCloseCreateModalInitial={() => setModalInitial(null)}
              />
            )}

            {activeTab === 'payments' && <PaymentsView />}

            {activeTab === 'receipts' && (
              <PhasePlaceholderView module="receipts" onNavigate={handleNavigate} />
            )}

            {activeTab === 'maintenance' && <MaintenanceView />}

            {activeTab === 'messages' && <MessagesView />}

            {activeTab === 'documents' && <DocumentsView />}

            {activeTab === 'reports' && <ReportsView />}

            {activeTab === 'saas' && <SuperAdminView />}

            {activeTab === 'users' && <UsersView />}

            {activeTab === 'audit' && <AuditLogsView />}

            {activeTab === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>
    </div>
  );
}

import { TelegramApp } from './components/telegram/TelegramApp.tsx';

function isTelegramWebApp(): boolean {
  const webApp = (window as any).Telegram?.WebApp;
  return Boolean(webApp?.initData);
}

export default function App() {
  const isTelegramRoute = window.location.pathname === '/telegram' || window.location.pathname.startsWith('/telegram/');
  const isTelegram = isTelegramRoute || isTelegramWebApp();

  return (
    <LanguageProvider>
      {isTelegram ? (
        <TelegramApp />
      ) : (
        <AuthProvider>
          <MainLayout />
        </AuthProvider>
      )}
    </LanguageProvider>
  );
}
