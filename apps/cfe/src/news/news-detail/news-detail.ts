import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { ErrorState } from '@canarinhos/ngx-cui';
import { httpResource } from '@angular/common/http';
import { News } from '@canarinhos/shared-types';
import { environment } from '../../environments/environment';
import { valueOr } from '../../shared/resource-value';

@Component({
  selector: 'app-news-detail',
  imports: [ErrorState, DatePipe],
  templateUrl: './news-detail.html',
})
export class NewsDetail {
  /** Route param, bound by withComponentInputBinding. */
  readonly slug = input.required<string>();

  private readonly baseUrl = environment.apiUrl;

  private articleResource = httpResource<News>(
    () => `${this.baseUrl}/api/news/slug/${this.slug()}`,
  );

  protected article = valueOr(this.articleResource, undefined);
  protected loading = this.articleResource.isLoading;
  protected error = computed(() =>
    this.articleResource.error() ? 'Erro ao carregar artigo' : null,
  );

  protected retry(): void {
    this.articleResource.reload();
  }
}
