import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { httpResource } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { News } from '@canarinhos/shared-types';
import { DateFormatPipe } from '../../pipes/date-formatting.pipe';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-news-detail',
  imports: [DateFormatPipe],
  templateUrl: './news-detail.html',
  styleUrl: './news-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsDetail {
  private route = inject(ActivatedRoute);
  private readonly baseUrl = environment.apiUrl;

  private slug = this.route.snapshot.params['slug'] as string | undefined;

  private articleResource = httpResource<News>(
    () =>
      this.slug
        ? `${this.baseUrl}/api/news/slug/${this.slug}`
        : undefined,
  );

  protected article = this.articleResource.value;
  protected loading = this.articleResource.isLoading;
  protected error = computed(() => {
    if (!this.slug) return 'Artigo não encontrado';
    const err = this.articleResource.error();
    return err ? 'Erro ao carregar artigo' : null;
  });
}
