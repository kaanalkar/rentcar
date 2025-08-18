import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { TypeOrmUser } from '../adapters/repositories/user.repository';
import { UserRole } from '../../domain/enums/user-role.enum';
import { UserStatus } from '../../domain/enums/user-status.enum';

export async function seedAdmin(ds: DataSource, env: NodeJS.ProcessEnv = process.env) {
  const isProd = (env.NODE_ENV || '').toLowerCase() === 'production';
  const shouldSeed = env.SEED_ADMIN === 'true' || (!isProd && env.SEED_ADMIN !== 'false');

  if (!shouldSeed) {
    console.log('[seedAdmin] skipping (SEED_ADMIN is false or production without override)');
    return;
  }

  const email = env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const password = env.SEED_ADMIN_PASSWORD || 'admin123';
  const fullName = env.SEED_ADMIN_NAME || 'System Admin';
  const license = env.SEED_ADMIN_LICENSE || 'ADMIN';

  const repo = ds.getRepository(TypeOrmUser);
  const exists = await repo.findOne({ where: { email } });
  if (exists) {
    console.log(`[seedAdmin] admin already exists (${email})`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = repo.create({
    email,
    fullName,
    driverLicenseNo: license,
    passwordHash,
    status: UserStatus.ACTIVE,
    roles: [UserRole.ADMIN],
  });

  await repo.save(admin);
  console.log(`[seedAdmin] admin created: email=${email} password=${password}`);
}
