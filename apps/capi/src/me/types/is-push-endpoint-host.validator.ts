import { isIP } from 'node:net';
import { ValidateBy, ValidationOptions } from 'class-validator';

function isLocalhost(hostname: string): boolean {
  return hostname === 'localhost' || hostname.endsWith('.localhost');
}

/** web-push POSTs to the stored endpoint, so it must not point at an IP literal or localhost. */
export function isPushEndpointHost(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  let hostname: string;
  try {
    hostname = new URL(value).hostname.toLowerCase();
  } catch {
    return false;
  }

  const unbracketed = hostname.replace(/^\[(.*)\]$/, '$1');
  return isIP(unbracketed) === 0 && !isLocalhost(unbracketed);
}

export function IsPushEndpointHost(validationOptions?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isPushEndpointHost',
      validator: {
        validate: isPushEndpointHost,
        defaultMessage: () => '$property must not use an IP address or localhost as its host',
      },
    },
    validationOptions,
  );
}
