export interface CountdownUnit {
  value: string;
  label: string;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const pad = (n: number): string => n.toString().padStart(2, '0');

/** Days/hours/minutes/seconds until `kickoff`, zero-padded, or null once it has passed. */
export function countdownUnits(kickoff: number | null, now: number): CountdownUnit[] | null {
  if (kickoff === null || kickoff <= now) {
    return null;
  }
  const diff = kickoff - now;
  return [
    { value: pad(Math.floor(diff / DAY)), label: 'dias' },
    { value: pad(Math.floor((diff % DAY) / HOUR)), label: 'hrs' },
    { value: pad(Math.floor((diff % HOUR) / MINUTE)), label: 'min' },
    { value: pad(Math.floor((diff % MINUTE) / SECOND)), label: 'seg' },
  ];
}
