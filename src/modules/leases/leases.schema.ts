import { ApiFieldError } from '../common/api-response.ts';
import { CreateLeaseDTO, UpdateLeaseDTO, RenewLeaseDTO, LeaseStatus } from './leases.types.ts';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const VALID_LEASE_STATUSES: LeaseStatus[] = [
  'DRAFT',
  'ACTIVE',
  'EXPIRING',
  'EXPIRED',
  'TERMINATED',
  'CANCELLED',
];

function isValidDate(dateStr: string): boolean {
  if (!DATE_REGEX.test(dateStr)) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

export function validateCreateLease(data: any): {
  isValid: boolean;
  errors: ApiFieldError[];
  validatedData?: CreateLeaseDTO;
} {
  const errors: ApiFieldError[] = [];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: [{ field: 'body', code: 'INVALID_BODY', message: 'Request body must be a valid JSON object' }],
    };
  }

  // tenantId
  const tenantId = data.tenantId || data.tenant_id;
  if (!tenantId || typeof tenantId !== 'string' || tenantId.trim().length === 0) {
    errors.push({ field: 'tenantId', code: 'REQUIRED', message: 'Tenant ID is required' });
  }

  // unitId
  const unitId = data.unitId || data.unit_id;
  if (!unitId || typeof unitId !== 'string' || unitId.trim().length === 0) {
    errors.push({ field: 'unitId', code: 'REQUIRED', message: 'Unit ID is required' });
  }

  // startDate
  const startDate = data.startDate || data.start_date;
  if (!startDate || typeof startDate !== 'string' || !isValidDate(startDate.trim())) {
    errors.push({
      field: 'startDate',
      code: 'INVALID_DATE',
      message: 'Start date is required and must be in YYYY-MM-DD format',
    });
  }

  // endDate
  const endDate = data.endDate || data.end_date;
  if (!endDate || typeof endDate !== 'string' || !isValidDate(endDate.trim())) {
    errors.push({
      field: 'endDate',
      code: 'INVALID_DATE',
      message: 'End date is required and must be in YYYY-MM-DD format',
    });
  }

  // Date order check
  if (startDate && endDate && isValidDate(startDate) && isValidDate(endDate)) {
    if (new Date(endDate.trim()) <= new Date(startDate.trim())) {
      errors.push({
        field: 'endDate',
        code: 'INVALID_LEASE_DATES',
        message: 'End date must be strictly after start date',
      });
    }
  }

  // rentAmount / monthlyRent
  const rawRent =
    data.rentAmount !== undefined
      ? data.rentAmount
      : data.monthlyRent !== undefined
      ? data.monthlyRent
      : data.monthly_rent;
  let rentAmount = '0';
  if (rawRent === undefined || rawRent === null || rawRent === '') {
    errors.push({ field: 'rentAmount', code: 'REQUIRED', message: 'Rent amount is required' });
  } else {
    const num = Number(rawRent);
    if (isNaN(num) || num < 0) {
      errors.push({
        field: 'rentAmount',
        code: 'INVALID_RENT_AMOUNT',
        message: 'Rent amount must be a non-negative number',
      });
    } else {
      rentAmount = num.toString();
    }
  }

  // depositAmount / deposit
  const rawDeposit =
    data.depositAmount !== undefined
      ? data.depositAmount
      : data.deposit !== undefined
      ? data.deposit
      : data.deposit_amount;
  let depositAmount = '0';
  if (rawDeposit !== undefined && rawDeposit !== null && rawDeposit !== '') {
    const num = Number(rawDeposit);
    if (isNaN(num) || num < 0) {
      errors.push({
        field: 'depositAmount',
        code: 'INVALID_DEPOSIT_AMOUNT',
        message: 'Deposit amount must be a non-negative number',
      });
    } else {
      depositAmount = num.toString();
    }
  }

  // status
  const rawStatus = data.status || data.contractStatus || data.contract_status;
  let status: LeaseStatus = 'ACTIVE';
  if (rawStatus) {
    const upper = String(rawStatus).toUpperCase() as LeaseStatus;
    if (!VALID_LEASE_STATUSES.includes(upper)) {
      errors.push({
        field: 'status',
        code: 'INVALID_STATUS',
        message: `Status must be one of: ${VALID_LEASE_STATUSES.join(', ')}`,
      });
    } else {
      status = upper;
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    validatedData: {
      tenantId: String(tenantId).trim(),
      unitId: String(unitId).trim(),
      startDate: String(startDate).trim(),
      endDate: String(endDate).trim(),
      rentAmount,
      depositAmount,
      paymentFrequency: data.paymentFrequency ? String(data.paymentFrequency).trim() : 'Monthly',
      status,
      notes: data.notes ? String(data.notes).trim() : undefined,
      documentUrl: data.documentUrl ? String(data.documentUrl).trim() : undefined,
    },
  };
}

