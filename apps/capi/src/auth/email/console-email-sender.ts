import { Injectable, Logger } from '@nestjs/common';
import { EmailSender } from './email-sender';

/** Development only: prints the message (including the sign-in code) to the log. */
@Injectable()
export class ConsoleEmailSender extends EmailSender {
  private readonly logger = new Logger(ConsoleEmailSender.name);

  send(to: string, subject: string, body: string): Promise<void> {
    this.logger.log(`Email to ${to} | ${subject}\n${body}`);
    return Promise.resolve();
  }
}
