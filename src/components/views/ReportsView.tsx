import React, { useEffect, useState } from 'react';
import { api } from '../../api/client.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { Download, TrendingUp, Users, Wrench } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { hasPermission } = useAuth();
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await api.getReportMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load report metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (type: string) => {
    window.open(api.exportReport(type), '_blank');
  };

  if (loading) {
    return <div className="py-16 text-center text-xs text-slate-400">Loading reports...</div>;
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-rose-500 mb-2">{error}</p>
        {!hasPermission('reports.read') && (
          <p className="text-xs text-slate-500">You do not have permission to view this module.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{t('reportsAnalyticsTitle')}</h2>
          <p className="text-xs text-slate-500">Financial, operational, and maintenance metrics overview</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Financial Metrics */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                {t('financialMetricsCard')}
              </h3>
              <button
                onClick={() => handleExport('financial')}
                className="text-xs flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors"
                title={t('exportToCsvBtn')}
              >
                <Download className="w-3 h-3" />
                {t('exportToCsvBtn')}
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('totalRevenueLabel')}</p>
                <p className="text-2xl font-bold text-slate-900">{metrics.financial.totalRevenue.toLocaleString()} ETB</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('outstandingBalanceLabel')}</p>
                <p className="text-lg font-semibold text-rose-600">{metrics.financial.outstandingBalances.toLocaleString()} ETB</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Maintenance Costs</p>
                <p className="text-lg font-semibold text-amber-600">{metrics.financial.totalMaintenanceCosts.toLocaleString()} ETB</p>
              </div>
            </div>
          </div>
        </div>

        {/* Operational Metrics */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                {t('operationalMetricsCard')}
              </h3>
              <button
                onClick={() => handleExport('operational')}
                className="text-xs flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors"
                title={t('exportToCsvBtn')}
              >
                <Download className="w-3 h-3" />
                {t('exportToCsvBtn')}
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('occupancyRateLabel')}</p>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-bold text-slate-900">{metrics.operational.occupancyRate}%</p>
                  <p className="text-xs font-medium text-slate-500 mb-1">
                    ({metrics.operational.occupiedUnits} / {metrics.operational.totalUnits} Units)
                  </p>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('activeLeasesLabel')}</p>
                <p className="text-lg font-semibold text-slate-700">{metrics.operational.activeLeases}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Vacant Units</p>
                <p className="text-lg font-semibold text-slate-700">{metrics.operational.vacantUnits}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance Metrics */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-slate-500" />
                {t('maintenanceMetricsCard')}
              </h3>
              <button
                onClick={() => handleExport('maintenance')}
                className="text-xs flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors"
                title={t('exportToCsvBtn')}
              >
                <Download className="w-3 h-3" />
                {t('exportToCsvBtn')}
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('openTicketsLabel')}</p>
                <p className="text-2xl font-bold text-amber-500">{metrics.maintenance.openTickets}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t('resolvedTicketsLabel')}</p>
                <p className="text-lg font-semibold text-emerald-600">{metrics.maintenance.resolvedTickets}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Lifetime Tickets</p>
                <p className="text-lg font-semibold text-slate-700">{metrics.maintenance.totalTickets}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

