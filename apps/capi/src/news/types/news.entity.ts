import { enumOf, ValueOf } from '../../utils/ts-utils';

export const NewsStatus = enumOf({
  Draft: 'DRAFT',
  Published: 'PUBLISHED',
  Archived: 'ARCHIVED',
});
export type NewsStatus = ValueOf<typeof NewsStatus>;

export class NewsEntity {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string | null;
  author: string;
  status: NewsStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateNewsData = Omit<NewsEntity, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateNewsData = Partial<
  Omit<NewsEntity, 'id' | 'createdAt' | 'updatedAt'>
>;
