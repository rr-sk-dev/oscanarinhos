import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { NewsEntity, NewsStatus } from './news.entity';

export class NewsResponseDto {
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

  static fromEntity(entity: NewsEntity): NewsResponseDto {
    return {
      id: entity.id,
      title: entity.title,
      slug: entity.slug,
      excerpt: entity.excerpt,
      content: entity.content,
      image: entity.image,
      author: entity.author,
      status: entity.status,
      publishedAt: entity.publishedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}

export class CreateNewsDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  excerpt: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  author: string;
}

export class UpdateNewsDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  excerpt?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  content?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  author?: string;

  @IsEnum(NewsStatus)
  @IsOptional()
  status?: NewsStatus;
}
