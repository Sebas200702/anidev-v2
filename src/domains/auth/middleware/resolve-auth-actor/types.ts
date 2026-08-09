/**
 * @module domains/auth/middleware/resolve-auth-actor/types
 * @remarks Narrowed slice of `App.Locals` returned by the non-throwing
 * middleware session resolver.
 */

export type SessionLocals = Pick<App.Locals, 'user' | 'session'>
