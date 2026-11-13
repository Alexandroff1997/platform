export function validateDatabaseUrl(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(
      'DATABASE_URL is missing or empty. Set it to a PostgreSQL connection string, for example: postgresql://user:password@host:5432/database.',
    );
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(
      'DATABASE_URL is not a valid URL. Expected format: postgresql://user:password@host:5432/database.',
    );
  }

  if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') {
    throw new Error(
      `DATABASE_URL has an unsupported protocol "${url.protocol}". Only postgres: and postgresql: are supported.`,
    );
  }

  if (!url.hostname) {
    throw new Error('DATABASE_URL is missing a database host.');
  }

  const database = url.pathname.replace(/^\//, '');
  if (!database) {
    throw new Error('DATABASE_URL is missing a database name in the URL path.');
  }

  return value;
}
