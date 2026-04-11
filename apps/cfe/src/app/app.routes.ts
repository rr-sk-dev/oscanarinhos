import { Route } from '@angular/router';
import { Home } from '../home/home';
import { AppLayout } from '../layouts/app-layout/app-layout';
import { DetailLayout } from '../layouts/detail-layout/detail-layout';
import { Results } from '../results/results';

export const appRoutes: Route[] = [
  // ============================================
  // APP LAYOUT — single instance persisted across all tab navigations
  // Desktop: slim top bar + footer
  // Mobile: bottom tab bar
  // ============================================
  {
    path: '',
    component: AppLayout,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: Home },
      { path: 'results', component: Results },
      {
        path: 'squad',
        loadComponent: () => import('../squad/squad').then((m) => m.Squad),
      },
      {
        path: 'news',
        loadComponent: () => import('../news/news').then((m) => m.News),
      },
      {
        path: 'more',
        loadComponent: () => import('../more/more').then((m) => m.More),
      },
    ],
  },

  // ============================================
  // DETAIL LAYOUT
  // Back button + minimal header, immersive content
  // ============================================
  {
    path: 'live',
    component: DetailLayout,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('../live/live-transmission/live-transmission').then(
            (m) => m.LiveTransmission,
          ),
      },
    ],
  },
  {
    path: 'squad/:id',
    component: DetailLayout,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('../squad/player-details/player-details').then(
            (m) => m.PlayerDetails,
          ),
      },
    ],
  },
  {
    path: 'staff/:id',
    component: DetailLayout,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('../squad/staff-details/staff-details').then(
            (m) => m.StaffDetails,
          ),
      },
    ],
  },
  {
    path: 'news/:slug',
    component: DetailLayout,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('../news/news-detail/news-detail').then((m) => m.NewsDetail),
      },
    ],
  },
  {
    path: 'matches/:id',
    component: DetailLayout,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('../results/match-detail/match-detail').then(
            (m) => m.MatchDetail,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'home' },
];
