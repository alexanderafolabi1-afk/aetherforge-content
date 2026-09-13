/**
 * Local admin PIN lock.
 *
 * This guards casual access to the Command Deck on a shared or borrowed
 * device — it is NOT real account security. The app is 100% client-side
 * (per connectors.ts: no secrets in the frontend), so all of this code is
 * visible and editable via devtools; anyone with that access, or access to
 * this browser's storage, can bypass it. What it does provide: the PIN is
 * never stored in plaintext (only a salted SHA-256 hash lives in
 * localStorage), so a casual glance at storage doesn't reveal it.
 */

const STORAGE_KEY = "aetherforge-admin-pin";
const SESSION_KEY = "aetherforge-admin-unlocked";

interface StoredPin {
  salt: string;
  hash: string;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomSaltHex(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(new Uint8Array(digest));
}

/** Best-effort constant-time compare — JS engines can't fully guarantee timing safety, but this avoids the obvious short-circuit-on-first-mismatch leak. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function hasStoredPin(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export async function setPin(pin: string): Promise<void> {
  const salt = randomSaltHex();
  const hash = await sha256Hex(salt + pin);
  const stored: StoredPin = { salt, hash };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

export async function verifyPin(pin: string): Promise<boolean> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    const stored = JSON.parse(raw) as StoredPin;
    const hash = await sha256Hex(stored.salt + pin);
    return safeEqual(hash, stored.hash);
  } catch {
    return false;
  }
}

export function clearPin(): void {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

export function isSessionUnlocked(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

export function markSessionUnlocked(): void {
  sessionStorage.setItem(SESSION_KEY, "1");
}

/** Logout: clears only the "unlocked this session" flag — the configured PIN itself is untouched, so next open asks for the existing PIN rather than forcing setup again. */
export function clearSessionUnlock(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * type="password" is what actually masks input in every browser; type="tel"
 * only *looks* masked here because of the -webkit-text-security CSS rule
 * paired with it, which Firefox and other non-WebKit/Blink engines don't
 * implement — in those browsers a PIN typed into a "tel" field would render
 * in plain text. Feature-detect support and only use "tel" (which avoids
 * Safari's password-manager overlay stealing focus/taps on this numeric
 * PIN) where the masking actually works; otherwise fall back to the native
 * masking of type="password".
 *
 * A PIN is also not guaranteed to be numeric — setup only ever enforced a
 * minimum length, so older PINs may contain letters or symbols. type="tel"
 * doesn't restrict input either way, so this never needs a `pattern`
 * attribute (which would silently block a valid non-numeric PIN's form
 * submission before verifyPin ever runs).
 */
export const PIN_INPUT_TYPE: "tel" | "password" =
  typeof CSS !== "undefined" &&
  typeof CSS.supports === "function" &&
  CSS.supports("-webkit-text-security", "disc")
    ? "tel"
    : "password";

export const pinInputProps =
  PIN_INPUT_TYPE === "tel"
    ? { type: PIN_INPUT_TYPE, className: "pin-mask" }
    : { type: PIN_INPUT_TYPE };
