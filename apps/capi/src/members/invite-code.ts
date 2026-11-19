import { randomInt } from 'crypto';

// No 0/O, 1/I/L to avoid look-alike characters when a code is read out or typed.
const INVITE_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const INVITE_CODE_LENGTH = 10;

export function generateInviteCode(): string {
  let code = '';
  for (let index = 0; index < INVITE_CODE_LENGTH; index++) {
    code += INVITE_CODE_ALPHABET[randomInt(INVITE_CODE_ALPHABET.length)];
  }
  return code;
}
