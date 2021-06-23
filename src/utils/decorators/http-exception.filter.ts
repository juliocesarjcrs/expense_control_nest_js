import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
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
  }

  // Fuente: https://www.iteramos.com/pregunta/7262/comprobar-si-una-variable-es-un-objeto-en-javascript
  isObject(val: any) {
    if (val === null) {
      return false;
    }
    return typeof val === 'function' || typeof val === 'object';
  }
}
