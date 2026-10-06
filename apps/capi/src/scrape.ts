import { Logger, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { CoreModule } from './core/core.module';
import { DatabaseModule } from './database/database.module';
import { CifScrapperModule } from './scrapper/cif-scrapper.module';
import { ScrapperCronService } from './scrapper/scrapper-cron.service';

/**
 * Runs the weekly cif.org.pt scrape once: fixtures, results, standings, scorers.
 *
 *   npm run scrape                                      # database from env/development.env
 *   SCRAPE_DATABASE_URL=postgresql://... npm run scrape # any other database
 */

@Module({
  imports: [CoreModule, DatabaseModule.forRoot(), CifScrapperModule],
})
class ScrapeModule {}

const logger = new Logger('Scrape');

function useDatabaseOverride(): void {
  const url = process.env.SCRAPE_DATABASE_URL;
  if (!url) {
    return;
  }
  // PrismaService reads POSTGRES_URL, and the env file never overrides a variable already set.
  process.env.POSTGRES_URL = url;
}

function describeDatabase(url: string | undefined): string {
  if (!url) {
    return 'POSTGRES_URL is not set';
  }
  const { hostname, port, pathname } = new URL(url);
  return `${hostname}${port ? `:${port}` : ''}${pathname}`;
}

async function main(): Promise<void> {
  useDatabaseOverride();

  const app = await NestFactory.createApplicationContext(ScrapeModule, {
    logger: ['log', 'warn', 'error'],
  });
  logger.log(`Scraping into ${describeDatabase(process.env.POSTGRES_URL)}`);

  try {
    await app.get(ScrapperCronService).runWeeklyScrape();
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
