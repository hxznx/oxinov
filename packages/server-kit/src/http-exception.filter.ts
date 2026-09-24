import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Inject } from '@nestjs/common';
import type { Response } from 'express';
import { DomainError } from './errors';
import { JsonLogger } from './logger';
import { routePath, type KitRequest } from './request';
import { LOGGER } from './tokens';

const STATUS_CODES: Record<number, string> = {
  400: 'VALIDATION_FAILED',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'RESOURCE_NOT_FOUND',
  409: 'CONFLICT',
  429: 'RATE_LIMITED',
};

interface ErrorBody {
  error: { code: string; message: string; requestId: string; details?: unknown };
}

/** Prisma errors are recognised by shape so every API's generated client works with this filter. */
function prismaCode(exception: unknown): string | undefined {
  if (typeof exception !== 'object' || exception === null) return undefined;
  const { name, code } = exception as { name?: unknown; code?: unknown };
  return name === 'PrismaClientKnownRequestError' && typeof code === 'string' ? code : undefined;
}

/**
 * Maps every failure to the stable envelope in docs/api/ERROR-HANDLING.md. Stack traces, SQL, and
 * identifiers from other tenants never reach the client; they are logged server-side.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(@Inject(LOGGER) private readonly logger: JsonLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<KitRequest>();
    const response = http.getResponse<Response>();
    const requestId = request.requestId ?? 'unknown';

    const { status, body } = this.toResponse(exception, requestId);

    if (status >= 500) {
      this.logger.event('error', 'request.failed', {
        requestId,
        tenantId: request.tenant?.tenantId,
        method: request.method,
        route: routePath(request),
        errorName: exception instanceof Error ? exception.name : typeof exception,
        errorMessage: exception instanceof Error ? exception.message : undefined,
        stack: exception instanceof Error ? exception.stack : undefined,
      });
    }

    response.status(status).json(body);
  }

  private toResponse(exception: unknown, requestId: string): { status: number; body: ErrorBody } {
    if (exception instanceof DomainError) {
      return this.body(exception.status, exception.code, exception.message, requestId, exception.details);
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const code = STATUS_CODES[status] ?? (status >= 500 ? 'INTERNAL_ERROR' : 'VALIDATION_FAILED');
      const payload = exception.getResponse();
      // ValidationPipe returns { message: string[] } describing each invalid field.
      const details =
        typeof payload === 'object' && payload !== null && Array.isArray((payload as { message?: unknown }).message)
          ? (payload as { message: unknown[] }).message.map(String)
          : undefined;
      const message =
        status === 400 ? 'The request is invalid.' : status === 404 ? 'The resource was not found.' : exception.message;
      return this.body(status, code, message, requestId, details);
    }

    const prisma = prismaCode(exception);
    if (prisma === 'P2002') return this.body(409, 'CONFLICT', 'This record already exists.', requestId);
    if (prisma === 'P2025') return this.body(404, 'RESOURCE_NOT_FOUND', 'The resource was not found.', requestId);

    return this.body(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'INTERNAL_ERROR',
      'Something went wrong. Quote the request ID when contacting support.',
      requestId,
    );
  }

  private body(
    status: number,
    code: string,
    message: string,
    requestId: string,
    details?: unknown,
  ): { status: number; body: ErrorBody } {
    return { status, body: { error: { code, message, requestId, ...(details ? { details } : {}) } } };
  }
}
