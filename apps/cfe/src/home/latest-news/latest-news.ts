import { DatePipe, NgOptimizedImage } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { News } from '@canarinhos/shared-types';

/** The latest articles, each linking to its page. */
@Component({
  selector: 'app-latest-news',
  imports: [RouterLink, DatePipe, NgOptimizedImage],
  templateUrl: './latest-news.html',
  styleUrl: './latest-news.css',
})
export class LatestNews {
  articles = input.required<News[]>();
  loading = input(false);
}
