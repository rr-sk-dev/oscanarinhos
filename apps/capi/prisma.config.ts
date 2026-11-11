import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';
import { resolveFileEnv } from './src/core/environment/env-files';

if (process.env.NODE_ENV !== 'production') {
  config({ path: 'env/development.env' });
}

// Same rules as the API: POSTGRES_URL or POSTGRES_URL_FILE (not both).
const { POSTGRES_URL } = resolveFileEnv(process.env, ['POSTGRES_URL']);

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: POSTGRES_URL ?? '',
  },
});
