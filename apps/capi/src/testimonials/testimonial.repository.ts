import { BaseRepository } from '../database';
import {
  CreateTestimonialData,
  TestimonialEntity,
  UpdateTestimonialData,
} from './types/testimonial.entity';

export abstract class TestimonialRepository extends BaseRepository<
  TestimonialEntity,
  CreateTestimonialData,
  UpdateTestimonialData
> {
  abstract findAll(onlyActive?: boolean): Promise<TestimonialEntity[]>;
}
