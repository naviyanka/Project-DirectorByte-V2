export interface ApiErrorData {
  status: number;
  code: string;
  message: string;
  fields?: Record<string, string>;
}

export class ApiError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;

  constructor(data: ApiErrorData) {
    super(data.message);
    this.name = 'ApiError';
    this.status = data.status;
    this.code = data.code;
    this.fields = data.fields;

    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static fromError(error: any): ApiError {
    if (error instanceof ApiError) return error;

    const status = error.response?.status ?? 0;
    const data = error.response?.data?.error ?? {};

    return new ApiError({
      status,
      code: data.code ?? 'NETWORK_ERROR',
      message: data.message ?? error.message ?? 'An unexpected network error occurred',
      fields: data.fields,
    });
  }
}
