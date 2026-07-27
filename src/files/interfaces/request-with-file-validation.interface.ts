import { Request } from 'express';

export interface RequestWithFileValidation extends Request {
  fileValidationError?: string;
}
