import { Component, input } from '@angular/core';
import { Testimonial } from '@canarinhos/shared-types';

/** Horizontally scrolling fan quotes. */
@Component({
  selector: 'app-testimonials-carousel',
  templateUrl: './testimonials-carousel.html',
})
export class TestimonialsCarousel {
  testimonials = input.required<Testimonial[]>();
  loading = input(false);
}
