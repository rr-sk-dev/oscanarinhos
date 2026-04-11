import { PrismaClient } from '../../prisma/generated/prisma/client';

/**
 * Extracts valid model delegate names from PrismaClient.
 * Excludes internal properties ($connect, $disconnect, $transaction, etc.)
 * and symbol keys, leaving only model names like 'user', 'post', etc.
 */
export type ModelName = {
  [K in keyof PrismaClient]: K extends `$${string}` | `_${string}`
    ? never
    : K extends string
      ? K
      : never;
}[keyof PrismaClient];

/**
 * Resolves the Prisma delegate type for a given model name.
 * Use this to type your database service injections:
 *
 * @example
 * constructor(@InjectModel('user') private readonly userModel: ModelDelegate<'user'>) {}
 */
export type ModelDelegate<T extends ModelName> = PrismaClient[T];
