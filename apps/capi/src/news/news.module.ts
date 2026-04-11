import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database';
import { PrismaNewsRepository } from './news-prisma.repository';
import { NewsController } from './news.controller';
import { NewsRepository } from './news.repository';
import { NewsService } from './news.service';

@Module({
  imports: [DatabaseModule.forFeature('news')],
  controllers: [NewsController],
  providers: [
    {
      provide: NewsRepository,
      useClass: PrismaNewsRepository,
    },
    NewsService,
  ],
  exports: [NewsRepository],
})
export class NewsModule {}
