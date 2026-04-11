import { DynamicModule, Module } from '@nestjs/common';
import { getModelToken } from './database.constants';
import { ModelName } from './database.types';
import { PrismaService } from './prisma.service';

@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    return {
      module: DatabaseModule,
      global: true,
      providers: [PrismaService],
      exports: [PrismaService],
    };
  }

  static forFeature(modelName: ModelName): DynamicModule {
    const token = getModelToken(modelName);

    const modelProvider = {
      provide: token,
      useFactory: (prisma: PrismaService) => prisma[modelName],
      inject: [PrismaService],
    };

    return {
      module: DatabaseModule,
      providers: [modelProvider],
      exports: [modelProvider],
    };
  }
}
