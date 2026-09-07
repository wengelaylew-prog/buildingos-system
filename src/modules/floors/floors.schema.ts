import { ApiFieldError } from '../common/api-response.ts';
import { CreateFloorDTO, UpdateFloorDTO } from './floors.types.ts';

export function validateCreateFloor(data: any): { isValid: boolean; errors: ApiFieldError[]; validatedData?: CreateFloorDTO } {
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

  // floorNumber / floor_number
  const rawFloorNumber = data.floorNumber !== undefined ? data.floorNumber : data.floor_number;
  if (rawFloorNumber === undefined || rawFloorNumber === null || rawFloorNumber === '') {
    errors.push({ field: 'floorNumber', code: 'REQUIRED', message: 'Floor number is required' });
  } else {
    const num = Number(rawFloorNumber);
    if (isNaN(num) || !Number.isInteger(num)) {
      errors.push({ field: 'floorNumber', code: 'INVALID_INTEGER', message: 'Floor number must be an integer' });
    }
  }

  // name / floorName
  const nameVal = data.name || data.floorName || data.floor_name;
  let finalName = '';
  if (nameVal && typeof nameVal === 'string' && nameVal.trim().length > 0) {
    finalName = nameVal.trim();
  } else if (rawFloorNumber !== undefined && !isNaN(Number(rawFloorNumber))) {
    finalName = `Floor ${rawFloorNumber}`;
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    validatedData: {
      buildingId: String(buildingId).trim(),
      floorNumber: Number(rawFloorNumber),
      floorName: finalName,
      name: finalName,
      description: data.description ? String(data.description).trim() : undefined,
    },
  };
}

export function validateUpdateFloor(data: any): { isValid: boolean; errors: ApiFieldError[]; validatedData?: UpdateFloorDTO } {
  const errors: ApiFieldError[] = [];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: [{ field: 'body', code: 'INVALID_BODY', message: 'Request body must be a valid JSON object' }],
    };
  }

  const validated: UpdateFloorDTO = {};

  const rawFloorNumber = data.floorNumber !== undefined ? data.floorNumber : data.floor_number;
  if (rawFloorNumber !== undefined && rawFloorNumber !== null && rawFloorNumber !== '') {
    const num = Number(rawFloorNumber);
    if (isNaN(num) || !Number.isInteger(num)) {
      errors.push({ field: 'floorNumber', code: 'INVALID_INTEGER', message: 'Floor number must be an integer' });
    } else {
      validated.floorNumber = num;
    }
  }

  const nameVal = data.name || data.floorName || data.floor_name;
  if (nameVal !== undefined) {
    if (typeof nameVal !== 'string' || nameVal.trim().length === 0) {
      errors.push({ field: 'floorName', code: 'REQUIRED', message: 'Floor name cannot be empty' });
    } else {
      validated.floorName = nameVal.trim();
      validated.name = nameVal.trim();
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
