import { ApiFieldError } from '../common/api-response.ts';
import { CreateUnitDTO, UpdateUnitDTO, UnitType, UnitStatus } from './units.types.ts';

export const VALID_UNIT_TYPES: UnitType[] = [
  'OFFICE',
  'APARTMENT',
  'SHOP',
  'WAREHOUSE',
  'STUDIO',
  'OTHER',
];

export const VALID_UNIT_STATUSES: UnitStatus[] = [
  'VACANT',
  'OCCUPIED',
  'RESERVED',
  'MAINTENANCE',
  'INACTIVE',
];

export function validateCreateUnit(data: any): { isValid: boolean; errors: ApiFieldError[]; validatedData?: CreateUnitDTO } {
  const errors: ApiFieldError[] = [];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: [{ field: 'body', code: 'INVALID_BODY', message: 'Request body must be a valid JSON object' }],
    };
  }

  // buildingId / building_id
  const buildingId = data.buildingId || data.building_id;
  if (!buildingId || typeof buildingId !== 'string' || buildingId.trim().length === 0) {
    errors.push({ field: 'buildingId', code: 'REQUIRED', message: 'Building ID is required' });
  }

  // floorId / floor_id
  const floorId = data.floorId || data.floor_id;
  if (!floorId || typeof floorId !== 'string' || floorId.trim().length === 0) {
    errors.push({ field: 'floorId', code: 'REQUIRED', message: 'Floor ID is required' });
  }

  // unitNumber / unit_number
  const unitNumber = data.unitNumber || data.unit_number;
  if (!unitNumber || typeof unitNumber !== 'string' || unitNumber.trim().length === 0) {
    errors.push({ field: 'unitNumber', code: 'REQUIRED', message: 'Unit number is required' });
  } else if (unitNumber.trim().length > 50) {
    errors.push({ field: 'unitNumber', code: 'MAX_LENGTH', message: 'Unit number cannot exceed 50 characters' });
  }

  // unitType / unit_type
  const rawType = data.unitType || data.unit_type;
  let unitType: UnitType = 'OFFICE';
  if (!rawType) {
    errors.push({ field: 'unitType', code: 'REQUIRED', message: 'Unit type is required' });
  } else {
    const upperType = String(rawType).toUpperCase() as UnitType;
    if (!VALID_UNIT_TYPES.includes(upperType)) {
      errors.push({
        field: 'unitType',
        code: 'INVALID_TYPE',
        message: `Unit type must be one of: ${VALID_UNIT_TYPES.join(', ')}`,
      });
    } else {
      unitType = upperType;
    }
  }

  // status
  const rawStatus = data.status;
  let status: UnitStatus = 'VACANT';
  if (rawStatus) {
    const upperStatus = String(rawStatus).toUpperCase() as UnitStatus;
    if (!VALID_UNIT_STATUSES.includes(upperStatus)) {
      errors.push({
        field: 'status',
        code: 'INVALID_STATUS',
        message: `Status must be one of: ${VALID_UNIT_STATUSES.join(', ')}`,
      });
    } else {
      status = upperStatus;
    }
  }

  // monthlyRent / monthly_rent
  const rawRent = data.monthlyRent !== undefined ? data.monthlyRent : data.monthly_rent;
  let monthlyRent = '0';
  if (rawRent === undefined || rawRent === null || rawRent === '') {
    errors.push({ field: 'monthlyRent', code: 'REQUIRED', message: 'Monthly rent is required' });
  } else {
    const num = Number(rawRent);
    if (isNaN(num) || num < 0) {
      errors.push({ field: 'monthlyRent', code: 'INVALID_NUMBER', message: 'Monthly rent must be a non-negative number' });
    } else {
      monthlyRent = num.toString();
    }
  }

  // Optional fields: area, bedrooms, bathrooms, depositAmount, description
  const rawArea = data.area;
  let area = '0';
  if (rawArea !== undefined && rawArea !== null && rawArea !== '') {
    const num = Number(rawArea);
    if (isNaN(num) || num < 0) {
      errors.push({ field: 'area', code: 'INVALID_NUMBER', message: 'Area must be a non-negative number' });
    } else {
      area = num.toString();
    }
  }

  const rawBedrooms = data.bedrooms;
  let bedrooms = 0;
  if (rawBedrooms !== undefined && rawBedrooms !== null && rawBedrooms !== '') {
    const num = Number(rawBedrooms);
    if (isNaN(num) || num < 0 || !Number.isInteger(num)) {
      errors.push({ field: 'bedrooms', code: 'INVALID_INTEGER', message: 'Bedrooms must be a non-negative integer' });
    } else {
      bedrooms = num;
    }
  }

  const rawBathrooms = data.bathrooms;
  let bathrooms = 1;
  if (rawBathrooms !== undefined && rawBathrooms !== null && rawBathrooms !== '') {
    const num = Number(rawBathrooms);
    if (isNaN(num) || num < 0 || !Number.isInteger(num)) {
      errors.push({ field: 'bathrooms', code: 'INVALID_INTEGER', message: 'Bathrooms must be a non-negative integer' });
    } else {
      bathrooms = num;
    }
  }

  const rawDeposit = data.depositAmount !== undefined ? data.depositAmount : data.deposit_amount;
  let depositAmount = '0';
  if (rawDeposit !== undefined && rawDeposit !== null && rawDeposit !== '') {
    const num = Number(rawDeposit);
    if (isNaN(num) || num < 0) {
      errors.push({ field: 'depositAmount', code: 'INVALID_NUMBER', message: 'Deposit amount must be a non-negative number' });
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
      buildingId: String(buildingId).trim(),
      floorId: String(floorId).trim(),
      unitNumber: String(unitNumber).trim(),
      unitType,
      status,
      monthlyRent,
      area,
      bedrooms,
      bathrooms,
      depositAmount,
      description: data.description ? String(data.description).trim() : undefined,
    },
  };
}

