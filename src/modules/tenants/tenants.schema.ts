import { ApiFieldError } from '../common/api-response.ts';
import { CreateTenantDTO, UpdateTenantDTO } from './tenants.types.ts';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[0-9\s\-()]{7,25}$/;

export function validateCreateTenant(data: any): {
  isValid: boolean;
  errors: ApiFieldError[];
  validatedData?: CreateTenantDTO;
} {
  const errors: ApiFieldError[] = [];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: [{ field: 'body', code: 'INVALID_BODY', message: 'Request body must be a valid JSON object' }],
    };
  }

  // First Name & Last Name (or Full Name)
  let firstName = data.firstName !== undefined ? String(data.firstName).trim() : '';
  let lastName = data.lastName !== undefined ? String(data.lastName).trim() : '';
  const fullName = data.fullName !== undefined ? String(data.fullName).trim() : '';

  if (!firstName && !lastName && fullName) {
    const parts = fullName.split(' ');
    firstName = parts[0] || '';
    lastName = parts.slice(1).join(' ') || parts[0] || '';
  }

  if (!firstName) {
    errors.push({ field: 'firstName', code: 'REQUIRED', message: 'First name is required' });
  }

  if (!lastName) {
    errors.push({ field: 'lastName', code: 'REQUIRED', message: 'Last name is required' });
  }

  // Phone
  const phone = data.phone !== undefined ? String(data.phone).trim() : '';
  if (!phone) {
    errors.push({ field: 'phone', code: 'REQUIRED', message: 'Phone number is required' });
  } else if (!PHONE_REGEX.test(phone)) {
    errors.push({ field: 'phone', code: 'INVALID_FORMAT', message: 'Phone number format is invalid' });
  }

  // Email (optional, but validate format if present)
  let email: string | undefined = undefined;
  if (data.email !== undefined && data.email !== null && String(data.email).trim().length > 0) {
    const trimmedEmail = String(data.email).trim();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.push({ field: 'email', code: 'INVALID_FORMAT', message: 'Email address format is invalid' });
    } else {
      email = trimmedEmail.toLowerCase();
    }
  }

  // Emergency contact
  const emergencyContactName = data.emergencyContactName ? String(data.emergencyContactName).trim() : undefined;
  const emergencyContactPhone = data.emergencyContactPhone ? String(data.emergencyContactPhone).trim() : undefined;
  let emergencyContact = data.emergencyContact ? String(data.emergencyContact).trim() : undefined;

  if (!emergencyContact && (emergencyContactName || emergencyContactPhone)) {
    emergencyContact = `${emergencyContactName || ''} (${emergencyContactPhone || ''})`.trim();
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const computedFullName = `${firstName} ${lastName}`.trim();

  return {
    isValid: true,
    errors: [],
    validatedData: {
      firstName,
      lastName,
      fullName: computedFullName,
      phone,
      email,
      idType: data.idType ? String(data.idType).trim() : 'National ID',
      idNumber: data.idNumber ? String(data.idNumber).trim() : undefined,
      address: data.address ? String(data.address).trim() : undefined,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContact,
      notes: data.notes ? String(data.notes).trim() : undefined,
      profilePhoto: data.profilePhoto ? String(data.profilePhoto).trim() : undefined,
      userId: data.userId ? String(data.userId).trim() : undefined,
    },
  };
}

export function validateUpdateTenant(data: any): {
  isValid: boolean;
  errors: ApiFieldError[];
  validatedData?: UpdateTenantDTO;
} {
  const errors: ApiFieldError[] = [];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: [{ field: 'body', code: 'INVALID_BODY', message: 'Request body must be a valid JSON object' }],
    };
  }

  const validated: UpdateTenantDTO = {};

  if (data.firstName !== undefined) {
    const fn = String(data.firstName).trim();
    if (!fn) errors.push({ field: 'firstName', code: 'REQUIRED', message: 'First name cannot be empty' });
    else validated.firstName = fn;
  }

  if (data.lastName !== undefined) {
    const ln = String(data.lastName).trim();
    if (!ln) errors.push({ field: 'lastName', code: 'REQUIRED', message: 'Last name cannot be empty' });
    else validated.lastName = ln;
  }

  if (data.phone !== undefined) {
    const ph = String(data.phone).trim();
    if (!ph) {
      errors.push({ field: 'phone', code: 'REQUIRED', message: 'Phone number cannot be empty' });
    } else if (!PHONE_REGEX.test(ph)) {
      errors.push({ field: 'phone', code: 'INVALID_FORMAT', message: 'Phone number format is invalid' });
    } else {
      validated.phone = ph;
    }
  }

  if (data.email !== undefined) {
    if (data.email === null || String(data.email).trim() === '') {
      validated.email = undefined;
    } else {
      const em = String(data.email).trim().toLowerCase();
      if (!EMAIL_REGEX.test(em)) {
        errors.push({ field: 'email', code: 'INVALID_FORMAT', message: 'Email address format is invalid' });
      } else {
        validated.email = em;
      }
    }
  }

  if (data.idType !== undefined) validated.idType = String(data.idType).trim();
  if (data.idNumber !== undefined) validated.idNumber = String(data.idNumber).trim();
  if (data.address !== undefined) validated.address = String(data.address).trim();
  if (data.emergencyContactName !== undefined) validated.emergencyContactName = String(data.emergencyContactName).trim();
  if (data.emergencyContactPhone !== undefined) validated.emergencyContactPhone = String(data.emergencyContactPhone).trim();
  if (data.notes !== undefined) validated.notes = String(data.notes).trim();
  if (data.profilePhoto !== undefined) validated.profilePhoto = String(data.profilePhoto).trim();
  if (data.userId !== undefined) validated.userId = String(data.userId).trim();

  // Recompute emergency contact string if parts updated
  if (validated.emergencyContactName || validated.emergencyContactPhone) {
    validated.emergencyContact = `${validated.emergencyContactName || ''} (${validated.emergencyContactPhone || ''})`.trim();
  } else if (data.emergencyContact !== undefined) {
    validated.emergencyContact = String(data.emergencyContact).trim();
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
