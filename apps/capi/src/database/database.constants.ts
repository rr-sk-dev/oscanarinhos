const PRISMA_MODEL_TOKEN_PREFIX = 'PRISMA_MODEL_';

export function getModelToken(modelName: string): string {
  return `${PRISMA_MODEL_TOKEN_PREFIX}${modelName.toUpperCase()}`;
}
