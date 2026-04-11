import { Injectable } from '@nestjs/common';
import { InjectModel, ModelDelegate } from '../database';
import { TestimonialRepository } from './testimonial.repository';
import {
  CreateTestimonialData,
  TestimonialEntity,
  UpdateTestimonialData,
} from './types/testimonial.entity';
import { TestimonialMapper } from './types/testimonial.mapper';

@Injectable()
export class PrismaTestimonialRepository extends TestimonialRepository {
  constructor(
    @InjectModel('testimonial') private readonly testimonialModel: ModelDelegate<'testimonial'>,
  ) {
    super();
  }

  async create(data: CreateTestimonialData): Promise<TestimonialEntity> {
    const record = await this.testimonialModel.create({ data });
    return TestimonialMapper.toDomain(record);
  }

  async findAll(onlyActive = false): Promise<TestimonialEntity[]> {
    const records = await this.testimonialModel.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return records.map(TestimonialMapper.toDomain);
  }

  async findById(id: string): Promise<TestimonialEntity | null> {
    const record = await this.testimonialModel.findUnique({ where: { id } });
    return record ? TestimonialMapper.toDomain(record) : null;
  }

  async update(id: string, data: UpdateTestimonialData): Promise<TestimonialEntity> {
    const record = await this.testimonialModel.update({ where: { id }, data });
    return TestimonialMapper.toDomain(record);
  }

  async delete(id: string): Promise<void> {
    await this.testimonialModel.delete({ where: { id } });
  }

  async count(onlyActive = false): Promise<number> {
    return this.testimonialModel.count({
      where: onlyActive ? { isActive: true } : undefined,
    });
  }
}
