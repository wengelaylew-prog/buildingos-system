import React, { useEffect, useState } from 'react';
import { Activity, Plus, Users, ArrowRight, MoreVertical } from 'lucide-react';
import { api } from '../../api/client.ts';
import { Badge } from '../common/Badge.tsx';
import { TenantQuickProfileModal } from '../common/TenantQuickProfileModal.tsx';
import { MessageSquare } from 'lucide-react';

type UtilityTab = 'OVERVIEW' | 'BILLS' | 'READINGS' | 'SHARED';

export const UtilityManagementView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<UtilityTab>('OVERVIEW');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [bills, setBills] = useState<any[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const openProfile = (tenant: any, unit: any, bill: any) => {
    setSelectedTenant(tenant);
    setSelectedUnit(unit);
    setSelectedBill(bill);
    setIsProfileOpen(true);
  };
  
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'OVERVIEW') {
        const data = await api.getUtilitySummary();
        setSummary(data);
      } else if (activeTab === 'BILLS') {
        const data = await api.getUtilityBills();
        setBills(data as any[]);
      }
    } catch (err) {
      console.error('Failed to load utility data:', err);
    } finally {
      setLoading(false);
    }
  };

  const tabs: { id: UtilityTab; label: string }[] = [
    { id: 'OVERVIEW', label: 'አጠቃላይ እይታ (Overview)' },
    { id: 'BILLS', label: 'ቢሌዎች (All Bills)' },
    { id: 'READINGS', label: 'የሜትር ንባብ (Readings)' },
    { id: 'SHARED', label: 'የጋራ ወጪ (Shared Bills)' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Activity className="w-8 h-8 text-indigo-400" />
            </div>
            የፍጆታ አገልግሎቶች
          </h1>
          <p className="text-slate-400 mt-2">የመብራት፣ የውሃ፣ የኢንተርኔት እና የጋራ ወጪዎችን ያስተዳድሩ። (Manage utilities and shared bills)</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 bg-slate-900/50 p-1.5 rounded-xl w-full overflow-x-auto border border-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[140px] py-3 text-sm font-semibold rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-indigo-400">
          <Activity className="w-8 h-8 animate-pulse" />
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6">
          
          {activeTab === 'OVERVIEW' && summary && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700/50 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full" />
                  <p className="text-slate-400 text-sm font-medium">ጠቅላላ የተጠየቀ (Total Billed)</p>
                  <p className="text-3xl font-bold text-white mt-2">{summary.totalBilled?.toLocaleString()} <span className="text-lg text-slate-500">ETB</span></p>
                </div>
                <div className="bg-slate-800/80 p-5 rounded-xl border border-emerald-700/30 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full" />
                  <p className="text-emerald-400/80 text-sm font-medium">የተከፈለ (Paid)</p>
                  <p className="text-3xl font-bold text-emerald-400 mt-2">{summary.totalPaid?.toLocaleString()} <span className="text-lg text-emerald-700">ETB</span></p>
                </div>
                <div className="bg-slate-800/80 p-5 rounded-xl border border-amber-700/30 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full" />
                  <p className="text-amber-400/80 text-sm font-medium">ያልተከፈለ (Pending)</p>
                  <p className="text-3xl font-bold text-amber-400 mt-2">{summary.totalPending?.toLocaleString()} <span className="text-lg text-amber-700">ETB</span></p>
                </div>
                <div className="bg-slate-800/80 p-5 rounded-xl border border-rose-700/30 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-bl-full" />
                  <p className="text-rose-400/80 text-sm font-medium">ያለፈበት (Overdue)</p>
                  <p className="text-3xl font-bold text-rose-400 mt-2">{summary.totalOverdue?.toLocaleString()} <span className="text-lg text-rose-700">ETB</span></p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-3">በፍጆታ አይነት (By Utility Type)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(summary.byType || {}).map(([type, stats]: [string, any]) => (
                    <div key={type} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:bg-slate-800 transition-colors group">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-slate-700 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                          <Activity className="w-5 h-5 text-indigo-400" />
                        </div>
                        <h4 className="font-bold text-slate-200">{type}</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center bg-slate-900/50 p-2 rounded">
                          <span className="text-slate-400">Billed:</span>
                          <span className="text-white font-medium">{stats.billed?.toLocaleString()} ETB</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-900/50 p-2 rounded">
                          <span className="text-slate-400">Paid:</span>
                          <span className="text-emerald-400 font-medium">{stats.paid?.toLocaleString()} ETB</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-900/50 p-2 rounded">
                          <span className="text-slate-400">Pending:</span>
                          <span className="text-amber-400 font-medium">{stats.pending?.toLocaleString()} ETB</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'BILLS' && (
            <div className="overflow-x-auto rounded-xl border border-slate-700/50">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-800/80">
                  <tr>
                    <th className="py-4 px-5 text-sm font-semibold text-slate-300">Bill #</th>
                    <th className="py-4 px-5 text-sm font-semibold text-slate-300">ክፍል (Unit)</th>
                    <th className="py-4 px-5 text-sm font-semibold text-slate-300">አይነት (Type)</th>
                    <th className="py-4 px-5 text-sm font-semibold text-slate-300">ወር (Period)</th>
                    <th className="py-4 px-5 text-sm font-semibold text-slate-300">ዋጋ (Amount)</th>
                    <th className="py-4 px-5 text-sm font-semibold text-slate-300">ሁኔታ (Status)</th>
                    <th className="py-4 px-5 text-sm font-semibold text-slate-300 text-right">ድርጊት (Action)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {bills.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500 bg-slate-900/20">ምንም ቢሌ አልተገኘም። (No bills found)</td>
                    </tr>
                  ) : (
                    bills.map(({ bill, unit, tenant }) => (
                      <tr key={bill.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-5 font-mono text-xs text-slate-400">{bill.billNumber}</td>
                        <td className="py-4 px-5">
                          <button 
                            onClick={() => tenant && openProfile(tenant, unit, bill)}
                            className="text-left group"
                            disabled={!tenant}
                          >
                            <div className="font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">{unit?.unitNumber || 'Shared (የጋራ)'}</div>
                            <div className="text-xs text-slate-500 mt-1 group-hover:text-indigo-300 transition-colors flex items-center gap-1">
                              {tenant?.fullName || '-'}
                            </div>
                          </button>
                        </td>
                        <td className="py-4 px-5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                            {bill.utilityType}
                          </span>
                        </td>
                        <td className="py-4 px-5 font-medium text-slate-300">{bill.billingPeriod}</td>
                        <td className="py-4 px-5">
                          <div className="font-bold text-white">{parseFloat(bill.amount).toLocaleString()} ETB</div>
                          {parseFloat(bill.paidAmount) > 0 && (
                            <div className="text-xs text-emerald-400 font-medium mt-1">Paid: {parseFloat(bill.paidAmount).toLocaleString()}</div>
                          )}
                          {bill.status === 'OVERDUE' && tenant && (
                            <button 
                              onClick={() => openProfile(tenant, unit, bill)}
                              className="flex items-center gap-1 text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded mt-1.5 hover:bg-rose-500/30 transition-colors"
                            >
                              <MessageSquare className="w-3 h-3" /> ላክ (Send)
                            </button>
                          )}
                        </td>
                        <td className="py-4 px-5">
                          <Badge status={bill.status} />
                        </td>
                        <td className="py-4 px-5 text-right">
                          {(bill.status === 'PENDING' || bill.status === 'PARTIALLY_PAID') ? (
                            <button className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
                              ክፈል (Pay)
                            </button>
                          ) : (
                            <button className="text-slate-500 hover:text-white p-2">
                              <MoreVertical className="w-5 h-5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {activeTab === 'READINGS' && (
            <div className="flex flex-col items-center justify-center py-16 text-center max-w-lg mx-auto">
              <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
                <Activity className="w-10 h-10 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">የሜትር ንባብ (Meter Readings)</h3>
              <p className="text-slate-400 mb-8 leading-relaxed">
                የእያንዳንዱን ክፍል የውሃ፣ የመብራት እና የጋዝ ፍጆታ ንባብ ያስገቡ። ቢሌው በራሱ ተሰልቶ ለተከራዮች ይላካል።
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <button className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-4 rounded-xl font-bold transition-all shadow-lg shadow-indigo-900/20 flex flex-col items-center gap-2 group">
                  <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span>ነጠላ ማስገቢያ (Single)</span>
                </button>
                <button className="flex-1 bg-slate-800 hover:bg-slate-700 text-white px-6 py-4 rounded-xl font-bold transition-all border border-slate-700 hover:border-slate-500 flex flex-col items-center gap-2 group">
                  <Users className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
                  <span>በጅምላ ማስገቢያ (Bulk)</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'SHARED' && (
            <div className="flex flex-col items-center justify-center py-16 text-center max-w-lg mx-auto">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                <Activity className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">የጋራ ወጪ ማካፈያ (Split Shared Bill)</h3>
              <p className="text-slate-400 mb-8 leading-relaxed">
                የህንፃውን አጠቃላይ የመብራት ወይም የውሃ ወጪ ለሁሉም ክፍሎች በእኩል ወይም በካሬ ሜትር ስፋት መጠን ያካፍሉ።
              </p>
              <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-3 group">
                ማካፈል ይጀምሩ (Start Split) <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
          
        </div>
      )}
      <TenantQuickProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        tenant={selectedTenant}
        unit={selectedUnit}
        billContext={selectedBill}
        overdueAmount={selectedBill && selectedBill.status === 'OVERDUE' ? parseFloat(selectedBill.amount) - parseFloat(selectedBill.paidAmount) : 0}
      />
    </div>
  );
};

