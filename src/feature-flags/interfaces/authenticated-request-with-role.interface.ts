import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';

export interface AuthenticatedRequestWithRole extends AuthenticatedRequest {
  user: AuthenticatedRequest['user'] & { role: number };
}
