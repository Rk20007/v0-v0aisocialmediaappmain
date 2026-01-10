export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super(400, message, "VALIDATION_ERROR")
    this.name = "ValidationError"
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = "Unauthorized") {
    super(401, message, "AUTHENTICATION_ERROR")
    this.name = "AuthenticationError"
  }
}

export class AuthorizationError extends ApiError {
  constructor(message = "Forbidden") {
    super(403, message, "AUTHORIZATION_ERROR")
    this.name = "AuthorizationError"
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(404, `${resource} not found`, "NOT_FOUND")
    this.name = "NotFoundError"
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, message, "CONFLICT")
    this.name = "ConflictError"
  }
}

export class RateLimitError extends ApiError {
  constructor(retryAfter?: number) {
    super(429, "Too many requests. Please try again later.", "RATE_LIMITED")
    this.retryAfter = retryAfter
    this.name = "RateLimitError"
  }

  retryAfter?: number
}

export class InternalServerError extends ApiError {
  constructor(message = "Internal server error") {
    super(500, message, "INTERNAL_SERVER_ERROR")
    this.name = "InternalServerError"
  }
}
