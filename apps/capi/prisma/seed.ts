import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';
import {
  NEWS,
  OPPONENTS,
  OTHER_SCORERS,
  OTHER_STANDINGS,
  OUR_TEAM,
  OUR_TEAM_NAME,
  PLAYERS,
  playerPhoto,
  RESULTS,
  SEASON,
  STAFF,
  staffPhoto,
  TESTIMONIALS,
} from './seed-data';

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * DAY_MS);
}

async function clearDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.match.deleteMany();
  await prisma.player.deleteMany();
  await prisma.teamStaff.deleteMany();
  await prisma.team.deleteMany();
  await prisma.standing.deleteMany();
  await prisma.scorer.deleteMany();
  await prisma.news.deleteMany();
  await prisma.testimonial.deleteMany();
}

async function seedTeams(prisma: PrismaClient): Promise<string> {
  const ourTeam = await prisma.team.create({ data: OUR_TEAM });
  await prisma.team.createMany({ data: OPPONENTS });
  return ourTeam.id;
}

async function seedSquad(prisma: PrismaClient, teamId: string): Promise<void> {
  await prisma.player.createMany({
    data: PLAYERS.map(({ slug, dateOfBirth, ...player }) => ({
      ...player,
      fullName: `${player.firstName} ${player.lastName}`,
      dateOfBirth: new Date(dateOfBirth),
      photo: playerPhoto(slug),
      teamId,
    })),
  });

  await prisma.teamStaff.createMany({
    data: STAFF.map(({ slug, dateOfBirth, ...staff }) => ({
      ...staff,
      dateOfBirth: new Date(dateOfBirth),
      photo: staffPhoto(slug),
      teamId,
    })),
  });
}

function ourStandingRow() {
  const wins = RESULTS.filter((r) => r.goalsFor > r.goalsAgainst).length;
  const draws = RESULTS.filter((r) => r.goalsFor === r.goalsAgainst).length;
  const goalsFor = RESULTS.reduce((sum, r) => sum + r.goalsFor, 0);
  const goalsAgainst = RESULTS.reduce((sum, r) => sum + r.goalsAgainst, 0);
  return {
    teamName: OUR_TEAM_NAME,
    teamLogo: OUR_TEAM.logo,
    wins,
    draws,
    losses: RESULTS.length - wins - draws,
    goalsFor,
    goalsAgainst,
  };
}

async function seedStandings(prisma: PrismaClient): Promise<void> {
  const others = OPPONENTS.map((team) => {
    const [wins, draws, losses, goalsFor, goalsAgainst] = OTHER_STANDINGS[team.name];
    return {
      teamName: team.name,
      teamLogo: team.logo,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
    };
  });

  const rows = [ourStandingRow(), ...others]
    .map((row) => ({
      ...row,
      gamesPlayed: row.wins + row.draws + row.losses,
      goalDifference: row.goalsFor - row.goalsAgainst,
      points: row.wins * 3 + row.draws,
    }))
    .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference);

  await prisma.standing.createMany({
    data: rows.map((row, index) => ({ ...row, season: SEASON, position: index + 1 })),
  });
}

async function seedScorers(prisma: PrismaClient): Promise<void> {
  const goalsByShirt = new Map<number, number>();
  for (const shirt of RESULTS.flatMap((r) => r.scorers)) {
    goalsByShirt.set(shirt, (goalsByShirt.get(shirt) ?? 0) + 1);
  }

  const ours: [string, string, number][] = [...goalsByShirt].map(([shirt, goals]) => {
    const player = PLAYERS.find((p) => p.shirtNumber === shirt);
    return [`${player?.firstName} ${player?.lastName}`, OUR_TEAM_NAME, goals];
  });

  const ranked = [...ours, ...OTHER_SCORERS].sort((a, b) => b[2] - a[2]);
  await prisma.scorer.createMany({
    data: ranked.map(([playerName, teamName, goals], index) => ({
      season: SEASON,
      rank: index + 1,
      playerName,
      teamName,
      goals,
    })),
  });
}

async function seedNews(prisma: PrismaClient): Promise<void> {
  for (const { daysAgo: age, ...article } of NEWS) {
    const date = daysAgo(age);
    await prisma.news.create({
      data: {
        ...article,
        publishedAt: article.status === 'PUBLISHED' ? date : null,
        createdAt: date,
      },
    });
  }
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed: NODE_ENV is production.');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.POSTGRES_URL }),
  });

  try {
    await clearDatabase(prisma);
    const ourTeamId = await seedTeams(prisma);
    await seedSquad(prisma, ourTeamId);
    await seedStandings(prisma);
    await seedScorers(prisma);
    await seedNews(prisma);
    await prisma.testimonial.createMany({ data: TESTIMONIALS });
    console.log('Seed complete.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
