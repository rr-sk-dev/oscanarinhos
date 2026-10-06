import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';

/**
 * A journey page lists its matches grouped by day. A day can be any weekday
 * (journeys run from Friday night to Sunday), and a match with no result keeps
 * empty score cells, e.g. when it was postponed.
 *
 * <h1>Sexta-Feira, 18 Setembro 2026</h1>
 * <div class="blocos-resultados">
 *   <article class="games-list" data-game-id="...">
 *     <ul class="top-holder-result">
 *       <li><h1>Home Team</h1> ...</li>
 *       <li>
 *         <section>...</section>
 *         <div><h1>Home Score</h1></div>
 *         <div><span><h2>21:30</h2></span><span><h3>vs</h3></span></div>
 *         <div><h1>Away Score</h1></div>
 *       </li>
 *       <li><h1>Away Team</h1> ...</li>
 *     </ul>
 *   </article>
 * </div>
 */

interface Fixture {
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo: string | null;
  awayTeamLogo: string | null;
  kickoffAt: Date | null;
}

export interface PlayedMatch extends Fixture {
  homeScore: number;
  awayScore: number;
}

export interface UnplayedMatch extends Fixture {
  homeScore: null;
  awayScore: null;
}

export type ScrapedMatch = PlayedMatch | UnplayedMatch;

const CIF_TIME_ZONE = 'Europe/Lisbon';
const CIF_ORIGIN = 'https://www.cif.org.pt';

const MONTHS: Record<string, number> = {
  janeiro: 1,
  fevereiro: 2,
  marco: 3,
  abril: 4,
  maio: 5,
  junho: 6,
  julho: 7,
  agosto: 8,
  setembro: 9,
  outubro: 10,
  novembro: 11,
  dezembro: 12,
};

interface CalendarDay {
  year: number;
  month: number;
  day: number;
}

export function isPlayed(match: ScrapedMatch): match is PlayedMatch {
  return match.homeScore !== null;
}

export function parseResultsPage(html: string): ScrapedMatch[] {
  const $ = cheerio.load(html);
  const matches: ScrapedMatch[] = [];
  let currentDay: CalendarDay | null = null;

  // Day headings and match articles come back in document order,
  // so each article belongs to the last day heading seen before it.
  $('h1, article.games-list').each((_, element) => {
    if (element.type === 'tag' && element.name === 'article') {
      const match = parseArticle($, element, currentDay);
      if (match) {
        matches.push(match);
      }
      return;
    }

    if ($(element).closest('article').length > 0) {
      return;
    }

    currentDay = parseDayHeading($(element).text()) ?? currentDay;
  });

  return matches;
}

function parseArticle(
  $: cheerio.CheerioAPI,
  article: AnyNode,
  day: CalendarDay | null,
): ScrapedMatch | null {
  const columns = $(article).find('ul.top-holder-result > li');
  if (columns.length < 3) {
    return null;
  }

  const homeTeamName = $(columns[0]).find('h1').first().text().trim();
  const awayTeamName = $(columns[2]).find('h1').first().text().trim();
  if (!homeTeamName || !awayTeamName) {
    return null;
  }

  const teams = {
    homeTeamName,
    awayTeamName,
    homeTeamLogo: parseLogo($(columns[0]).find('img').attr('src')),
    awayTeamLogo: parseLogo($(columns[2]).find('img').attr('src')),
  };

  // Middle column children: section, home-score div, kickoff div, away-score div
  const middle = $(columns[1]).children('div');
  const homeScore = parseScore($(middle[0]).find('h1').text());
  const awayScore = parseScore($(middle[2]).find('h1').text());
  const kickoffAt = parseKickoff(day, $(middle[1]).find('h2').text());

  if (homeScore === null || awayScore === null) {
    return { ...teams, homeScore: null, awayScore: null, kickoffAt };
  }

  return { ...teams, homeScore, awayScore, kickoffAt };
}

/** "https://www.cif.org.pt:443/.../vdr.png?_=1" → "https://www.cif.org.pt/.../vdr.png" */
function parseLogo(src: string | undefined): string | null {
  if (!src) {
    return null;
  }
  const url = new URL(src, CIF_ORIGIN);
  return `${url.origin}${url.pathname}`;
}

function parseScore(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  return Number(trimmed);
}

/**
 * "Sexta-Feira, 18 Setembro 2026" → { year: 2026, month: 9, day: 18 }.
 * The weekday is ignored, so any day of the week is accepted.
 */
export function parseDayHeading(text: string): CalendarDay | null {
  const normalized = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const found = normalized.match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
  if (!found) {
    return null;
  }

  const month = MONTHS[found[2]];
  if (!month) {
    return null;
  }

  return { year: Number(found[3]), month, day: Number(found[1]) };
}

function parseKickoff(day: CalendarDay | null, timeText: string): Date | null {
  const time = timeText.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!day || !time) {
    return null;
  }

  return lisbonTimeToDate(day, Number(time[1]), Number(time[2]));
}

/** Converts a wall-clock time in Lisbon to an absolute Date, honouring summer time. */
function lisbonTimeToDate(day: CalendarDay, hours: number, minutes: number): Date {
  const asIfUtc = Date.UTC(day.year, day.month - 1, day.day, hours, minutes);
  return new Date(asIfUtc - timeZoneOffsetMs(new Date(asIfUtc)));
}

function timeZoneOffsetMs(instant: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CIF_TIME_ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((p) => p.type === type)?.value);

  const wallClockAsUtc = Date.UTC(
    part('year'),
    part('month') - 1,
    part('day'),
    part('hour'),
    part('minute'),
  );
  return wallClockAsUtc - instant.getTime();
}
