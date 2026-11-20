import { Injectable } from '@nestjs/common';

// Resend allows roughly 2 requests per second per account; leave headroom between emails.
export const EMAIL_PACING_MS = 600;

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Runs notification emails strictly one at a time, at least EMAIL_PACING_MS apart (start to
 * start), across every alert being processed. One in-memory promise chain: no queue, no retries.
 */
@Injectable()
export class EmailPacer {
  private tail: Promise<unknown> = Promise.resolve();

  schedule<T>(task: () => Promise<T>): Promise<T> {
    const result = this.tail.then(task);
    this.tail = this.tail.then(() => Promise.allSettled([result, wait(EMAIL_PACING_MS)]));
    return result;
  }
}
