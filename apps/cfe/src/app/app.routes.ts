import { Route } from '@angular/router';
import { authGuard } from '../members/auth/auth.guard';
import { managerGuard } from '../members/auth/role.guard';
import { Home } from '../home/home';
import { AppLayout } from '../layouts/app-layout/app-layout';
import { DetailLayout } from '../layouts/detail-layout/detail-layout';
import { Results } from '../results/results';

// Route titles are suffixed with the team name by AppTitleStrategy.
export const appRoutes: Route[] = [
  // ============================================
  // APP LAYOUT — single instance persisted across all tab navigations
  // Desktop: slim top bar + footer
  // Mobile: floating bottom tab bar, with Ao Vivo in the centre
  // ============================================
  {
    path: '',
    component: AppLayout,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', title: 'Início', component: Home },
      { path: 'results', title: 'Jogos', component: Results },
      {
        path: 'squad',
        title: 'Plantel',
        loadComponent: () => import('../squad/squad').then((m) => m.Squad),
      },
      {
        path: 'news',
        title: 'Notícias',
        loadComponent: () => import('../news/news').then((m) => m.News),
      },
      {
        path: 'live',
        title: 'Ao Vivo',
        loadComponent: () =>
          import('../live/live-transmission/live-transmission').then((m) => m.LiveTransmission),
      },
      {
        path: 'more',
        title: 'Mais',
        loadComponent: () => import('../more/more').then((m) => m.More),
      },
    ],
  },

  // ============================================
  // DETAIL LAYOUT
  // Back button + minimal header, immersive content.
  // The router falls through to here when no tab route above matches.
  // ============================================
  {
    path: '',
    component: DetailLayout,
    children: [
      {
        path: 'members/sign-in',
        title: 'Entrar',
        loadComponent: () => import('../members/auth/sign-in/sign-in').then((m) => m.SignIn),
      },
      {
        path: 'members/invite/:code',
        title: 'Convite',
        canActivate: [authGuard],
        loadComponent: () => import('../members/invite/accept-invite').then((m) => m.AcceptInvite),
      },
      {
        path: 'members',
        title: 'Calendário',
        canActivate: [authGuard],
        loadComponent: () => import('../members/calendar/calendar').then((m) => m.Calendar),
      },
      {
        path: 'members/stats',
        title: 'Estatísticas',
        canActivate: [authGuard],
        loadComponent: () => import('../members/stats/stats').then((m) => m.Stats),
      },
      {
        path: 'members/events/new',
        title: 'Novo evento',
        canActivate: [authGuard, managerGuard],
        loadComponent: () =>
          import('../members/event/event-form/event-form').then((m) => m.EventForm),
      },
      {
        path: 'members/events/:id/edit',
        title: 'Editar evento',
        canActivate: [authGuard, managerGuard],
        loadComponent: () =>
          import('../members/event/event-form/event-form').then((m) => m.EventForm),
      },
      {
        path: 'members/events/:id',
        title: 'Evento',
        canActivate: [authGuard],
        loadComponent: () => import('../members/event/event-detail').then((m) => m.EventDetail),
      },
      {
        path: 'squad/:id',
        title: 'Jogador',
        loadComponent: () =>
          import('../squad/player-details/player-details').then((m) => m.PlayerDetails),
      },
      {
        path: 'staff/:id',
        title: 'Equipa Técnica',
        loadComponent: () =>
          import('../squad/staff-details/staff-details').then((m) => m.StaffDetails),
      },
      {
        path: 'news/:slug',
        title: 'Notícia',
        loadComponent: () => import('../news/news-detail/news-detail').then((m) => m.NewsDetail),
      },
      {
        path: 'matches/:id',
        title: 'Jogo',
        loadComponent: () =>
          import('../results/match-detail/match-detail').then((m) => m.MatchDetail),
      },
    ],
  },
  { path: '**', redirectTo: 'home' },
];
