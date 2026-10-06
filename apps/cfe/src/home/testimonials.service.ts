import { computed, Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Testimonial } from '@canarinhos/shared-types';
import { environment } from '../environments/environment';
import { valueOr } from '../shared/resource-value';

@Injectable({ providedIn: 'root' })
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
  readonly error = computed(() => (this.resource.error() ? 'Falha ao carregar testemunhos' : null));
}
