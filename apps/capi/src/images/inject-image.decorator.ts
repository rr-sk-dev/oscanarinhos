import { Inject } from '@nestjs/common';
import { getFeatureToken } from './images.constants';

export function InjectImageService(featureName: string): ParameterDecorator {
  return Inject(getFeatureToken(featureName));
}
