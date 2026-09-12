import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyPin } from "@/lib/pin";

export function PinConfirmDialog({
  open,
  actionLabel,
  onResult,
}: {
  open: boolean;
  actionLabel: string;
  onResult: (ok: boolean) => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await verifyPin(pin);
    if (!ok) {
      setError("Incorrect PIN.");
      setPin("");
      return;
    }
    setPin("");
    setError(null);
    onResult(true);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setPin("");
          setError(null);
          onResult(false);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm admin PIN</DialogTitle>
          <DialogDescription>Re-enter your PIN to {actionLabel}.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-3" onSubmit={handleSubmit}>
          <div className="grid gap-1.5">
            <Label htmlFor="pin-confirm-input">PIN</Label>
            <Input
              id="pin-confirm-input"
              type="password"
              inputMode="numeric"
              autoFocus
              autoComplete="off"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
          </div>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          <Button type="submit">Confirm</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
