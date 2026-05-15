export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(
    status: number,
    body: unknown,
    message?: string,
  ) {
    super(message ?? `API error ${status}`)
    this.status = status
    this.body = body
    this.name = "ApiError"
  }
}

export class BadRequestError extends ApiError {
  constructor(body: unknown) { super(400, body, "Bad request"); this.name = "BadRequestError" }
}
export class UnauthorizedError extends ApiError {
  constructor(body: unknown) { super(401, body, "Unauthorized"); this.name = "UnauthorizedError" }
}
export class ForbiddenError extends ApiError {
  constructor(body: unknown) { super(403, body, "Forbidden"); this.name = "ForbiddenError" }
}
export class NotFoundError extends ApiError {
  constructor(body: unknown) { super(404, body, "Not found"); this.name = "NotFoundError" }
}
export class ValidationError extends ApiError {
  constructor(body: unknown) { super(422, body, "Validation error"); this.name = "ValidationError" }
}
export class ServerError extends ApiError {
  constructor(status: number, body: unknown) { super(status, body, "Server error"); this.name = "ServerError" }
}

export function createApiError(status: number, body: unknown): ApiError {
  switch (status) {
    case 400: return new BadRequestError(body)
    case 401: return new UnauthorizedError(body)
    case 403: return new ForbiddenError(body)
    case 404: return new NotFoundError(body)
    case 422: return new ValidationError(body)
    default:
      if (status >= 500) return new ServerError(status, body)
      return new ApiError(status, body)
  }
}
