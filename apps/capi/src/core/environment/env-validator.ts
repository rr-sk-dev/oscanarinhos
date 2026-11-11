import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Environment, ENVIRONMENT_VARIABLE_KEYS, EnvironmentVariables } from './env-config';
import { resolveFileEnv } from './env-files';

export function validateFn(rawConfig: Record<string, unknown>) {
  const config = resolveFileEnv(rawConfig, ENVIRONMENT_VARIABLE_KEYS);

  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const messages = errors
      .map((err) => {
        const constraints = Object.values(err.constraints || {}).join(', ');
        return `${err.property}: ${constraints}`;
      })
      .join('\n');

    throw new Error(`Environment validation failed:\n${messages}`);
  }

  return validatedConfig;
}

export function getEnvScopedConfigs() {
  if (process.env.NODE_ENV === Environment.Production) {
    return {
      ignoreEnvFile: true,
      cache: true,
    };
  }

  return {
    envFilePath: 'env/development.env',
    expandVariables: true,
  };
}
