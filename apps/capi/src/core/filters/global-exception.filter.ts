import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainException } from '../exceptions/base-domain-exception';

const clientFacingExceptions = new Map<string, HttpStatus>([
  ['NOT_FOUND', HttpStatus.NOT_FOUND],
  ['ALREADY_EXISTS', HttpStatus.CONFLICT],
]);

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof DomainException) {
      const status = this.resolveClientFacingStatus(exception);

      if (status) {
        response.status(status).json({
          statusCode: status,
          code: exception.code,
          message: exception.message,
        });

        return;
      }

      this.logger.error(exception.message, exception.stack);

      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });

      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      response
        .status(status)
        .json(
          typeof exceptionResponse === 'string'
            ? { statusCode: status, message: exceptionResponse }
            : exceptionResponse,
        );

      return;
    }

    this.logger.error('Unhandled exception', exception);

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }

  private resolveClientFacingStatus(
    exception: DomainException,
  ): HttpStatus | null {
    for (const [suffix, status] of clientFacingExceptions) {
      if (exception.code.endsWith(suffix)) {
        return status;
      }
    }

    return null;
  }
}
