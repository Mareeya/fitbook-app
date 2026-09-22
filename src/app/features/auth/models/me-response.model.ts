import { UserRole } from './user-role.enum';

export interface MeResponse {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  roleName: string;
  trainerId: number | null;
}
