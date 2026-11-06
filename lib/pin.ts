import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/** PIN de 4 numeros. */
export const isPin = (v: unknown): v is string => typeof v === "string" && /^\d{4}$/.test(v);

/** Guarda so o hash do PIN (scrypt com sal aleatorio), nunca o PIN em si. */
export function hashPin(pin: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPin(pin: string, stored: string | null) {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = scryptSync(pin, salt, 32);
  const expected = Buffer.from(hash, "hex");
  return expected.length === test.length && timingSafeEqual(expected, test);
}

/** Depois de MAX_FAILS erros seguidos, trava por LOCK_MINUTES (evita chutar os 10 mil PINs). */
export const MAX_FAILS = 5;
export const LOCK_MINUTES = 15;

export const isLocked = (lockedUntil: string | null) => !!lockedUntil && new Date(lockedUntil).getTime() > Date.now();

export function afterFailure(fails: number) {
  const next = fails + 1;
  if (next >= MAX_FAILS) {
    return { fails: 0, lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString() };
  }
  return { fails: next, lockedUntil: null };
}
