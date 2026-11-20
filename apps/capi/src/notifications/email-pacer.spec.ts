import { EMAIL_PACING_MS, EmailPacer } from './email-pacer';

describe('EmailPacer', () => {
  let pacer: EmailPacer;

  beforeEach(() => {
    jest.useFakeTimers();
    pacer = new EmailPacer();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('paces at least 600 ms between the starts of consecutive sends', () => {
    expect(EMAIL_PACING_MS).toBe(600);
  });

  it('serializes two concurrent schedule calls with the gap between their starts', async () => {
    const started: string[] = [];
    const task = (name: string) => () => {
      started.push(name);
      return Promise.resolve(name);
    };

    const first = pacer.schedule(task('first'));
    const second = pacer.schedule(task('second'));

    await jest.advanceTimersByTimeAsync(0);
    expect(started).toEqual(['first']);
    await expect(first).resolves.toBe('first');

    await jest.advanceTimersByTimeAsync(EMAIL_PACING_MS - 1);
    expect(started).toEqual(['first']);

    await jest.advanceTimersByTimeAsync(1);
    expect(started).toEqual(['first', 'second']);
    await expect(second).resolves.toBe('second');
  });

  it('runs one task at a time even when a task outlasts the gap', async () => {
    let finishFirst: () => void = () => undefined;
    const second = jest.fn().mockResolvedValue(undefined);

    void pacer.schedule(() => new Promise<void>((resolve) => (finishFirst = resolve)));
    void pacer.schedule(second);

    await jest.advanceTimersByTimeAsync(EMAIL_PACING_MS * 3);
    expect(second).not.toHaveBeenCalled();

    finishFirst();
    await jest.advanceTimersByTimeAsync(0);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('does not block the next task when a task rejects', async () => {
    const failing = pacer.schedule(() => Promise.reject(new Error('429')));
    const next = pacer.schedule(() => Promise.resolve('ok'));
    const failed = expect(failing).rejects.toThrow('429');

    await jest.advanceTimersByTimeAsync(EMAIL_PACING_MS);

    await failed;
    await expect(next).resolves.toBe('ok');
  });

  it('does not block the next task when a task throws synchronously', async () => {
    const failing = pacer.schedule(() => {
      throw new Error('boom');
    });
    const next = pacer.schedule(() => Promise.resolve('ok'));
    const failed = expect(failing).rejects.toThrow('boom');

    await jest.advanceTimersByTimeAsync(EMAIL_PACING_MS);

    await failed;
    await expect(next).resolves.toBe('ok');
  });

  it('starts a task right away when nothing ran for longer than the gap', async () => {
    await pacer.schedule(() => Promise.resolve());
    await jest.advanceTimersByTimeAsync(EMAIL_PACING_MS);
    const task = jest.fn().mockResolvedValue(undefined);

    void pacer.schedule(task);
    await jest.advanceTimersByTimeAsync(0);

    expect(task).toHaveBeenCalledTimes(1);
  });
});
