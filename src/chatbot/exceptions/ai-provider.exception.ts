import { HttpException, HttpStatus } from '@nestjs/common';

export class AIProviderException extends HttpException {
  constructor(
    message: string,
    statusCode: number = HttpStatus.BAD_REQUEST,
    public readonly context?: any,
  ) {
    super(
      {
        message,
        error: 'AI Provider Error',
        statusCode,
        context,
        timestamp: new Date().toISOString(),
      },
      statusCode,
    );
  }
}
