export interface GymClassResponse {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
  trainerId: number;
  trainerName: string;
  initCapacity: number;
  sessionsThisMonth: number;
  averageFillRate: number;
  createdAt: string;
  updatedAt: string;
}
