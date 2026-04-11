import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeroSection, SvgIcon } from '@canarinhos/ngx-cui';
import { DateFormatPipe } from '../pipes/date-formatting.pipe';
import { NewsService } from './news.service';
import { TeamService } from '../team/team.service';

@Component({
  selector: 'app-news',
  imports: [HeroSection, SvgIcon, DateFormatPipe, RouterLink],
  templateUrl: './news.html',
  styleUrl: './news.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class News {
  private newsService = inject(NewsService);

  protected teamPhoto = inject(TeamService).teamPhoto;
  protected articles = this.newsService.articles;
  protected loading = this.newsService.loading;
  protected error = this.newsService.error;
}
