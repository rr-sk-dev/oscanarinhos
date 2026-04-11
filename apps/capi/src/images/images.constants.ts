const IMAGE_FEATURE_TOKEN_PREFIX = 'IMAGE_FEATURE_';

export function getFeatureToken(featureName: string): string {
  return `${IMAGE_FEATURE_TOKEN_PREFIX}${featureName.toUpperCase()}`;
}
