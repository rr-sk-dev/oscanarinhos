import { buildEmailContent, buildNotificationMessage } from './notification-messages';

describe('buildNotificationMessage', () => {
  it('describes a cancelled event in winter time (UTC+0)', () => {
    const message = buildNotificationMessage('cancelled', {
      title: 'Treino',
      startsAt: new Date('2026-11-25T21:00:00Z'),
      previousStartsAt: new Date('2026-11-25T21:00:00Z'),
    });

    expect(message).toEqual({
      title: 'Evento cancelado: Treino',
      body: 'O evento «Treino» de qua 25 nov, 21:00 foi cancelado.',
    });
  });

  it('describes a cancelled event in summer time (UTC+1)', () => {
    const message = buildNotificationMessage('cancelled', {
      title: 'Jogo com o Benfica',
      startsAt: new Date('2026-07-14T20:00:00Z'),
      previousStartsAt: new Date('2026-07-14T20:00:00Z'),
    });

    expect(message).toEqual({
      title: 'Evento cancelado: Jogo com o Benfica',
      body: 'O evento «Jogo com o Benfica» de ter 14 jul, 21:00 foi cancelado.',
    });
  });

  it('states the old and new time of a rescheduled event across the DST change', () => {
    const message = buildNotificationMessage('rescheduled', {
      title: 'Jogo',
      startsAt: new Date('2027-04-03T15:00:00Z'),
      previousStartsAt: new Date('2027-03-27T15:00:00Z'),
    });

    expect(message).toEqual({
      title: 'Novo horário: Jogo',
      body: 'O evento «Jogo» passou de sáb 27 mar, 15:00 para sáb 3 abr, 16:00.',
    });
  });

  it('uses neutral wording when an event moves earlier', () => {
    const message = buildNotificationMessage('rescheduled', {
      title: 'Treino',
      startsAt: new Date('2026-11-24T20:00:00Z'),
      previousStartsAt: new Date('2026-11-25T21:00:00Z'),
    });

    expect(message).toEqual({
      title: 'Novo horário: Treino',
      body: 'O evento «Treino» passou de qua 25 nov, 21:00 para ter 24 nov, 20:00.',
    });
  });

  it('uses the Lisbon calendar day when UTC is still on the previous day', () => {
    const message = buildNotificationMessage('cancelled', {
      title: 'Treino',
      startsAt: new Date('2026-07-14T23:30:00Z'),
      previousStartsAt: new Date('2026-07-14T23:30:00Z'),
    });

    expect(message.body).toBe('O evento «Treino» de qua 15 jul, 00:30 foi cancelado.');
  });
});

describe('buildEmailContent', () => {
  it('uses the title as subject and appends the link to the body', () => {
    const content = buildEmailContent(
      {
        title: 'Evento cancelado: Treino',
        body: 'O evento «Treino» de qua 25 nov, 21:00 foi cancelado.',
      },
      'https://example.com/eventos/1',
    );

    expect(content).toEqual({
      subject: 'Evento cancelado: Treino',
      body: 'O evento «Treino» de qua 25 nov, 21:00 foi cancelado.\n\nhttps://example.com/eventos/1',
    });
  });
});
