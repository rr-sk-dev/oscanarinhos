import { DatePipe, NgOptimizedImage } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErrorState, SvgIcon } from '@canarinhos/ngx-cui';
import { PageHeader } from '../shared/page-header/page-header';
import { NewsService } from './news.service';

/** Notícias: the latest article featured, then the rest as a compact list. */
@Component({
  selector: 'app-news',
  imports: [NgOptimizedImage, ErrorState, PageHeader, SvgIcon, DatePipe, RouterLink],
  templateUrl: './news.html',
  styleUrl: './news.css',
})
export class News {
  private newsService = inject(NewsService);

  protected articles = this.newsService.articles;
  protected featured = computed(() => this.articles()[0]);
  protected others = computed(() => this.articles().slice(1));
  protected loading = this.newsService.loading;
  protected error = this.newsService.error;

  protected retry(): void {
    this.newsService.reload();
  }
}
