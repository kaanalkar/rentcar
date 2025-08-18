import { UserStatus } from '../enums/user-status.enum';
import { UserRole } from '../enums/user-role.enum';

export class User {
  constructor(
    public id: string,
    public email: string,
    public fullName: string,
    public driverLicenseNo: string,
    public status: UserStatus = UserStatus.ACTIVE,
    public roles: UserRole[] = [UserRole.USER],
    public passwordHash?: string,
  ) {}

  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  canRent(): boolean {
    return this.isActive() && !!this.driverLicenseNo;
  }

  isAdmin(): boolean {
    return this.roles.includes(UserRole.ADMIN);
  }
}
