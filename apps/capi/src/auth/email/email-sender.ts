export abstract class EmailSender {
  abstract send(to: string, subject: string, body: string): Promise<void>;
}
