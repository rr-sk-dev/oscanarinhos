import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Environment, EnvironmentVariables } from './env-config';

export function validateFn(config: Record<string, unknown>) {
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
