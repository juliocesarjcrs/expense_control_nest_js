import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GqlArgumentsHost, GqlContextType } from '@nestjs/graphql';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctxType = host.getType();
    if (ctxType === 'http') {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();
      const status = exception.getStatus();
      const res = exception.getResponse();
      const isDtoValidations = this.isObject(res);
      if (isDtoValidations) {
        response.status(status).json(res);
      } else {
        response.status(status).json({
          statusCode: status,
          timestamp: new Date().toISOString(),
          path: request.url,
          message: res,
        });
      }
    } else if (host.getType<GqlContextType>() === 'graphql') {
      const status = exception.getStatus
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
      const formattedError = this.handleGraphQlResponse(exception, host);
      throw new HttpException(formattedError, status);
    }
  }
  // Fuente: https://www.iteramos.com/pregunta/7262/comprobar-si-una-variable-es-un-objeto-en-javascript
  isObject(val: any) {
    if (val === null) {
      return false;
    }
    return typeof val === 'function' || typeof val === 'object';
  }

  handleGraphQlResponse(exception: HttpException, host: ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);
    const response = exception.getResponse
      ? exception.getResponse()
      : exception.message;
    const status = exception.getStatus
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    return {
      statusCode: status,
      message: response,
      timestamp: new Date().toISOString(),
      path: gqlHost.getInfo().fieldName,
    };
  }
}
