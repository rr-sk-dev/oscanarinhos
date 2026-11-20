import { detectEventChange } from './event-change';
import { EventEntity } from './types/event.entity';

const now = new Date('2026-06-15T12:00:00.000Z');
const future = new Date('2026-06-20T18:00:00.000Z');
const otherFuture = new Date('2026-06-21T18:00:00.000Z');
const past = new Date('2026-06-10T18:00:00.000Z');
const otherPast = new Date('2026-06-11T18:00:00.000Z');

const buildEvent = (overrides: Partial<EventEntity> = {}): EventEntity => ({
  id: 'event-1',
  teamId: 'team-1',
  type: 'TRAINING',
  title: 'Treino',
  startsAt: future,
  endsAt: null,
  location: 'Campo',
  notes: null,
  respondBy: null,
  status: 'SCHEDULED',
  matchId: null,
  seriesId: null,
  ...overrides,
});

describe('detectEventChange', () => {
  it('returns cancelled when a scheduled future event becomes canceled', () => {
    const before = buildEvent();
    const after = buildEvent({ status: 'CANCELED' });

    expect(detectEventChange(before, after, now)).toBe('cancelled');
  });

  it('returns null when an event stays canceled', () => {
    const before = buildEvent({ status: 'CANCELED' });
    const after = buildEvent({ status: 'CANCELED' });

    expect(detectEventChange(before, after, now)).toBeNull();
  });

  it('returns null when a canceled event is scheduled again', () => {
    const before = buildEvent({ status: 'CANCELED' });
    const after = buildEvent({ status: 'SCHEDULED' });

    expect(detectEventChange(before, after, now)).toBeNull();
  });

  it('returns null when a canceled event is scheduled again with a different start', () => {
    const before = buildEvent({ status: 'CANCELED' });
    const after = buildEvent({ status: 'SCHEDULED', startsAt: otherFuture });

    expect(detectEventChange(before, after, now)).toBeNull();
  });

  it('returns rescheduled when a scheduled event gets a different future start', () => {
    const before = buildEvent();
    const after = buildEvent({ startsAt: otherFuture });

    expect(detectEventChange(before, after, now)).toBe('rescheduled');
  });

  it('returns rescheduled when the old start is in the future and the new start is in the past', () => {
    const before = buildEvent({ startsAt: future });
    const after = buildEvent({ startsAt: past });

    expect(detectEventChange(before, after, now)).toBe('rescheduled');
  });

  it('returns null when both starts are in the past', () => {
    const before = buildEvent({ startsAt: past });
    const after = buildEvent({ startsAt: otherPast });

    expect(detectEventChange(before, after, now)).toBeNull();
  });

  it('returns null when cancelling an event that already started', () => {
    const before = buildEvent({ startsAt: past });
    const after = buildEvent({ startsAt: past, status: 'CANCELED' });

    expect(detectEventChange(before, after, now)).toBeNull();
  });

  it('returns cancelled when the event is canceled and its start changes in the same edit', () => {
    const before = buildEvent();
    const after = buildEvent({ status: 'CANCELED', startsAt: otherFuture });

    expect(detectEventChange(before, after, now)).toBe('cancelled');
  });

  it('returns null when only title, location or notes change', () => {
    const before = buildEvent();
    const after = buildEvent({ title: 'Novo título', location: 'Outro campo', notes: 'Notas' });

    expect(detectEventChange(before, after, now)).toBeNull();
  });
});
