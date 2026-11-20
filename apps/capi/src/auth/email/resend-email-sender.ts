import { EmailSender } from './email-sender';

const RESEND_EMAILS_URL = 'https://api.resend.com/emails';
export const RESEND_TIMEOUT_MS = 10_000;

export class ResendEmailSender extends EmailSender {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {
    super();
  }

  async send(to: string, subject: string, body: string): Promise<void> {
    const response = await fetch(RESEND_EMAILS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: this.from, to: [to], subject, text: body }),
      signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`Resend request failed with status ${response.status}`);
    }
  }
}
