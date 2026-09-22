import { UserRole } from './user-role.enum';

export interface LoginResponse {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  token: string;
  trainerId?: number | null;
}
