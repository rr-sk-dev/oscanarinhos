import { Injectable } from '@nestjs/common';
import { InjectModel, ModelDelegate } from '../database';
import { NewsFilters, NewsRepository } from './news.repository';
import {
  CreateNewsData,
  NewsEntity,
  UpdateNewsData,
} from './types/news.entity';
import { NewsMapper } from './types/news.mapper';

@Injectable()
export class PrismaNewsRepository extends NewsRepository {
  constructor(
    @InjectModel('news') private readonly newsModel: ModelDelegate<'news'>,
  ) {
    super();
  }

  async create(data: CreateNewsData): Promise<NewsEntity> {
    const record = await this.newsModel.create({ data });
    return NewsMapper.toDomain(record);
  }

  async findAll(filters: NewsFilters = {}): Promise<NewsEntity[]> {
    const { title, author, status } = filters;

    const records = await this.newsModel.findMany({
      where: {
        ...(title && { title: { contains: title, mode: 'insensitive' } }),
        ...(author && { author: { contains: author, mode: 'insensitive' } }),
        ...(status && { status: NewsMapper.toStatusPrisma(status) }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map(NewsMapper.toDomain);
  }

  async findById(id: string): Promise<NewsEntity | null> {
    const record = await this.newsModel.findUnique({ where: { id } });
    return record ? NewsMapper.toDomain(record) : null;
  }

  async findBySlug(slug: string): Promise<NewsEntity | null> {
    const record = await this.newsModel.findUnique({ where: { slug } });
    return record ? NewsMapper.toDomain(record) : null;
  }

  async update(id: string, data: UpdateNewsData): Promise<NewsEntity> {
    const record = await this.newsModel.update({ where: { id }, data });
    return NewsMapper.toDomain(record);
  }

  async delete(id: string): Promise<void> {
    await this.newsModel.delete({ where: { id } });
  }

  async count(filters: NewsFilters = {}): Promise<number> {
    const { title, author, status } = filters;

    return this.newsModel.count({
      where: {
        ...(title && { title: { contains: title, mode: 'insensitive' } }),
        ...(author && { author: { contains: author, mode: 'insensitive' } }),
        ...(status && { status: NewsMapper.toStatusPrisma(status) }),
      },
    });
  }
}
