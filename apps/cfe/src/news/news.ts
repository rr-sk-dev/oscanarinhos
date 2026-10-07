import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SvgIcon } from '@canarinhos/ngx-cui';
import { NewsService } from './news.service';

@Component({
  selector: 'app-news',
  imports: [SvgIcon, DatePipe, RouterLink],
  templateUrl: './news.html',
  styleUrl: './news.css',
})
export class News {
  private newsService = inject(NewsService);

  protected articles = this.newsService.articles;
  protected loading = this.newsService.loading;
  protected error = this.newsService.error;
}
