import React, { createContext, useContext, useState, useEffect } from 'react';

export type Locale = 'en' | 'am';

export interface Translations {
  // Navigation & Branding
  brandName: string;
  brandTagline: string;
  threeDViewer: string;
  dashboard: string;
  buildings: string;
  floorsAndUnits: string;
  tenants: string;
  contracts: string;
  payments: string;
  maintenance: string;

  // 3D Scene Controls & Actions
  selectBuilding: string;
  selectFloor: string;
  allFloors: string;
  floorLevel: string;
  searchUnitPlaceholder: string;
  searchResultCount: string;
  noUnitsFound: string;
  resetView: string;
  explodeFloors: string;
  collapseFloors: string;
  viewPerspective: string;
  viewTop: string;
  viewFront: string;
  autoRotate: string;
  controlsTip: string;
  full3DStudio: string;
  compact3DPreview: string;

  // Statuses
  statusVacant: string;
  statusOccupied: string;
  statusReserved: string;
  statusMaintenance: string;
  allStatuses: string;
  filterByStatus: string;

  // Unit Details & Drawer
  unitDetails: string;
  unitProfile: string;
  specifications: string;
  currentLease: string;
  tenantInfo: string;
  noActiveLease: string;
  createLease: string;
  viewTenant: string;
  viewLease: string;
  area: string;
  sqm: string;
  bedrooms: string;
  bathrooms: string;
  contractedRent: string;
  requiredDeposit: string;
  agreementNumber: string;
  leasePeriod: string;
  monthlyRent: string;
  paymentLedger: string;
  maintenanceTickets: string;
  viewIn3D: string;
  close: string;

  // Billing & Invoicing (Phase 5)
  generateInvoices: string;
  applyLateFees: string;
  invoicesGenerated: string;
  lateFeesApplied: string;
  totalCollected: string;
  totalOverdue: string;
  totalTransactions: string;
  searchPayments: string;

  // Maintenance (Phase 6)
  newWorkOrder: string;
  workOrdersTitle: string;
  workOrdersDesc: string;
  statusPending: string;
  statusInProgress: string;
  statusResolved: string;
  statusCancelled: string;
  assignContractor: string;
  enterCost: string;
  markBillable: string;
  updateTicket: string;
  photoUrlPlaceholder: string;

  // Messaging (Phase 7)
  messageCenter: string;
  notificationsTitle: string;
  sendMessageBtn: string;
  typeMessagePlaceholder: string;
  noMessages: string;
  noNotifications: string;
  markAsRead: string;
  sendAnnouncement: string;

  // Reports (Phase 8)
  reportsAnalyticsTitle: string;
  exportToCsvBtn: string;
  financialMetricsCard: string;
  operationalMetricsCard: string;
  maintenanceMetricsCard: string;
  totalRevenueLabel: string;
  outstandingBalanceLabel: string;
  occupancyRateLabel: string;
  activeLeasesLabel: string;
  openTicketsLabel: string;
  resolvedTicketsLabel: string;

  // SaaS Admin (Phase 9)
  saasAdminTitle: string;
  saasAdminDesc: string;
  systemStats: string;
  totalOrgs: string;
  totalUsersSys: string;
  orgsList: string;
  suspendOrg: string;
  activateOrg: string;
  globalUsers: string;
  globalAuditLogs: string;

  // Tenant Portal
  tenantPortalBadge: string;
  tenantRestrictedNotice: string;
  yourLeasedUnit: string;

  // Empty / Loading / Error states
  loadingScene: string;
  loadingError: string;
  retry: string;
  noBuildingsFound: string;
}

