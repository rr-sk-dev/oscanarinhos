import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database';
import { PrismaTestimonialRepository } from './testimonial-prisma.repository';
import { TestimonialController } from './testimonial.controller';
import { TestimonialRepository } from './testimonial.repository';
import { TestimonialService } from './testimonial.service';

@Module({
  imports: [DatabaseModule.forFeature('testimonial')],
  controllers: [TestimonialController],
  providers: [
    {
      provide: TestimonialRepository,
      useClass: PrismaTestimonialRepository,
    },
    TestimonialService,
  ],
  exports: [TestimonialRepository],
})
export class TestimonialsModule {}
