import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { CONNECTORS } from "@/lib/connectors";
import { CONNECTOR_BRIEF } from "@/lib/copy";
import {
  clearGithubSyncConfig,
  getGithubSyncConfig,
  hasGithubSyncConfig,
  saveGithubSyncConfig,
  verifyGithubSyncConnection,
  type VerifyResult,
} from "@/lib/github-sync";
import { clearPin } from "@/lib/pin";
import { useDeckStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ConnectorsDialog({
  open,
  onOpenChange,
  requestPinConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestPinConfirm: (actionLabel: string) => Promise<boolean>;
}) {
  const resetDemo = useDeckStore((s) => s.resetDemo);
  const [pinResetConfirming, setPinResetConfirming] = useState(false);

  const [ghOwner, setGhOwner] = useState("");
  const [ghRepo, setGhRepo] = useState("");
  const [ghBranch, setGhBranch] = useState("main");
  const [ghPath, setGhPath] = useState("data/content-queue.json");
  const [ghToken, setGhToken] = useState("");
  const [ghConfigured, setGhConfigured] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);

  useEffect(() => {
    if (!open) return;
    const existing = getGithubSyncConfig();
    setGhOwner(existing?.owner ?? "");
    setGhRepo(existing?.repo ?? "");
    setGhBranch(existing?.branch ?? "main");
    setGhPath(existing?.path ?? "data/content-queue.json");
    setGhToken("");
    setGhConfigured(hasGithubSyncConfig());
    setVerifyResult(null);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connectors</DialogTitle>
          <DialogDescription>{CONNECTOR_BRIEF.body}</DialogDescription>
        </DialogHeader>
        <ul className="space-y-2">
          {CONNECTORS.map((c) => (
            <li key={c.id} className="rounded-xl bg-secondary/50 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{c.name}</p>
                <span
                  className={cn(
                    "text-[11px] uppercase tracking-wider",
                    c.status === "live" ? "text-success" : "text-muted-foreground",
                  )}
                >
                  {c.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{c.hook}</p>
            </li>
          ))}
        </ul>
        <div className="rounded-xl border border-border p-3 text-xs leading-relaxed text-muted-foreground">
          Stats/hauls/notes live in this browser only. To go live later: create an X developer
          app, map public_metrics into Telemetry, and keep those secrets on a server route —
          never in the visor. Sheets and Stripe follow the same pattern. GitHub Sync below is the
          one deliberate exception to "no secrets in the frontend" — read its warning before
          using it.
        </div>

        <div className="rounded-xl border border-border p-3">
          <p className="text-sm font-medium">GitHub Sync</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Commits the Launch queue straight to{" "}
            <code className="rounded bg-black/30 px-1 py-0.5">{ghPath || "data/content-queue.json"}</code>{" "}
            in this repo — no more downloading a file and re-uploading it by hand. Once set up,
            every queue change auto-syncs a few seconds later.
          </p>
          <div className="mt-2 rounded-lg border border-accent/30 bg-accent/5 p-2 text-[11px] leading-relaxed text-muted-foreground">
            Use a <strong>fine-grained</strong> personal access token scoped to{" "}
            <strong>only this repository</strong>, with <strong>Contents: Read and write</strong> and
            nothing else. Never a classic token or one with account-wide access — it's stored in
            this browser and readable by anyone with access to this device or its devtools.
          </div>
          <div className="mt-3 grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <Label htmlFor="gh-owner" className="text-xs">
                  Owner
                </Label>
                <Input
                  id="gh-owner"
                  value={ghOwner}
                  onChange={(e) => setGhOwner(e.target.value)}
                  placeholder="alexanderafolabi1-afk"
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="gh-repo" className="text-xs">
                  Repo
                </Label>
                <Input
                  id="gh-repo"
                  value={ghRepo}
                  onChange={(e) => setGhRepo(e.target.value)}
                  placeholder="aetherforge-content"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <Label htmlFor="gh-branch" className="text-xs">
                  Branch
                </Label>
                <Input id="gh-branch" value={ghBranch} onChange={(e) => setGhBranch(e.target.value)} />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="gh-path" className="text-xs">
                  Path
                </Label>
                <Input id="gh-path" value={ghPath} onChange={(e) => setGhPath(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="gh-token" className="text-xs">
                Token
              </Label>
              <Input
                id="gh-token"
                type="password"
                autoComplete="off"
                value={ghToken}
                onChange={(e) => setGhToken(e.target.value)}
                placeholder={ghConfigured ? "Saved — enter a new one to replace it" : "github_pat_..."}
              />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={async () => {
                if (!ghOwner.trim() || !ghRepo.trim() || (!ghToken.trim() && !ghConfigured)) {
                  toast("Owner, repo, and a token are required.");
                  return;
                }
                const ok = await requestPinConfirm("save the GitHub Sync token");
                if (!ok) return;
                const existing = getGithubSyncConfig();
                saveGithubSyncConfig({
                  owner: ghOwner.trim(),
                  repo: ghRepo.trim(),
                  branch: ghBranch.trim() || "main",
                  path: ghPath.trim() || "data/content-queue.json",
                  token: ghToken.trim() || existing?.token || "",
                });
                setGhToken("");
                setGhConfigured(true);
                toast("GitHub Sync saved.");
              }}
            >
              Save
            </Button>
            {ghConfigured ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={verifying}
                  onClick={async () => {
                    const ok = await requestPinConfirm("verify the GitHub Sync connection");
                    if (!ok) return;
                    setVerifying(true);
                    setVerifyResult(null);
                    const result = await verifyGithubSyncConnection();
                    setVerifying(false);
                    setVerifyResult(result);
                    toast(result.message);
                  }}
                >
                  {verifying ? "Verifying…" : "Verify connection"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const ok = await requestPinConfirm("clear the GitHub Sync token");
                    if (!ok) return;
                    clearGithubSyncConfig();
                    setGhConfigured(false);
                    setGhToken("");
                    setVerifyResult(null);
                    toast("GitHub Sync cleared.");
                  }}
                >
                  Clear
                </Button>
              </>
            ) : null}
          </div>
          {verifyResult ? (
            <div
              className={cn(
                "mt-2 rounded-lg border p-2 text-[11px] leading-relaxed",
                verifyResult.ok
                  ? "border-success/30 bg-success/5 text-success"
                  : "border-destructive/30 bg-destructive/5 text-destructive",
              )}
            >
              <p className="font-medium">{verifyResult.ok ? "✓ Verified" : "✕ Verification failed"}</p>
              <p className="mt-0.5 text-muted-foreground">{verifyResult.message}</p>
              <ul className="mt-1 space-y-0.5 text-muted-foreground">
                <li>Token present: {verifyResult.details.tokenPresent ? "yes" : "no"}</li>
                <li>Repo reachable: {verifyResult.details.canReadRepo ? "yes" : "no"}</li>
                <li>Queue path reachable: {verifyResult.details.canReadQueuePath ? "yes" : "no"}</li>
                <li>Write round-trip: {verifyResult.details.canWrite ? "passed" : "failed"}</li>
              </ul>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-border p-3">
          <p className="text-sm font-medium">Admin PIN</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Guards this device's deck on open, plus telemetry commits and GitHub Sync setup.
            Stored as a salted hash only — never in plaintext.
          </p>
          {pinResetConfirming ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  clearPin();
                  window.location.reload();
                }}
              >
                Confirm reset
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPinResetConfirming(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => setPinResetConfirming(true)}
            >
              Reset PIN
            </Button>
          )}
        </div>

        <Button
          variant="outline"
          onClick={() => {
            resetDemo();
            onOpenChange(false);
          }}
        >
          Clear local cache
        </Button>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Wipes hand-logged hauls/notes and any locally-overridden telemetry in this browser back
          to zero. Nothing on GitHub or X is touched — the next live sync repopulates real numbers.
        </p>
      </DialogContent>
    </Dialog>
  );
}
