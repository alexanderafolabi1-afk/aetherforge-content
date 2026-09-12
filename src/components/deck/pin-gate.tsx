import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  clearPin,
  clearSessionUnlock,
  hasStoredPin,
  isSessionUnlocked,
  markSessionUnlocked,
  setPin,
  verifyPin,
} from "@/lib/pin";

const MAX_ATTEMPTS = 5;
const COOLDOWN_MS = 30_000;

export function PinGate({ children }: { children: (logout: () => void) => ReactNode }) {
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [pin, setPinValue] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [resetConfirming, setResetConfirming] = useState(false);

  useEffect(() => {
    setNeedsSetup(!hasStoredPin());
    setUnlocked(isSessionUnlocked());
    setReady(true);
  }, []);

  const handleLogout = () => {
    clearSessionUnlock();
    setUnlocked(false);
    setPinValue("");
    setConfirmPin("");
    setError(null);
  };

  if (!ready) return null;
  if (unlocked) return <>{children(handleLogout)}</>;

  const inCooldown = cooldownUntil !== null && Date.now() < cooldownUntil;

  const handleSetup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pin.length < 4) {
      setError("Use at least 4 characters.");
      return;
    }
    if (pin !== confirmPin) {
      setError("PINs don't match.");
      return;
    }
    await setPin(pin);
    setNeedsSetup(false);
    setPinValue("");
    setConfirmPin("");
    markSessionUnlocked();
    setUnlocked(true);
  };

  const handleUnlock = async (e: FormEvent) => {
    e.preventDefault();
    if (inCooldown) return;
    setError(null);
    const ok = await verifyPin(pin);
    if (ok) {
      markSessionUnlocked();
      setUnlocked(true);
      return;
    }
    const next = attempts + 1;
    setPinValue("");
    if (next >= MAX_ATTEMPTS) {
      setAttempts(0);
      setCooldownUntil(Date.now() + COOLDOWN_MS);
      setError(`Too many attempts. Try again in ${COOLDOWN_MS / 1000}s.`);
    } else {
      setAttempts(next);
      setError("Incorrect PIN.");
    }
  };

  const handleReset = () => {
    clearPin();
    setNeedsSetup(true);
    setResetConfirming(false);
    setPinValue("");
    setConfirmPin("");
    setError(null);
    setAttempts(0);
    setCooldownUntil(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background px-5">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-secondary text-primary">
          {needsSetup ? <ShieldCheck className="size-5" /> : <KeyRound className="size-5" />}
        </div>
        <h1 className="font-display mt-4 text-center text-lg font-bold">
          {needsSetup ? "Set an admin PIN" : "Commander access"}
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {needsSetup
            ? "Guards this device's deck and restricted actions like Export and telemetry updates."
            : "Enter your PIN to open the deck."}
        </p>

        <form onSubmit={needsSetup ? handleSetup : handleUnlock} className="mt-5 grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="pin-input">{needsSetup ? "New PIN" : "PIN"}</Label>
            <Input
              id="pin-input"
              type="password"
              inputMode="numeric"
              autoFocus
              autoComplete="off"
              value={pin}
              disabled={inCooldown}
              onChange={(e) => setPinValue(e.target.value)}
              placeholder="••••"
            />
          </div>
          {needsSetup ? (
            <div className="grid gap-1.5">
              <Label htmlFor="pin-confirm">Confirm PIN</Label>
              <Input
                id="pin-confirm"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="••••"
              />
            </div>
          ) : null}
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          <Button type="submit" disabled={inCooldown}>
            {needsSetup ? "Set PIN and enter" : "Unlock"}
          </Button>
        </form>

        {!needsSetup ? (
          resetConfirming ? (
            <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-muted-foreground">
              <p>This clears the PIN only — your queue, stats, and notes stay put.</p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="destructive" onClick={handleReset}>
                  Reset PIN
                </Button>
                <Button size="sm" variant="outline" onClick={() => setResetConfirming(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="mt-4 w-full text-center text-xs text-muted-foreground underline underline-offset-2"
              onClick={() => setResetConfirming(true)}
            >
              Forgot your PIN?
            </button>
          )
        ) : null}

        <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground">
          This is a local screen lock, not real account security — anyone with developer tools
          and access to this device can bypass it. It only stops casual glances.
        </p>
      </div>
    </div>
  );
}
