import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Modal, SvgIcon } from '@canarinhos/ngx-cui';
import { MatchStatus } from '@canarinhos/shared-types';
import { NextMatchService } from './next-match.service';
import { StandingsService } from './standings.service';
import { TestimonialsService } from './testimonials.service';
import { MatchUtilsService } from '../shared/match-utils.service';
import { ResultsService } from '../results/results.service';
import { NewsService } from '../news/news.service';
import { DateFormatPipe } from '../pipes/date-formatting.pipe';
import { APP_CONSTANTS } from '../shared/app.constants';

interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface StoreItem {
  name: string;
  price: string;
  description: string;
  image: string;
}

@Component({
  selector: 'app-home',
  imports: [NgClass, SvgIcon, RouterLink, DateFormatPipe, Modal],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit {
  private nextMatchService = inject(NextMatchService);
  private standingsService = inject(StandingsService);
  private resultsService = inject(ResultsService);
  private newsService = inject(NewsService);
  private testimonialsService = inject(TestimonialsService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  protected matchUtils = inject(MatchUtilsService);
  protected teamSlug = APP_CONSTANTS.teamSlug;

  // Testimonials
  protected testimonials = this.testimonialsService.testimonials;
  protected testimonialsLoading = this.testimonialsService.loading;

  // Next match
  protected loading = this.nextMatchService.loading;
  protected error = this.nextMatchService.error;
  protected nextGame = this.nextMatchService.match;

  // Recent results (last 5)
  protected recentResults = computed(() => {
    const results = this.resultsService.results();
    return results.slice(0, 5);
  });
  protected resultsLoading = this.resultsService.resultsLoading;

  // Latest news (3)
  protected latestNews = computed(() => {
    const articles = this.newsService.articles();
    return articles.slice(0, 3);
  });
  protected newsLoading = this.newsService.loading;

  // Standings
  protected standingsContext = this.standingsService.context;
  protected standingsLoading = this.standingsService.loading;

  // Live detection
  protected isLive = computed(() => {
    const game = this.nextGame();
    return game?.status === MatchStatus.IN_PROGRESS;
  });

  // Store modal
  protected storeModalOpen = signal(false);
  protected storeItems: StoreItem[] = [
    {
      name: 'Camisola Principal',
      price: '35€',
      description: 'Camisola oficial amarela e preta. Tecido respirável e confortável para o dia-a-dia ou para apoiar nas bancadas.',
      image: 'assets/equip1.jpg',
    },
    {
      name: 'Camisola Alternativa',
      price: '35€',
      description: 'Equipamento alternativo em azul. Design moderno com os detalhes clássicos dos Canarinhos.',
      image: 'assets/equip2.jpg',
    },
    {
      name: 'Cachecol Oficial',
      price: '15€',
      description: 'Cachecol oficial do clube para sentires as cores de perto em todos os jogos.',
      image: 'assets/scarf.webp',
    },
  ];

  // Countdown
  protected countdown = signal<CountdownParts | null>(null);
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.startCountdown();
    this.destroyRef.onDestroy(() => {
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }
    });
  }

  private startCountdown(): void {
    const tick = () => {
      const game = this.nextGame();
      if (!game?.kickoffAt) {
        this.countdown.set(null);
        return;
      }
      const now = Date.now();
      const kickoff = new Date(game.kickoffAt).getTime();
      const diff = kickoff - now;

      if (diff <= 0) {
        this.countdown.set(null);
        return;
      }

      this.countdown.set({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    tick();
    this.countdownInterval = setInterval(tick, 1000);
  }

  protected openStoreModal(): void {
    this.storeModalOpen.set(true);
  }

  protected closeStoreModal(): void {
    this.storeModalOpen.set(false);
  }

  protected navigateToLive(): void {
    this.router.navigate(['/live']);
  }

  protected navigateToMatch(matchId: string): void {
    this.router.navigate(['/matches', matchId]);
  }

  protected padZero(n: number): string {
    return n.toString().padStart(2, '0');
  }
}
