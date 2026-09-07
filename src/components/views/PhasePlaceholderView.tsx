import React from 'react';
import {
  Receipt,
  MessageSquare,
  BarChart3,
  Users2,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface PhasePlaceholderViewProps {
  module: 'receipts' | 'messages' | 'reports' | 'users';
  onNavigate: (tab: string) => void;
}

interface ModuleMeta {
  title: string;
  badge: string;
  phase: string;
  description: string;
  icon: React.ElementType;
  plannedFeatures: Array<{
    title: string;
    detail: string;
  }>;
  relatedPhase1Tab: string;
  relatedPhase1Label: string;
  statusNotice: string;
}

const MODULE_META: Record<string, ModuleMeta> = {
  receipts: {
    title: 'Receipts & Digital Stamp Invoicing',
    badge: 'Financial Module',
    phase: 'Coming in Phase 2',
    description:
      'Official fiscal receipt generation with digital Ethiopian Revenue tax compliance, QR code verification, and multi-currency print layouts.',
    icon: Receipt,
    plannedFeatures: [
      {
        title: 'Fiscal Stamp & QR Code Generation',
        detail: 'Automatic digital cryptographic signing for official tenant payment receipts with downloadable PDF certificates.',
      },
      {
        title: 'Direct Email & SMS Distribution',
        detail: 'Instant automated delivery of official receipts to tenant inboxes upon reconciliation of bank transfers or Telebirr.',
      },
      {
        title: 'Tax Authority Audit Archive',
        detail: 'One-click exportable fiscal reconciliation journals for ERCA / Ministry of Revenues compliance checks.',
      },
      {
        title: 'Batch Printing & Receipt Numbering',
        detail: 'Customizable corporate receipt series with anti-collision serial sequence generation.',
      },
    ],
    relatedPhase1Tab: 'payments',
    relatedPhase1Label: 'View Payments & Revenue (Phase 1)',
    statusNotice: 'Payment recording, status tracking, and receipt association are fully operational in Phase 1 Payments.',
  },
  messages: {
    title: 'Tenant Communications & Messaging',
    badge: 'Communication Hub',
    phase: 'Coming in Phase 2',
    description:
      'Unified tenant messaging channel with SMS gateway integration, building-wide emergency broadcasts, and direct in-app inquiry threads.',
    icon: MessageSquare,
    plannedFeatures: [
      {
        title: 'Direct Two-Way In-App Chat',
        detail: 'Real-time WebSocket message exchange between property managers, reception desk, and individual tenants.',
      },
      {
        title: 'Bulk SMS & Push Broadcasts',
        detail: 'Broadcast maintenance notices, water/power disruptions, or scheduled inspections directly via SMS gateways.',
      },
      {
        title: 'Automated Lease & Overdue Alerts',
        detail: 'Automated notification workflows triggered 30, 15, and 3 days before lease expirations or rent payment deadlines.',
      },
      {
        title: 'Inquiry & Support Ticketing',
        detail: 'Structured communication logs linked directly to tenant profiles, units, and maintenance records.',
      },
    ],
    relatedPhase1Tab: 'tenants',
    relatedPhase1Label: 'View Active Tenants (Phase 1)',
    statusNotice: 'Tenant contact details, phone numbers, and lease statuses are fully managed in Phase 1 Tenants.',
  },
  reports: {
    title: 'Executive Portfolio Reports & Analytics',
    badge: 'Intelligence Module',
    phase: 'Coming in Phase 2',
    description:
      'Advanced financial schedules, property-by-property yield calculations, occupancy heatmaps, and customizable executive Excel/PDF exports.',
    icon: BarChart3,
    plannedFeatures: [
      {
        title: 'Revenue & Net Operating Income (NOI)',
        detail: 'Comprehensive cash-flow analysis including gross collected rent, vacancy loss, and operating maintenance costs.',
      },
      {
        title: 'Lease Expiration Waterfall Schedule',
        detail: 'Predictive rollover risk matrix forecasting unit turnover across 3, 6, 12, and 24-month time horizons.',
      },
      {
        title: 'Tax & Depreciation Reports',
        detail: 'Formatted export tables tailored for statutory financial accounting and audit documentation.',
      },
      {
        title: 'Executive PDF & CSV Batch Exporter',
        detail: 'Automated monthly reporting packs compiled and sent to property owners and board stakeholders.',
      },
    ],
    relatedPhase1Tab: 'dashboard',
    relatedPhase1Label: 'View Live Dashboard KPIs (Phase 1)',
    statusNotice: 'Live occupancy metrics, portfolio collection rates, and unit statuses are currently monitored on the Phase 1 Dashboard.',
  },
  users: {
    title: 'User Management & Staff Directory',
    badge: 'Administration',
    phase: 'Coming in Phase 2',
    description:
      'Centralized directory of property managers, maintenance engineers, and receptionists with invitation links and activity metrics.',
    icon: Users2,
    plannedFeatures: [
      {
        title: 'Staff Invitation & Onboarding',
        detail: 'Invite new administrative staff and property personnel via magic email link or temporary password reset.',
      },
      {
        title: 'Per-Building Staff Assignment',
        detail: 'Restrict staff permissions to specific properties, floors, or commercial zones within the portfolio.',
      },
      {
        title: 'Staff Activity & Performance Metrics',
        detail: 'Inspect ticket resolution velocity, payment collection rates, and audit trail records per staff member.',
      },
      {
        title: 'Two-Factor Authentication (2FA) Enforcer',
        detail: 'Enforce mandatory multi-factor authentication policies for all privileged managerial and accounting roles.',
      },
    ],
    relatedPhase1Tab: 'settings',
    relatedPhase1Label: 'Manage Roles & RBAC in Settings (Phase 1)',
    statusNotice: 'Role-Based Access Control (RBAC), permission matrix inspection, and demo role switching are active in Phase 1 Settings.',
  },
};

export const PhasePlaceholderView: React.FC<PhasePlaceholderViewProps> = ({ module, onNavigate }) => {
  const config = MODULE_META[module] || MODULE_META.receipts;
  const Icon = config.icon;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner Notice */}
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
        <div className="flex items-center gap-2.5 font-medium">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Architectural Roadmap Notice:</strong> The {config.title} module is{' '}
            <span className="font-bold underline">{config.phase}</span>. The underlying data foundation and database schemas are already prepared in Phase 1.
          </span>
        </div>
        <button
          type="button"
          onClick={() => onNavigate(config.relatedPhase1Tab)}
          className="inline-flex items-center gap-1 font-semibold text-amber-800 hover:text-amber-950 underline self-start sm:self-auto shrink-0"
        >
          <span>{config.relatedPhase1Label}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Feature Hero Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {config.badge}
                </span>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-100/70 border border-amber-200 px-2 py-0.5 rounded-full">
                  {config.phase}
                </span>
              </div>
              <h1 className="text-xl font-bold text-slate-900">{config.title}</h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate(config.relatedPhase1Tab)}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <span>{config.relatedPhase1Label}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-sm text-slate-600 mt-4 leading-relaxed max-w-3xl">
          {config.description}
        </p>

        {/* Status Callout */}
        <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2.5 text-xs text-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-slate-900">Current Phase 1 Status:</strong> {config.statusNotice}
          </div>
        </div>

        {/* Planned Architecture Breakdown */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Planned Phase 2 Functional Specifications
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.plannedFeatures.map((feat, idx) => (
              <div
                key={feat.title}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <h3 className="text-xs font-bold text-slate-900">{feat.title}</h3>
                </div>
                <p className="text-xs text-slate-600 pl-7 leading-relaxed">{feat.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Enterprise Foundation Badge */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            <span>Database schema, API endpoints, and RBAC permissions are verified for Phase 2 integration.</span>
          </div>
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-500" />
            <span className="font-medium text-slate-700">Phase 1 Foundation Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};
