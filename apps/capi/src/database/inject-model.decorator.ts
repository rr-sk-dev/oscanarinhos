import { Inject } from '@nestjs/common';

import { getModelToken } from './database.constants';
import { ModelName } from './database.types';

export function InjectModel(modelName: ModelName): ParameterDecorator {
  return Inject(getModelToken(modelName));
}
