import { EventChangeKind } from '../events/event-change';

export interface NotificationMessage {
  title: string;
  body: string;
}

interface EventChangeDetails {
  title: string;
  startsAt: Date;
  previousStartsAt: Date;
}

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const lisbonDateParts = new Intl.DateTimeFormat('pt-PT', {
  timeZone: 'Europe/Lisbon',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  hourCycle: 'h23',
});

// Only numeric parts come from Intl; names are fixed here because the abbreviations
// and separators Intl returns differ between ICU builds.
function formatLisbon(date: Date): string {
  const parts = new Map(lisbonDateParts.formatToParts(date).map((part) => [part.type, part.value]));
  const year = Number(parts.get('year'));
  const month = Number(parts.get('month'));
  const day = Number(parts.get('day'));
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  const hour = String(Number(parts.get('hour'))).padStart(2, '0');
  const minute = String(Number(parts.get('minute'))).padStart(2, '0');

  return `${weekday} ${day} ${MONTHS[month - 1]}, ${hour}:${minute}`;
}

export function buildNotificationMessage(
  kind: EventChangeKind,
  change: EventChangeDetails,
): NotificationMessage {
  // Neutral wording: titles vary in gender ("o treino", "a reunião") and a new start may be
  // earlier as well as later.
  if (kind === 'cancelled') {
    return {
      title: `Evento cancelado: ${change.title}`,
      body: `O evento «${change.title}» de ${formatLisbon(change.startsAt)} foi cancelado.`,
    };
  }

  return {
    title: `Novo horário: ${change.title}`,
    body: `O evento «${change.title}» passou de ${formatLisbon(change.previousStartsAt)} para ${formatLisbon(change.startsAt)}.`,
  };
}

export function buildEmailContent(
  message: NotificationMessage,
  eventUrl: string,
): { subject: string; body: string } {
  return { subject: message.title, body: `${message.body}\n\n${eventUrl}` };
}
