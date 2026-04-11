import { computed, Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Testimonial } from '@canarinhos/shared-types';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class TestimonialsService {
  private readonly baseUrl = environment.apiUrl;

  private readonly resource = httpResource<Testimonial[]>(
    () => `${this.baseUrl}/api/testimonials`,
  );

  readonly testimonials = computed(() => this.resource.value() ?? []);
  readonly loading = this.resource.isLoading;
  readonly error = computed(() =>
    this.resource.error() ? 'Falha ao carregar testemunhos' : null,
  );
}
