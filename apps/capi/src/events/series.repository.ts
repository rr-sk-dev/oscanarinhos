import { CreateEventData, EventEntity } from './types/event.entity';
import { CreateSeriesData } from './types/series.entity';

export abstract class SeriesRepository {
  /**
   * Persists the series and its occurrences atomically: either all rows exist or none.
   * The events are linked to the new series by the implementation.
   */
  abstract createWithEvents(
    series: CreateSeriesData,
    events: Array<Omit<CreateEventData, 'seriesId'>>,
  ): Promise<EventEntity[]>;
}