export function validateUpdateUnit(data: any): { isValid: boolean; errors: ApiFieldError[]; validatedData?: UpdateUnitDTO } {
  const errors: ApiFieldError[] = [];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: [{ field: 'body', code: 'INVALID_BODY', message: 'Request body must be a valid JSON object' }],
    };
  }

  const validated: UpdateUnitDTO = {};

  const buildingId = data.buildingId || data.building_id;
  if (buildingId !== undefined) {
    if (typeof buildingId !== 'string' || buildingId.trim().length === 0) {
      errors.push({ field: 'buildingId', code: 'REQUIRED', message: 'Building ID cannot be empty' });
    } else {
      validated.buildingId = buildingId.trim();
    }
  }

  const floorId = data.floorId || data.floor_id;
  if (floorId !== undefined) {
    if (typeof floorId !== 'string' || floorId.trim().length === 0) {
      errors.push({ field: 'floorId', code: 'REQUIRED', message: 'Floor ID cannot be empty' });
    } else {
      validated.floorId = floorId.trim();
    }
  }

  const unitNumber = data.unitNumber || data.unit_number;
  if (unitNumber !== undefined) {
    if (typeof unitNumber !== 'string' || unitNumber.trim().length === 0) {
      errors.push({ field: 'unitNumber', code: 'REQUIRED', message: 'Unit number cannot be empty' });
    } else if (unitNumber.trim().length > 50) {
      errors.push({ field: 'unitNumber', code: 'MAX_LENGTH', message: 'Unit number cannot exceed 50 characters' });
    } else {
      validated.unitNumber = unitNumber.trim();
    }
  }

  const rawType = data.unitType || data.unit_type;
  if (rawType !== undefined) {
    const upperType = String(rawType).toUpperCase() as UnitType;
    if (!VALID_UNIT_TYPES.includes(upperType)) {
      errors.push({
        field: 'unitType',
        code: 'INVALID_TYPE',
        message: `Unit type must be one of: ${VALID_UNIT_TYPES.join(', ')}`,
      });
    } else {
      validated.unitType = upperType;
    }
  }

  if (data.status !== undefined) {
    const upperStatus = String(data.status).toUpperCase() as UnitStatus;
    if (!VALID_UNIT_STATUSES.includes(upperStatus)) {
      errors.push({
        field: 'status',
        code: 'INVALID_STATUS',
        message: `Status must be one of: ${VALID_UNIT_STATUSES.join(', ')}`,
      });
    } else {
      validated.status = upperStatus;
    }
  }

  const rawRent = data.monthlyRent !== undefined ? data.monthlyRent : data.monthly_rent;
  if (rawRent !== undefined && rawRent !== null && rawRent !== '') {
    const num = Number(rawRent);
    if (isNaN(num) || num < 0) {
      errors.push({ field: 'monthlyRent', code: 'INVALID_NUMBER', message: 'Monthly rent must be a non-negative number' });
    } else {
      validated.monthlyRent = num.toString();
    }
  }

  const rawArea = data.area;
  if (rawArea !== undefined && rawArea !== null && rawArea !== '') {
    const num = Number(rawArea);
    if (isNaN(num) || num < 0) {
      errors.push({ field: 'area', code: 'INVALID_NUMBER', message: 'Area must be a non-negative number' });
    } else {
      validated.area = num.toString();
    }
  }

  const rawBedrooms = data.bedrooms;
  if (rawBedrooms !== undefined && rawBedrooms !== null && rawBedrooms !== '') {
    const num = Number(rawBedrooms);
    if (isNaN(num) || num < 0 || !Number.isInteger(num)) {
      errors.push({ field: 'bedrooms', code: 'INVALID_INTEGER', message: 'Bedrooms must be a non-negative integer' });
    } else {
      validated.bedrooms = num;
    }
  }

  const rawBathrooms = data.bathrooms;
  if (rawBathrooms !== undefined && rawBathrooms !== null && rawBathrooms !== '') {
    const num = Number(rawBathrooms);
    if (isNaN(num) || num < 0 || !Number.isInteger(num)) {
      errors.push({ field: 'bathrooms', code: 'INVALID_INTEGER', message: 'Bathrooms must be a non-negative integer' });
    } else {
      validated.bathrooms = num;
    }
  }

  const rawDeposit = data.depositAmount !== undefined ? data.depositAmount : data.deposit_amount;
  if (rawDeposit !== undefined && rawDeposit !== null && rawDeposit !== '') {
    const num = Number(rawDeposit);
    if (isNaN(num) || num < 0) {
      errors.push({ field: 'depositAmount', code: 'INVALID_NUMBER', message: 'Deposit amount must be a non-negative number' });
    } else {
      validated.depositAmount = num.toString();
    }
  }

  if (data.description !== undefined) {
    validated.description = data.description ? String(data.description).trim() : '';
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    validatedData: validated,
  };
}
