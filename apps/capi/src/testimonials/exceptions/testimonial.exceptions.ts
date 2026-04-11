import { DomainException } from '../../core/exceptions/base-domain-exception';

export class TestimonialNotFoundException extends DomainException {
  constructor() {
    super('TESTIMONIAL_NOT_FOUND', 'Testimonial not found');
  }
}
