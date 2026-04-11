import { Controller, Get } from '@nestjs/common';
import { TestimonialService } from './testimonial.service';
import { TestimonialResponseDto } from './types/testimonial.dto';

@Controller('testimonials')
export class TestimonialController {
  constructor(private readonly testimonialService: TestimonialService) {}

  @Get()
  async findAll(): Promise<TestimonialResponseDto[]> {
    return this.testimonialService.findAllActive();
  }
}
