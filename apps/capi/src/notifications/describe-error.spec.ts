import { describeError } from './describe-error';

describe('describeError', () => {
  it('gives the message and the status code when both are present', () => {
    const error = Object.assign(new Error('Received unexpected response code'), {
      statusCode: 429,
    });

    expect(describeError(error)).toBe('Received unexpected response code (status 429)');
  });

  it('gives only the message of a plain error', () => {
    expect(describeError(new Error('db down'))).toBe('db down');
  });

  it('gives only the status of an object without a message', () => {
    expect(describeError({ statusCode: 500 })).toBe('status 500');
  });

  it('never includes other properties such as the endpoint, body or stack', () => {
    const error = Object.assign(new Error('Received unexpected response code'), {
      statusCode: 410,
      endpoint: 'https://fcm.googleapis.com/fcm/send/secret-token',
      body: 'gone',
      headers: { 'x-a': 'b' },
    });

    const described = describeError(error);

    expect(described).not.toContain('secret-token');
    expect(described).not.toContain('gone');
    expect(described).not.toContain('at ');
  });

  it('describes something that is not an error', () => {
    expect(describeError('boom')).toBe('unknown error');
    expect(describeError(null)).toBe('unknown error');
  });
});
