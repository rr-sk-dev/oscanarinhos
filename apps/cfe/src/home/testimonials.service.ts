import { Service } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Testimonial } from '@canarinhos/shared-types';
import { environment } from '../environments/environment';
import { reloadOnResume } from '../shared/data-refresh';
import { valueOr } from '../shared/resource-value';

@Service()
export class TestimonialsService {
  private readonly baseUrl = environment.apiUrl;

  private readonly resource = httpResource<Testimonial[]>(
    () => `${this.baseUrl}/api/testimonials`,
    {
      defaultValue: [],
    },
  );

  readonly testimonials = valueOr(this.resource, []);
  readonly loading = this.resource.isLoading;

  constructor() {
    reloadOnResume(this.resource);
  }

  reload(): void {
    this.resource.reload();
  }
}
