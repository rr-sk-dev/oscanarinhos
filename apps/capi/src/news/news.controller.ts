import { Controller, Get, Param, Query } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsResponseDto } from './types/news.dto';
import { NewsStatus } from './types/news.entity';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  async find(
    @Query('title') title?: string,
    @Query('author') author?: string,
  ): Promise<NewsResponseDto[]> {
    return this.newsService.findAll({ title, author, status: NewsStatus.Published });
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string): Promise<NewsResponseDto> {
    return this.newsService.findBySlug(slug);
  }
}
