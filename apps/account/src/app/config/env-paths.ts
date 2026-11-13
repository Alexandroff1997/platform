import { join, resolve } from 'node:path';

export function getAccountEnvFiles(rootDir: string): string[] {
  const root = resolve(rootDir);
  return [join(root, 'apps/account/.env'), join(root, '.env')];
}
