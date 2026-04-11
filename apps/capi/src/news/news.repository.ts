import { BaseRepository } from '../database';
import {
    CreateNewsData,
    NewsEntity,
    NewsStatus,
    UpdateNewsData,
} from './types/news.entity';

export type NewsFilters = {
  title?: string;
  author?: string;
  status?: NewsStatus;
};

export abstract class NewsRepository extends BaseRepository<
  NewsEntity,
  CreateNewsData,
  UpdateNewsData
> {
  abstract findAll(filters?: NewsFilters): Promise<NewsEntity[]>;
  abstract findBySlug(slug: string): Promise<NewsEntity | null>;
}
