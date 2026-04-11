import { DynamicModule, Module } from '@nestjs/common';
import { ImageStorageService } from './images-storage.service';
import { getFeatureToken } from './images.constants';
import { ImagesService } from './images.service';
import { R2ImageStorageService } from './r2-image-storage.service';

@Module({})
export class ImagesModule {
  static forRoot(): DynamicModule {
    return {
      module: ImagesModule,
      global: true,
      providers: [
        {
          provide: ImageStorageService,
          useClass: R2ImageStorageService,
        },
      ],
      exports: [ImageStorageService],
    };
  }

  static forFeature(featureName: string): DynamicModule {
    const token = getFeatureToken(featureName);

    const featureProvider = {
      provide: token,
      useFactory: (storageService: ImageStorageService) =>
        new ImagesService(storageService, featureName),
      inject: [ImageStorageService],
    };

    return {
      module: ImagesModule,
      providers: [featureProvider],
      exports: [featureProvider],
    };
  }
}
