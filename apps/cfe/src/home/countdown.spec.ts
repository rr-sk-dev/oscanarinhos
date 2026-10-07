import { countdownUnits } from './countdown';

describe('countdownUnits', () => {
  const now = Date.parse('2026-09-19T12:00:00.000Z');

  it('splits the time left into zero-padded units', () => {
    const kickoff = now + ((2 * 24 + 3) * 3600 + 4 * 60 + 5) * 1000;

    expect(countdownUnits(kickoff, now)).toEqual([
      { value: '02', label: 'dias' },
      { value: '03', label: 'hrs' },
      { value: '04', label: 'min' },
      { value: '05', label: 'seg' },
    ]);
  });

  it('is null once kickoff has passed or when there is no kickoff', () => {
    expect(countdownUnits(now, now)).toBeNull();
    expect(countdownUnits(now - 1000, now)).toBeNull();
    expect(countdownUnits(null, now)).toBeNull();
  });
});
