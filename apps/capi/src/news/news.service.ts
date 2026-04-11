import { Injectable } from '@nestjs/common';
import { NewsNotFoundException } from './exceptions/news.exceptions';
import { NewsFilters, NewsRepository } from './news.repository';
import { NewsResponseDto } from './types/news.dto';

@Injectable()
export class NewsService {
  constructor(private readonly newsRepository: NewsRepository) {}

  async findAll(filters: NewsFilters = {}): Promise<NewsResponseDto[]> {
    const news = await this.newsRepository.findAll(filters);
    return news.map(NewsResponseDto.fromEntity);
  }

  async findBySlug(slug: string): Promise<NewsResponseDto> {
    const news = await this.newsRepository.findBySlug(slug);
    if (!news) throw new NewsNotFoundException();
    return NewsResponseDto.fromEntity(news);
  }
}
