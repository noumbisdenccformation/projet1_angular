export enum UserRole {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  SECRETARY = 'SECRETARY'
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
} 