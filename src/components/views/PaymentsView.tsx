import React, { useEffect, useState } from 'react';
import {
  Receipt,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  CreditCard,
  Building2,
  Download,
  Filter,
} from 'lucide-react';
import { api } from '../../api/client.ts';
import { Payment } from '../../types/index.ts';
import { Badge } from '../common/Badge.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

export const PaymentsView: React.FC = () => {
  const { t } = useLanguage();
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const [paymentsData, invoicesData] = await Promise.all([
        api.getPayments(),
        api.getInvoices().catch(() => [])
      ]);
      
      const mappedInvoices = invoicesData.map((i: any) => ({
        id: i.invoice.id,
        paymentNumber: i.invoice.invoiceNumber,
        tenantId: i.invoice.tenantId,
        unitId: i.invoice.unitId,
        amount: i.invoice.amount,
        paymentDate: i.invoice.issueDate,
        paymentMethod: i.invoice.type,
        status: i.invoice.status,
        referenceNumber: 'Due: ' + i.invoice.dueDate.split('T')[0],
        notes: i.invoice.lateFeeApplied ? 'Late fee applied' : null,
        tenant: i.tenant,
        unit: i.unit,
      }));

      setPaymentsList([...paymentsData, ...mappedInvoices]);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoices = async () => {
    try {
      await api.generateInvoices();
      loadPayments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyLateFees = async () => {
    try {
      await api.applyLateFees();
      loadPayments();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = paymentsList.filter((p) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        p.paymentNumber.toLowerCase().includes(s) ||
        (p.tenant?.fullName && p.tenant.fullName.toLowerCase().includes(s)) ||
        (p.unit?.unitNumber && p.unit.unitNumber.toLowerCase().includes(s)) ||
        (p.referenceNumber && p.referenceNumber.toLowerCase().includes(s))
      );
    }
    return true;
  });

  const totalCollected = paymentsList
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const totalOverdue = paymentsList
    .filter((p) => p.status === 'OVERDUE')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  return (
    <div id="payments-view" className="space-y-6">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">{t('totalCollected')}</span>
          <div className="text-xl font-bold text-emerald-600 mt-1">
            {totalCollected.toLocaleString()} ETB
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Cleared through bank transfer & CBE Birr</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">{t('totalOverdue')}</span>
          <div className="text-xl font-bold text-rose-600 mt-1">
            {totalOverdue.toLocaleString()} ETB
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Pending collection from delinquent leases</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">{t('totalTransactions')}</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{paymentsList.length}</div>
          <p className="text-xs text-slate-500 mt-0.5">Audited payment receipts on record</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="payment-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPayments')}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleGenerateInvoices}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 px-3 rounded-lg font-medium transition-colors"
          >
            {t('generateInvoices')}
          </button>
          <button
            onClick={handleApplyLateFees}
            className="text-xs bg-rose-600 hover:bg-rose-700 text-white py-1.5 px-3 rounded-lg font-medium transition-colors"
          >
            {t('applyLateFees')}
          </button>
          <select
          id="payment-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
        >
          <option value="ALL">All Payment Statuses</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
          <option value="PENDING">Pending</option>
            <option value="PARTIAL">Partial</option>
          </select>
        </div>
      </div>

      {/* Payment Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading payments ledger...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center p-6 text-xs text-slate-400">No payment records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Payment #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Tenant & Unit</th>
                  <th className="py-3 px-4">Method & Ref</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Official Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} id={`payment-row-${p.id}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.paymentNumber}</td>
                    <td className="py-3 px-4 text-slate-600">{p.paymentDate}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{p.tenant?.fullName || 'N/A'}</div>
                      <div className="text-[11px] text-slate-400">Unit {p.unit?.unitNumber || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{p.paymentMethod}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{p.referenceNumber || 'Cash/Manual'}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {parseFloat(p.amount).toLocaleString()} ETB
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={p.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {p.receipt ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          <FileCheck className="w-3.5 h-3.5" />
                          {p.receipt.receiptNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Unissued</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
