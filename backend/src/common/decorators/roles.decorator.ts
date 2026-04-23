import { SetMetadata } from '@nestjs/common';

export enum Role {
  USER = 'user',
  STUDENT = 'student',
  EDUCATOR = 'educator',
  PREMIUM = 'premium',
  ADMIN = 'admin',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
