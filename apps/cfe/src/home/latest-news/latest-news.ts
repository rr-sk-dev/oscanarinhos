import { DatePipe, NgOptimizedImage } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { News } from '@canarinhos/shared-types';

/** The latest articles as swipeable story cards, each linking to its page. */
@Component({
  selector: 'app-latest-news',
  imports: [RouterLink, DatePipe, NgOptimizedImage],
  templateUrl: './latest-news.html',
  host: { class: 'block' },
})
export class LatestNews {
  articles = input.required<News[]>();
  loading = input(false);
}
