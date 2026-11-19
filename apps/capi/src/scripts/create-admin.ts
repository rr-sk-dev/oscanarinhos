import { Logger, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { CoreModule } from '../core/core.module';
import { DatabaseModule } from '../database/database.module';
import { MembersModule } from '../members/members.module';
import { TeamsModule } from '../teams/teams.module';
import { UsersModule } from '../users/users.module';
import { CreateAdminService } from './create-admin.service';

/**
 * Makes a user ADMIN of a team (creating the user if needed). Used to bootstrap the first admin.
 *
 *   npm run members:create-admin -- <email> <team-slug>
 *
 * The team slug is the slugified team name, e.g. "os-canarinhos".
 */

@Module({
  imports: [CoreModule, DatabaseModule.forRoot(), UsersModule, MembersModule, TeamsModule],
  providers: [CreateAdminService],
})
class CreateAdminModule {}

const logger = new Logger('CreateAdmin');

async function main(): Promise<void> {
  const [email, teamSlug] = process.argv.slice(2);
  if (!email || !teamSlug) {
    throw new Error('Usage: npm run members:create-admin -- <email> <team-slug>');
  }

  const app = await NestFactory.createApplicationContext(CreateAdminModule, {
    logger: ['log', 'warn', 'error'],
  });
  try {
    const membership = await app.get(CreateAdminService).execute(email, teamSlug);
    logger.log(`${email} is ${membership.role} of team ${membership.teamId}`);
  } finally {
    await app.close();
  }
}

main().catch((err: unknown) => {
  logger.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
