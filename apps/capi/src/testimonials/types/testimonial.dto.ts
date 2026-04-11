import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { TestimonialEntity } from './testimonial.entity';

export class TestimonialResponseDto {
  id: string;
  quote: string;
  author: string;
  role: string;
  initials: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: TestimonialEntity): TestimonialResponseDto {
    return {
      id: entity.id,
      quote: entity.quote,
      author: entity.author,
      role: entity.role,
      initials: entity.initials,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}

export class CreateTestimonialDto {
  @IsString()
  @IsNotEmpty()
  quote: string;

  @IsString()
  @IsNotEmpty()
  author: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(4)
  initials: string;
}

export class UpdateTestimonialDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  quote?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  author?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  role?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(4)
  @IsOptional()
  initials?: string;

  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsOptional()
  isActive?: boolean;
}
