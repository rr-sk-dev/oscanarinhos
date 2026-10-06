import { computed, Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { News } from '@canarinhos/shared-types';
import { environment } from '../environments/environment';
import { valueOr } from '../shared/resource-value';

@Injectable({
  providedIn: 'root',
})
export class NewsService {
  private readonly baseUrl = environment.apiUrl;

  private readonly articlesResource = httpResource<News[]>(() => `${this.baseUrl}/api/news`, {
    defaultValue: [],
  });

  readonly articles = valueOr(this.articlesResource, []);
  readonly loading = this.articlesResource.isLoading;
  readonly error = computed(() => {
    const err = this.articlesResource.error();
    return err ? 'Falha ao carregar notícias' : null;
  });
}
