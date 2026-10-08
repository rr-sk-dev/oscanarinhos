import { AgePipe } from './age.pipe';

describe('AgePipe', () => {
  const pipe = new AgePipe();
  const birthDate = '1990-05-12T00:00:00.000Z';

  it('counts whole years and waits for the birthday', () => {
    expect(pipe.transform(birthDate, new Date(2026, 4, 11))).toBe(35);
    expect(pipe.transform(birthDate, new Date(2026, 4, 12))).toBe(36);
  });

  it('is null when the birth date is missing or invalid', () => {
    expect(pipe.transform(null)).toBeNull();
    expect(pipe.transform('not a date')).toBeNull();
  });
});