export function validateUpdateLease(data: any): {
  isValid: boolean;
  errors: ApiFieldError[];
  validatedData?: UpdateLeaseDTO;
} {
  const errors: ApiFieldError[] = [];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: [{ field: 'body', code: 'INVALID_BODY', message: 'Request body must be a valid JSON object' }],
    };
  }

  const validated: UpdateLeaseDTO = {};

  const startDate = data.startDate || data.start_date;
  if (startDate !== undefined) {
    if (!isValidDate(String(startDate).trim())) {
      errors.push({ field: 'startDate', code: 'INVALID_DATE', message: 'Start date must be in YYYY-MM-DD format' });
    } else {
      validated.startDate = String(startDate).trim();
    }
  }

  const endDate = data.endDate || data.end_date;
  if (endDate !== undefined) {
    if (!isValidDate(String(endDate).trim())) {
      errors.push({ field: 'endDate', code: 'INVALID_DATE', message: 'End date must be in YYYY-MM-DD format' });
    } else {
      validated.endDate = String(endDate).trim();
    }
  }

  if (validated.startDate && validated.endDate) {
    if (new Date(validated.endDate) <= new Date(validated.startDate)) {
      errors.push({
        field: 'endDate',
        code: 'INVALID_LEASE_DATES',
        message: 'End date must be strictly after start date',
      });
    }
  }

  const rawRent =
    data.rentAmount !== undefined
      ? data.rentAmount
      : data.monthlyRent !== undefined
      ? data.monthlyRent
      : data.monthly_rent;
  if (rawRent !== undefined && rawRent !== null && rawRent !== '') {
    const num = Number(rawRent);
    if (isNaN(num) || num < 0) {
      errors.push({ field: 'rentAmount', code: 'INVALID_RENT_AMOUNT', message: 'Rent amount must be a non-negative number' });
    } else {
      validated.rentAmount = num.toString();
    }
  }

  const rawDeposit =
    data.depositAmount !== undefined
      ? data.depositAmount
      : data.deposit !== undefined
      ? data.deposit
      : data.deposit_amount;
  if (rawDeposit !== undefined && rawDeposit !== null && rawDeposit !== '') {
    const num = Number(rawDeposit);
    if (isNaN(num) || num < 0) {
      errors.push({ field: 'depositAmount', code: 'INVALID_DEPOSIT_AMOUNT', message: 'Deposit amount must be a non-negative number' });
    } else {
      validated.depositAmount = num.toString();
    }
  }

  if (data.status !== undefined) {
    const upper = String(data.status).toUpperCase() as LeaseStatus;
    if (!VALID_LEASE_STATUSES.includes(upper)) {
      errors.push({ field: 'status', code: 'INVALID_STATUS', message: `Status must be one of: ${VALID_LEASE_STATUSES.join(', ')}` });
    } else {
      validated.status = upper;
    }
  }

  if (data.paymentFrequency !== undefined) validated.paymentFrequency = String(data.paymentFrequency).trim();
  if (data.notes !== undefined) validated.notes = String(data.notes).trim();
  if (data.documentUrl !== undefined) validated.documentUrl = String(data.documentUrl).trim();

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    validatedData: validated,
  };
}

export function validateRenewLease(data: any): {
  isValid: boolean;
  errors: ApiFieldError[];
  validatedData?: RenewLeaseDTO;
} {
  const errors: ApiFieldError[] = [];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: [{ field: 'body', code: 'INVALID_BODY', message: 'Request body must be a valid JSON object' }],
    };
  }

  const startDate = data.startDate || data.start_date;
  if (!startDate || typeof startDate !== 'string' || !isValidDate(startDate.trim())) {
    errors.push({ field: 'startDate', code: 'INVALID_DATE', message: 'New start date is required and must be in YYYY-MM-DD format' });
  }

  const endDate = data.endDate || data.end_date;
  if (!endDate || typeof endDate !== 'string' || !isValidDate(endDate.trim())) {
    errors.push({ field: 'endDate', code: 'INVALID_DATE', message: 'New end date is required and must be in YYYY-MM-DD format' });
  }

  if (startDate && endDate && isValidDate(startDate) && isValidDate(endDate)) {
    if (new Date(endDate.trim()) <= new Date(startDate.trim())) {
      errors.push({
        field: 'endDate',
        code: 'INVALID_LEASE_DATES',
        message: 'New end date must be strictly after start date',
      });
    }
  }

  const rawRent =
    data.rentAmount !== undefined
      ? data.rentAmount
      : data.monthlyRent !== undefined
      ? data.monthlyRent
      : data.monthly_rent;
  let rentAmount: string | undefined = undefined;
  if (rawRent !== undefined && rawRent !== null && rawRent !== '') {
    const num = Number(rawRent);
    if (isNaN(num) || num < 0) {
      errors.push({ field: 'rentAmount', code: 'INVALID_RENT_AMOUNT', message: 'Rent amount must be a non-negative number' });
    } else {
      rentAmount = num.toString();
    }
  }

  const rawDeposit =
    data.depositAmount !== undefined
      ? data.depositAmount
      : data.deposit !== undefined
      ? data.deposit
      : data.deposit_amount;
  let depositAmount: string | undefined = undefined;
  if (rawDeposit !== undefined && rawDeposit !== null && rawDeposit !== '') {
    const num = Number(rawDeposit);
    if (isNaN(num) || num < 0) {
      errors.push({ field: 'depositAmount', code: 'INVALID_DEPOSIT_AMOUNT', message: 'Deposit amount must be a non-negative number' });
    } else {
      depositAmount = num.toString();
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    validatedData: {
      startDate: String(startDate).trim(),
      endDate: String(endDate).trim(),
      rentAmount,
      depositAmount,
      paymentFrequency: data.paymentFrequency ? String(data.paymentFrequency).trim() : undefined,
      notes: data.notes ? String(data.notes).trim() : undefined,
    },
  };
}
