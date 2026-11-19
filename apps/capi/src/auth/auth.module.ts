import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { EmailProvider } from '../core/environment/env-config';
import { DatabaseModule } from '../database';
import { MembersModule } from '../members/members.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConsoleEmailSender } from './email/console-email-sender';
import { EmailSender } from './email/email-sender';
import { ResendEmailSender } from './email/resend-email-sender';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { TeamMemberGuard } from './guards/team-member.guard';
import { JwtStrategy } from './jwt.strategy';
import { PrismaLoginCodeRepository } from './login-code-prisma.repository';
import { LoginCodeRepository } from './login-code.repository';

@Module({
  imports: [
    DatabaseModule.forFeature('loginCode'),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.getOrThrow<string>('JWT_EXPIRES_IN'),
        } as { expiresIn: JwtSignOptions['expiresIn'] },
      }),
    }),
    UsersModule,
    MembersModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    TeamMemberGuard,
    RolesGuard,
    { provide: LoginCodeRepository, useClass: PrismaLoginCodeRepository },
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
  exports: [JwtAuthGuard, TeamMemberGuard, RolesGuard, MembersModule],
})
export class AuthModule {}
