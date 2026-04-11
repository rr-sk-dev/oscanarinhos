import { environment } from '../environments/environment';

export const APP_CONSTANTS = {
  teamSlug: environment.team.slug,
  teamName: environment.team.name,
  teamSubtitle: environment.team.subtitle,
} as const;
