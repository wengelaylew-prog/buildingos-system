import { Response } from 'express';

export interface ApiResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: any;
}

export interface ApiFieldError {
  field: string;
  code: string;
  message?: string;
}

export class ApiError extends Error {
  statusCode: number;
  errors: ApiFieldError[];

  constructor(statusCode: number, message: string, errors: ApiFieldError[] = []) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }

  static badRequest(message: string, errors: ApiFieldError[] = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Unauthorized', errors: ApiFieldError[] = []) {
    return new ApiError(401, message, errors);
  }

  static forbidden(message = 'Forbidden', errors: ApiFieldError[] = []) {
    return new ApiError(403, message, errors);
  }

  static notFound(message = 'Resource not found', errors: ApiFieldError[] = []) {
    return new ApiError(404, message, errors);
  }

  static conflict(message: string, errors: ApiFieldError[] = []) {
    return new ApiError(409, message, errors);
  }

  static unprocessable(message: string, errors: ApiFieldError[] = []) {
    return new ApiError(422, message, errors);
  }

  static internal(message = 'Internal server error', errors: ApiFieldError[] = []) {
    return new ApiError(500, message, errors);
  }
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string | null = null,
  meta?: ApiResponseMeta,
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    ...(meta ? { meta } : {}),
  });
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  errors: ApiFieldError[] = [],
  customCode?: string
) => {
  const codeMap: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHENTICATED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    500: 'INTERNAL_SERVER_ERROR',
  };

  const code = customCode || (errors.length > 0 && errors[0].code) || codeMap[statusCode] || 'ERROR';

  return res.status(statusCode).json({
    error: {
      code,
      message,
      details: errors.length > 0 ? errors : undefined,
    },
    success: false,
    data: null,
    message,
    errors,
  });
};
