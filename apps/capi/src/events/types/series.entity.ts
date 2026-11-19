export interface SeriesInput {
  title: string;
  location?: string;
  /** 1 = Monday ... 7 = Sunday. */
  weekdays: number[];
  /** "HH:mm", Europe/Lisbon wall clock. */
  startTime: string;
  durationMinutes: number;
  /** "YYYY-MM-DD", inclusive. */
  startDate: string;
  /** "YYYY-MM-DD", inclusive. */
  endDate: string;
}

export interface CreateSeriesData {
  teamId: string;
  title: string;
  location: string | null;
  weekdays: number[];
  startTime: string;
  durationMinutes: number;
  startDate: Date;
  endDate: Date;
}