const translations: Record<Locale, Translations> = {
  en: {
    brandName: 'PropertyCore',
    brandTagline: 'Building & Tenant Management',
    threeDViewer: '3D Building Viewer',
    dashboard: 'Dashboard',
    buildings: 'Buildings',
    floorsAndUnits: 'Floors & Units',
    tenants: 'Tenants',
    contracts: 'Contracts & Leases',
    payments: 'Payments',
    maintenance: 'Maintenance',

    selectBuilding: 'Select Building',
    selectFloor: 'Floor Level',
    allFloors: 'All Floors',
    floorLevel: 'Level',
    searchUnitPlaceholder: 'Search unit #, type, or tenant...',
    searchResultCount: 'matches',
    noUnitsFound: 'No units matched your query',
    resetView: 'Reset Camera',
    explodeFloors: 'Explode Floors',
    collapseFloors: 'Collapse',
    viewPerspective: '3D Orbit',
    viewTop: 'Top View',
    viewFront: 'Elevation',
    autoRotate: 'Turntable',
    controlsTip: 'Left-drag: Rotate • Right-drag: Pan • Scroll: Zoom • Click Unit: Inspect',
    full3DStudio: 'Open 3D Studio',
    compact3DPreview: '3D Space Preview',

    statusVacant: 'Vacant',
    statusOccupied: 'Occupied',
    statusReserved: 'Reserved',
    statusMaintenance: 'Maintenance',
    allStatuses: 'All Statuses',
    filterByStatus: 'Filter Status',

    unitDetails: 'Unit Details',
    unitProfile: 'Unit Profile',
    specifications: 'Specifications',
    currentLease: 'Active Lease',
    tenantInfo: 'Tenant Profile',
    noActiveLease: 'No active lease registered. Unit is ready for occupancy.',
    createLease: 'Create Lease Agreement',
    viewTenant: 'View Tenant Profile',
    viewLease: 'View Lease Contract',
    area: 'Total Area',
    sqm: 'sqm',
    bedrooms: 'Bedrooms',
    bathrooms: 'Bathrooms',
    contractedRent: 'Contracted Rent',
    requiredDeposit: 'Security Deposit',
    agreementNumber: 'Agreement #',
    leasePeriod: 'Lease Term',
    monthlyRent: 'Monthly Rent',
    paymentLedger: 'Payment Ledger',
    maintenanceTickets: 'Maintenance Tickets',
    viewIn3D: 'View in 3D',
    close: 'Close',

    generateInvoices: 'Generate Rent Invoices',
    applyLateFees: 'Apply Late Fees',
    invoicesGenerated: 'Invoices Generated',
    lateFeesApplied: 'Late Fees Applied',
    totalCollected: 'Total Collected',
    totalOverdue: 'Outstanding / Overdue',
    totalTransactions: 'Total Transactions',
    searchPayments: 'Search payment #, tenant, unit, or bank ref...',

    newWorkOrder: 'New Work Order',
    workOrdersTitle: 'Work Orders & Maintenance Tickets',
    workOrdersDesc: 'Track building defects, HVAC, electrical, and plumbing tickets',
    statusPending: 'Pending',
    statusInProgress: 'In Progress',
    statusResolved: 'Resolved',
    statusCancelled: 'Cancelled',
    assignContractor: 'Assign Contractor',
    enterCost: 'Repair Cost (ETB)',
    markBillable: 'Bill to Tenant',
    updateTicket: 'Update Ticket',
    photoUrlPlaceholder: 'Photo URL (optional)',

    messageCenter: 'Message Center',
    notificationsTitle: 'Notifications',
    sendMessageBtn: 'Send Message',
    typeMessagePlaceholder: 'Type your message...',
    noMessages: 'No messages found.',
    noNotifications: 'You have no new notifications.',
    markAsRead: 'Mark as Read',
    sendAnnouncement: 'Broadcast Announcement',

    reportsAnalyticsTitle: 'Reports & Analytics',
    exportToCsvBtn: 'Export CSV',
    financialMetricsCard: 'Financial Performance',
    operationalMetricsCard: 'Operational Metrics',
    maintenanceMetricsCard: 'Maintenance Performance',
    totalRevenueLabel: 'Total Revenue',
    outstandingBalanceLabel: 'Outstanding Balances',
    occupancyRateLabel: 'Occupancy Rate',
    activeLeasesLabel: 'Active Leases',
    openTicketsLabel: 'Open Tickets',
    resolvedTicketsLabel: 'Resolved Tickets',

    saasAdminTitle: 'SaaS Administration',
    saasAdminDesc: 'Global multi-tenancy management and system metrics',
    systemStats: 'System Metrics',
    totalOrgs: 'Total Organizations',
    totalUsersSys: 'Total Users',
    orgsList: 'Organizations List',
    suspendOrg: 'Suspend',
    activateOrg: 'Activate',
    globalUsers: 'Global User Management',
    globalAuditLogs: 'System Audit Logs',

    tenantPortalBadge: 'Tenant Portal Access',
    tenantRestrictedNotice: 'Displaying your leased unit and architectural building context.',
    yourLeasedUnit: 'Your Leased Unit',

    loadingScene: 'Loading architectural 3D building model...',
    loadingError: 'Unable to load 3D scene data.',
    retry: 'Retry',
    noBuildingsFound: 'No buildings found in your organization portfolio.',
  },
  am: {
    brandName: 'ፕሮፐርቲ ኮር',
    brandTagline: 'የህንፃ እና ተከራዮች አስተዳደር ሥርዓት',
    threeDViewer: 'የህንፃ 3D እይታ',
    dashboard: 'ዳሽቦርድ',
    buildings: 'ህንፃዎች',
    floorsAndUnits: 'ፎቆችና ክፍሎች',
    tenants: 'ተከራዮች',
    contracts: 'ውሎች እና ኪራዮች',
    payments: 'ክፍያዎች',
    maintenance: 'ጥገና',

    selectBuilding: 'ህንፃ ይምረጡ',
    selectFloor: 'የፎቅ ደረጃ',
    allFloors: 'ሁሉም ፎቆች',
    floorLevel: 'ደረጃ',
    searchUnitPlaceholder: 'የክፍል ቁጥር፣ ዓይነት፣ ወይም ተከራይ ይፈልጉ...',
    searchResultCount: 'ተገኝቷል',
    noUnitsFound: 'ምንም የተገኘ ክፍል የለም',
    resetView: 'እይታን አድስ',
    explodeFloors: 'ፎቆችን ዘርጋ',
    collapseFloors: 'ፎቆችን ሰብስብ',
    viewPerspective: '3D እይታ',
    viewTop: 'ከላይ እይታ',
    viewFront: 'የፊት ለፊት እይታ',
    autoRotate: 'ማዞሪያ',
    controlsTip: 'ግራ-መጎተት: አሽከርክር • ቀኝ-መጎተት: አንቀሳቅስ • ማሸብለል: አቅርብ/አርቅ • ክፍል ጠቅ ያድርጉ: ይመልከቱ',
    full3DStudio: 'ሙሉ 3D እይታን ክፈት',
    compact3DPreview: 'የ3D ህንፃ ቅድመ-እይታ',

    statusVacant: 'ክፍት',
    statusOccupied: 'የተያዘ',
    statusReserved: 'የተያዘ (ቅድመ)',
    statusMaintenance: 'ጥገና ላይ',
    allStatuses: 'ሁሉም ሁኔታዎች',
    filterByStatus: 'በሁኔታ አጣራ',

    unitDetails: 'የክፍል ዝርዝር',
    unitProfile: 'የክፍል መገለጫ',
    specifications: 'ዝርዝር መግለጫ',
    currentLease: 'ንቁ የኪራይ ውል',
    tenantInfo: 'የተከራይ መረጃ',
    noActiveLease: 'ምንም ንቁ ውል የለም። ክፍሉ ለኪራይ ዝግጁ ነው።',
    createLease: 'አዲስ የኪራይ ውል ፍጠር',
    viewTenant: 'የተከራይ መረጃን ይመልከቱ',
    viewLease: 'የኪራይ ውሉን ይመልከቱ',
    area: 'ጠቅላላ ስፋት',
    sqm: 'ካ.ሜ',
    bedrooms: 'መኝታ ክፍሎች',
    bathrooms: 'መታጠቢያ ቤቶች',
    contractedRent: 'የተዋዋለ ኪራይ',
    requiredDeposit: 'የዋስትና ተቀማጭ',
    agreementNumber: 'የስምምነት ቁጥር',
    leasePeriod: 'የኪራይ ጊዜ',
    monthlyRent: 'ወርሃዊ ኪራይ',
    paymentLedger: 'ክፍያዎች',
    maintenanceTickets: 'የጥገና ጥያቄዎች',
    viewIn3D: 'በ 3D ይመልከቱ',
    close: 'ዝጋ',

    generateInvoices: 'የኪራይ ክፍያ ደረሰኞችን ፍጠር',
    applyLateFees: 'የዘገዩ ክፍያዎችን ጨምር',
    invoicesGenerated: 'ክፍያዎች ተፈጥረዋል',
    lateFeesApplied: 'የዘገዩ ክፍያዎች ተጨምረዋል',
    totalCollected: 'አጠቃላይ የተሰበሰበ',
    totalOverdue: 'ያልተከፈለ / የዘገየ',
    totalTransactions: 'አጠቃላይ ክፍያዎች',
    searchPayments: 'የክፍያ ቁጥር፣ ተከራይ፣ ክፍል፣ ወይም የባንክ ማጣቀሻ ይፈልጉ...',

    newWorkOrder: 'አዲስ የጥገና ጥያቄ',
    workOrdersTitle: 'የጥገና ትዕዛዞች እና ጥያቄዎች',
    workOrdersDesc: 'የህንፃ ጉድለቶች፣ የኤሌክትሪክ እና የቧንቧ ጥገናዎችን ይከታተሉ',
    statusPending: 'በመጠባበቅ ላይ',
    statusInProgress: 'በሂደት ላይ',
    statusResolved: 'ተፈትቷል',
    statusCancelled: 'ተሰርዟል',
    assignContractor: 'ተቋራጭ መድብ',
    enterCost: 'የጥገና ወጪ (ETB)',
    markBillable: 'ለተከራይ ክፍያ አስከፍል',
    updateTicket: 'ጥያቄውን አዘምን',
    photoUrlPlaceholder: 'የፎቶ አገናኝ (አማራጭ)',

    messageCenter: 'የመልእክት ማዕከል',
    notificationsTitle: 'ማሳወቂያዎች',
    sendMessageBtn: 'መልእክት ላክ',
    typeMessagePlaceholder: 'መልእክትዎን ይጻፉ...',
    noMessages: 'ምንም መልእክት የለም።',
    noNotifications: 'አዲስ ማሳወቂያዎች የሉዎትም።',
    markAsRead: 'እንደተነበበ ምልክት አድርግ',
    sendAnnouncement: 'ማስታወቂያ አስተላልፍ',

    reportsAnalyticsTitle: 'ሪፖርቶች እና ትንታኔዎች',
    exportToCsvBtn: 'ወደ CSV ላክ',
    financialMetricsCard: 'የፋይናንስ አፈጻጸም',
    operationalMetricsCard: 'የስራ ትንታኔዎች',
    maintenanceMetricsCard: 'የጥገና አፈጻጸም',
    totalRevenueLabel: 'አጠቃላይ ገቢ',
    outstandingBalanceLabel: 'ያልተከፈሉ ቀሪ ሂሳቦች',
    occupancyRateLabel: 'የተያዙ ክፍሎች መጠን',
    activeLeasesLabel: 'ንቁ የኪራይ ውሎች',
    openTicketsLabel: 'ክፍት የጥገና ጥያቄዎች',
    resolvedTicketsLabel: 'የተፈቱ ጥያቄዎች',

    saasAdminTitle: 'የSaaS አስተዳደር',
    saasAdminDesc: 'ዓለም አቀፍ የደንበኞች አስተዳደር እና የስርዓት መረጃዎች',
    systemStats: 'የስርዓት አሃዞች',
    totalOrgs: 'አጠቃላይ ድርጅቶች',
    totalUsersSys: 'አጠቃላይ ተጠቃሚዎች',
    orgsList: 'የድርጅቶች ዝርዝር',
    suspendOrg: 'አግድ',
    activateOrg: 'አንቃ',
    globalUsers: 'የተጠቃሚዎች አስተዳደር',
    globalAuditLogs: 'የስርዓት የኦዲት መዝገቦች',

    tenantPortalBadge: 'የተከራይ ፖርታል',
    tenantRestrictedNotice: 'የተከራዩት ክፍል እና የህንፃው ቅርጽ እየታየ ነው።',
    yourLeasedUnit: 'የእርስዎ የተከራየ ክፍል',

    loadingScene: 'የህንፃው 3D ሞዴል በመጫን ላይ...',
    loadingError: 'የ 3D መረጃውን ማግኘት አልተቻለም።',
    retry: 'እንደገና ሞክር',
    noBuildingsFound: 'በድርጅቱ ፖርትፎሊዮ ውስጥ ምንም የተመዘገበ ህንፃ የለም።',
  },
};

interface LanguageContextType {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  t: (key: keyof Translations) => string;
  isAmharic: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    return (localStorage.getItem('apex_locale') as Locale) || 'en';
  });

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('apex_locale', newLocale);
  };

  const t = (key: keyof Translations): string => {
    return translations[locale][key] || translations.en[key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, isAmharic: locale === 'am' }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
