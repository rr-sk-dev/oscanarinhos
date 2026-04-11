import { Testimonial as PrismaTestimonial } from '../../../prisma/generated/prisma/client';
import { TestimonialEntity } from './testimonial.entity';

export class TestimonialMapper {
  static toDomain(record: PrismaTestimonial): TestimonialEntity {
    return {
      id: record.id,
      quote: record.quote,
      author: record.author,
      role: record.role,
      initials: record.initials,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
