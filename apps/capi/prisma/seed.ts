import { PrismaPg } from '@prisma/adapter-pg';
import { MatchEvent } from '../src/matches/types/match.entity';
import { PrismaClient } from './generated/prisma/client';
import {
  COMPETITION_LABEL,
  NEWS,
  OPPONENTS,
  OTHER_SCORERS,
  OTHER_STANDINGS,
  OUR_TEAM,
  OUR_TEAM_NAME,
  PLAYERS,
  playerPhoto,
  RESULTS,
  SAMPLE_VIDEO_ID,
  SEASON,
  STAFF,
  staffPhoto,
  TESTIMONIALS,
  UPCOMING_HOME,
} from './seed-data';

const DAY_MS = 24 * 60 * 60 * 1000;

// Kickoffs are relative to now so the next match is always two days away at 15:00.
function kickoffForJourney(journey: number, nextJourney: number): Date {
  const date = new Date(Date.now() + 2 * DAY_MS + (journey - nextJourney) * 7 * DAY_MS);
  date.setHours(15, 0, 0, 0);
  return date;
}

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

async function seedTeams(
  prisma: PrismaClient,
): Promise<{ ourTeamId: string; opponentIds: string[] }> {
  const ourTeam = await prisma.team.create({ data: OUR_TEAM });
  const opponentIds: string[] = [];
  for (const opponent of OPPONENTS) {
    const team = await prisma.team.create({ data: opponent });
    opponentIds.push(team.id);
  }
  return { ourTeamId: ourTeam.id, opponentIds };
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

function goalEvents(scorers: number[], teamId: string): MatchEvent[] {
  return scorers.map((shirtNumber, index) => {
    const player = PLAYERS.find((p) => p.shirtNumber === shirtNumber);
    return {
      minute: 12 + index * 17,
      type: 'GOAL',
      playerName: player ? `${player.firstName} ${player.lastName}` : 'Desconhecido',
      teamId,
      detail: null,
    };
  });
}

async function seedMatches(
  prisma: PrismaClient,
  ourTeamId: string,
  opponentIds: string[],
): Promise<void> {
  const nextJourney = RESULTS.length + 1;

  for (const [index, result] of RESULTS.entries()) {
    const journey = index + 1;
    const opponentId = opponentIds[index];
    await prisma.match.create({
      data: {
        journey,
        kickoffAt: kickoffForJourney(journey, nextJourney),
        label: COMPETITION_LABEL,
        status: 'FINISHED',
        homeTeamId: result.home ? ourTeamId : opponentId,
        awayTeamId: result.home ? opponentId : ourTeamId,
        homeScore: result.home ? result.goalsFor : result.goalsAgainst,
        awayScore: result.home ? result.goalsAgainst : result.goalsFor,
        location: result.home ? 'Estádio Universitário de Lisboa' : null,
        videoId: result.hasVideo ? SAMPLE_VIDEO_ID : null,
        events: goalEvents(result.scorers, ourTeamId),
      },
    });
  }

  for (const [offset, isHome] of UPCOMING_HOME.entries()) {
    const journey = nextJourney + offset;
    const opponentId = opponentIds[journey - 1];
    await prisma.match.create({
      data: {
        journey,
        kickoffAt: kickoffForJourney(journey, nextJourney),
        label: COMPETITION_LABEL,
        homeTeamId: isHome ? ourTeamId : opponentId,
        awayTeamId: isHome ? opponentId : ourTeamId,
        location: isHome ? 'Estádio Universitário de Lisboa' : null,
      },
    });
  }
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
    const { ourTeamId, opponentIds } = await seedTeams(prisma);
    await seedSquad(prisma, ourTeamId);
    await seedMatches(prisma, ourTeamId, opponentIds);
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
