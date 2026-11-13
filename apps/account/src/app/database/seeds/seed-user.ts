import { UserRole } from '@platform/shared';
import { hash } from 'bcryptjs';
import { validateDatabaseUrl } from '../database-url';

const DISPLAY_NAME = 'Тестовый пользователь';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const BCRYPT_ROUNDS = 12;

function requireNonEmpty(name: string, value: string | undefined): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(
      `${name} is missing or empty. Set it to a non-empty value.`,
    );
  }
  return value;
}

async function seedUser(): Promise<void> {
  const dataSource = (await import('../../../../tools/typeorm/typeorm.config'))
    .default;

  const email = process.env.SEED_USER_EMAIL?.trim() || 'test@example.com';
  const password = requireNonEmpty(
    'SEED_USER_PASSWORD',
    process.env.SEED_USER_PASSWORD,
  );

  const url = new URL(validateDatabaseUrl(process.env.DATABASE_URL));
  if (!LOCAL_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error(
      'DATABASE_URL does not point to a local database (localhost, 127.0.0.1 or ::1). Seeding is not allowed.',
    );
  }

  await dataSource.initialize();
  try {
    const passwordHash = await hash(password, BCRYPT_ROUNDS);
    const inserted = await dataSource.query(
      `INSERT INTO "users" ("email", "password_hash", "display_name", "role")
       VALUES ($1, $2, $3, $4::"users_role_enum")
       ON CONFLICT (email) DO NOTHING
       RETURNING "email"`,
      [email, passwordHash, DISPLAY_NAME, UserRole.Student],
    );

    if (inserted.length > 0) {
      console.log('Seed user created.');
    } else {
      console.log(
        'Seed user already exists; the existing record was not changed.',
      );
    }
  } finally {
    await dataSource.destroy();
  }
}

seedUser().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Seed failed.');
  process.exitCode = 1;
});
