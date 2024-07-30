import type { LLM, Provider } from './types'

export class DialtoneError extends Error {}

export class APIErrorRouterDetails {
  readonly model: LLM | undefined = undefined
  readonly provider: Provider | undefined = undefined
  readonly provider_response: object | undefined = undefined
}

export class APIError extends DialtoneError {
  readonly status: number | undefined
  readonly error: object | undefined
  readonly code: string | null | undefined
  readonly param: string | null | undefined
  readonly type: string | undefined

  readonly routerDetails: APIErrorRouterDetails | undefined

  constructor(
    status: number | undefined,
    error: object | undefined,
    message: string | undefined,
  ) {
    super(`${APIError.makeMessage(status, error, message)}`)
    this.status = status

    const data = error as Record<string, any>
    this.error = data
    this.code = data?.code
    this.param = data?.param
    this.type = data?.type

    this.routerDetails = data?.detail?.router_details
  }

  private static makeMessage(status: number | undefined, error: any, message: string | undefined) {
    const msg
      = error?.message
        ? typeof error.message === 'string'
          ? error.message
          : JSON.stringify(error.message)
        : error
          ? JSON.stringify(error)
          : message

    if (status && msg) {
      return `${status} ${msg}`
    }
    if (status) {
      return `${status} status code (no body)`
    }
    if (msg) {
      return msg
    }
    return '(no status code or body)'
  }

  static generate(
    status: number | undefined,
    errorResponse: object | undefined | unknown,
    message: string | undefined,
  ) {
    const error = errorResponse as Record<string, any>
    const errorCode = error?.detail?.error_code

    if (errorCode && typeof errorCode === 'string') {
      if (errorCode === 'provider_moderation') {
        return new ProviderModerationError(status, error, message)
      }
      if (errorCode === 'configuration_error') {
        return new ConfigurationError(status, error, message)
      }
    }

    if (status === 400) {
      return new BadRequestError(status, error, message)
    }

    if (status === 401) {
      return new AuthenticationError(status, error, message)
    }

    if (status === 403) {
      return new PermissionDeniedError(status, error, message)
    }

    if (status === 404) {
      return new NotFoundError(status, error, message)
    }

    if (status === 405) {
      return new MethodNotAllowedError(status, error, message)
    }

    if (status === 409) {
      return new ConflictError(status, error, message)
    }

    if (status === 412) {
      return new PreconditionFailedError(status, error, message)
    }

    if (status === 422) {
      return new UnprocessableEntityError(status, error, message)
    }

    if (status === 429) {
      return new RateLimitError(status, error, message)
    }

    if (status === 502) {
      return new BadGatewayError(status, error, message)
    }

    if (status === 500) {
      return new InternalServerError(status, error, message)
    }

    return new APIError(status, error, message)
  }
}

export class BadRequestError extends APIError {
  override readonly status = 400 as const
}

export class AuthenticationError extends APIError {
  override readonly status = 401 as const
}

export class PermissionDeniedError extends APIError {
  override readonly status = 403 as const
}

export class NotFoundError extends APIError {
  override readonly status = 404 as const
}

export class MethodNotAllowedError extends APIError {
  override readonly status = 405 as const
}

export class ConflictError extends APIError {
  override readonly status = 409 as const
}

export class PreconditionFailedError extends APIError {
  override readonly status = 412 as const
}

export class UnprocessableEntityError extends APIError {
  override readonly status = 422 as const
}

export class RateLimitError extends APIError {
  override readonly status = 429 as const
}

export class InternalServerError extends APIError {
  override readonly status = 500 as const
}

export class BadGatewayError extends APIError {
  override readonly status = 502 as const
}

export class ProviderModerationError extends APIError {
  override readonly status = 400 as const
}

export class ConfigurationError extends APIError {
  override readonly status = 400 as const
}
