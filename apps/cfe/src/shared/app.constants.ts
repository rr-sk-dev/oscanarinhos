import { environment } from '../environments/environment';

export const APP_CONSTANTS = {
  teamSlug: environment.team.slug,
  teamName: environment.team.name,
  teamSubtitle: environment.team.subtitle,
  instagram: {
    handle: '@oscanarinhos1974',
    url: 'https://instagram.com/oscanarinhos1974',
  },
  // The CIF season the app shows. `id` is the API's season key, `label` is the UI text.
  season: {
    id: '2026-27',
    label: '2026/27',
  },
} as const;
