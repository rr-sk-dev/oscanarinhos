import { Injectable } from '@nestjs/common';
import { TestimonialRepository } from './testimonial.repository';
import { TestimonialResponseDto } from './types/testimonial.dto';

@Injectable()
export class TestimonialService {
  constructor(private readonly testimonialRepository: TestimonialRepository) {}

  async findAllActive(): Promise<TestimonialResponseDto[]> {
    const testimonials = await this.testimonialRepository.findAll(true);
    return testimonials.map(TestimonialResponseDto.fromEntity);
  }
}
