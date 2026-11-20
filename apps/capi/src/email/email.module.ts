import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConsoleEmailSender } from '../auth/email/console-email-sender';
import { EmailSender } from '../auth/email/email-sender';
import { ResendEmailSender } from '../auth/email/resend-email-sender';
import { EmailProvider } from '../core/environment/env-config';

@Module({
  providers: [
    {
      provide: EmailSender,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): EmailSender =>
        configService.getOrThrow<EmailProvider>('EMAIL_PROVIDER') === EmailProvider.Resend
          ? new ResendEmailSender(
              configService.getOrThrow<string>('RESEND_API_KEY'),
              configService.getOrThrow<string>('EMAIL_FROM'),
            )
          : new ConsoleEmailSender(),
    },
  ],
  exports: [EmailSender],
})
export class EmailModule {}
