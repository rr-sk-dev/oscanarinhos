import { RESEND_TIMEOUT_MS, ResendEmailSender } from './resend-email-sender';

describe('ResendEmailSender', () => {
  let fetchMock: jest.SpyInstance;
  let sender: ResendEmailSender;

  beforeEach(() => {
    fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 200 }));
    sender = new ResendEmailSender('re_key', 'Canarinhos <no-reply@example.com>');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('posts the email to Resend', async () => {
    await sender.send('a@example.com', 'Assunto', 'Corpo');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'Bearer re_key', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Canarinhos <no-reply@example.com>',
          to: ['a@example.com'],
          subject: 'Assunto',
          text: 'Corpo',
        }),
      }),
    );
  });

  it('aborts the request after 10 seconds', async () => {
    const signal = new AbortController().signal;
    const timeout = jest.spyOn(AbortSignal, 'timeout').mockReturnValue(signal);

    await sender.send('a@example.com', 'Assunto', 'Corpo');

    expect(RESEND_TIMEOUT_MS).toBe(10_000);
    expect(timeout).toHaveBeenCalledWith(10_000);
    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ signal }));
  });

  it('throws when Resend answers with an error status', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 429 }));

    await expect(sender.send('a@example.com', 'Assunto', 'Corpo')).rejects.toThrow(
      'Resend request failed with status 429',
    );
  });
});
