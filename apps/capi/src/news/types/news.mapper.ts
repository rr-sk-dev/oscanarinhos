import {
    News as PrismaNews,
    NewsStatus as PrismaNewsStatus,
} from '../../../prisma/generated/prisma/client';
import { NewsEntity, NewsStatus } from './news.entity';

export class NewsMapper {
  static toDomain(record: PrismaNews): NewsEntity {
    return {
      id: record.id,
      title: record.title,
      slug: record.slug,
      excerpt: record.excerpt,
      content: record.content,
      image: record.image,
      author: record.author,
      status: record.status as NewsStatus,
      publishedAt: record.publishedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  static toStatusPrisma(status: NewsStatus): PrismaNewsStatus {
    return status as PrismaNewsStatus;
  }
}
