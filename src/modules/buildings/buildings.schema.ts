import { ApiFieldError } from '../common/api-response.ts';
import { CreateBuildingDTO, UpdateBuildingDTO, BuildingStatus } from './buildings.types.ts';

const VALID_STATUSES: BuildingStatus[] = ['ACTIVE', 'INACTIVE', 'UNDER_CONSTRUCTION'];

export function validateCreateBuilding(data: any): { isValid: boolean; errors: ApiFieldError[]; validatedData?: CreateBuildingDTO } {
  const errors: ApiFieldError[] = [];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: [{ field: 'body', code: 'INVALID_BODY', message: 'Request body must be a valid JSON object' }],
    };
  }

  // Name
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push({ field: 'name', code: 'REQUIRED', message: 'Building name is required' });
  } else if (data.name.trim().length > 255) {
    errors.push({ field: 'name', code: 'MAX_LENGTH', message: 'Building name cannot exceed 255 characters' });
  }

  // Code
  if (!data.code || typeof data.code !== 'string' || data.code.trim().length === 0) {
    errors.push({ field: 'code', code: 'REQUIRED', message: 'Building code is required' });
  } else if (data.code.trim().length > 50) {
    errors.push({ field: 'code', code: 'MAX_LENGTH', message: 'Building code cannot exceed 50 characters' });
  } else if (!/^[A-Za-z0-9\-_]+$/.test(data.code.trim())) {
    errors.push({ field: 'code', code: 'INVALID_FORMAT', message: 'Building code must be alphanumeric (hyphens/underscores allowed)' });
  }

  // Address
  if (!data.address || typeof data.address !== 'string' || data.address.trim().length === 0) {
    errors.push({ field: 'address', code: 'REQUIRED', message: 'Building address is required' });
  }

  // City
  if (!data.city || typeof data.city !== 'string' || data.city.trim().length === 0) {
    errors.push({ field: 'city', code: 'REQUIRED', message: 'City is required' });
  }

  // Status
  let status: BuildingStatus = 'ACTIVE';
  if (data.status) {
    const upperStatus = String(data.status).toUpperCase() as BuildingStatus;
    if (!VALID_STATUSES.includes(upperStatus)) {
      errors.push({
        field: 'status',
        code: 'INVALID_STATUS',
        message: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    } else {
      status = upperStatus;
    }
  }

  // Number of Floors
  let numberOfFloors = 1;
  if (data.numberOfFloors !== undefined && data.numberOfFloors !== null && data.numberOfFloors !== '') {
    const num = Number(data.numberOfFloors);
    if (isNaN(num) || num < 1 || !Number.isInteger(num)) {
      errors.push({ field: 'numberOfFloors', code: 'INVALID_NUMBER', message: 'Number of floors must be an integer of at least 1' });
    } else {
      numberOfFloors = num;
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    validatedData: {
      name: data.name.trim(),
      code: data.code.trim().toUpperCase(),
      address: data.address.trim(),
      city: data.city.trim(),
      description: data.description ? String(data.description).trim() : undefined,
      numberOfFloors,
      status,
    },
  };
}

export function validateUpdateBuilding(data: any): { isValid: boolean; errors: ApiFieldError[]; validatedData?: UpdateBuildingDTO } {
  const errors: ApiFieldError[] = [];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: [{ field: 'body', code: 'INVALID_BODY', message: 'Request body must be a valid JSON object' }],
    };
  }

  const validated: UpdateBuildingDTO = {};

  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push({ field: 'name', code: 'REQUIRED', message: 'Building name cannot be empty' });
    } else if (data.name.trim().length > 255) {
      errors.push({ field: 'name', code: 'MAX_LENGTH', message: 'Building name cannot exceed 255 characters' });
    } else {
      validated.name = data.name.trim();
    }
  }

  if (data.code !== undefined) {
    if (typeof data.code !== 'string' || data.code.trim().length === 0) {
      errors.push({ field: 'code', code: 'REQUIRED', message: 'Building code cannot be empty' });
    } else if (data.code.trim().length > 50) {
      errors.push({ field: 'code', code: 'MAX_LENGTH', message: 'Building code cannot exceed 50 characters' });
    } else if (!/^[A-Za-z0-9\-_]+$/.test(data.code.trim())) {
      errors.push({ field: 'code', code: 'INVALID_FORMAT', message: 'Building code must be alphanumeric' });
    } else {
      validated.code = data.code.trim().toUpperCase();
    }
  }

  if (data.address !== undefined) {
    if (typeof data.address !== 'string' || data.address.trim().length === 0) {
      errors.push({ field: 'address', code: 'REQUIRED', message: 'Address cannot be empty' });
    } else {
      validated.address = data.address.trim();
    }
  }

  if (data.city !== undefined) {
    if (typeof data.city !== 'string' || data.city.trim().length === 0) {
      errors.push({ field: 'city', code: 'REQUIRED', message: 'City cannot be empty' });
    } else {
      validated.city = data.city.trim();
    }
  }

  if (data.description !== undefined) {
    validated.description = data.description ? String(data.description).trim() : '';
  }

  if (data.status !== undefined) {
    const upperStatus = String(data.status).toUpperCase() as BuildingStatus;
    if (!VALID_STATUSES.includes(upperStatus)) {
      errors.push({
        field: 'status',
        code: 'INVALID_STATUS',
        message: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    } else {
      validated.status = upperStatus;
    }
  }

  if (data.numberOfFloors !== undefined && data.numberOfFloors !== null && data.numberOfFloors !== '') {
    const num = Number(data.numberOfFloors);
    if (isNaN(num) || num < 1 || !Number.isInteger(num)) {
      errors.push({ field: 'numberOfFloors', code: 'INVALID_NUMBER', message: 'Number of floors must be an integer of at least 1' });
    } else {
      validated.numberOfFloors = num;
    }
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
