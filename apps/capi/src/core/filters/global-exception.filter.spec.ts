import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { DomainException } from '../exceptions/base-domain-exception';
import { GlobalExceptionFilter } from './global-exception.filter';

class TestException extends DomainException {}

describe('GlobalExceptionFilter', () => {
  const filter = new GlobalExceptionFilter();

  const run = (exception: unknown) => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({ getResponse: () => ({ status }) }),
    } as unknown as ArgumentsHost;

    filter.catch(exception, host);

    return { status, json };
  };

  it.each([
    ['THING_NOT_FOUND', HttpStatus.NOT_FOUND],
    ['THING_ALREADY_EXISTS', HttpStatus.CONFLICT],
    ['LOGIN_CODE_INVALID', HttpStatus.BAD_REQUEST],
    ['TEAM_FORBIDDEN', HttpStatus.FORBIDDEN],
    ['ROLE_FORBIDDEN', HttpStatus.FORBIDDEN],
  ])('maps %s to %d and exposes the code', (code, expectedStatus) => {
    const { status, json } = run(new TestException(code, 'boom'));

    expect(status).toHaveBeenCalledWith(expectedStatus);
    expect(json).toHaveBeenCalledWith({ statusCode: expectedStatus, code, message: 'boom' });
  });

  it('hides unmapped domain exceptions behind a generic 500', () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { status, json } = run(new TestException('SOMETHING_ELSE', 'secret detail'));

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  });
});
