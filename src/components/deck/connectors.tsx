import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CONNECTORS } from "@/lib/connectors";
import { CONNECTOR_BRIEF } from "@/lib/copy";
import { useDeckStore } from "@/lib/store";

export function ConnectorsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const resetDemo = useDeckStore((s) => s.resetDemo);

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
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {c.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{c.hook}</p>
            </li>
          ))}
        </ul>
        <div className="rounded-xl border border-border p-3 text-xs leading-relaxed text-muted-foreground">
          Data lives in this browser. To go live later: create an X developer app, map
          public_metrics into Telemetry, and keep secrets on a server route — never in the
          visor. Sheets and Stripe follow the same pattern: inbound numbers, outbound
          glory.
        </div>
        <Button
          variant="outline"
          onClick={() => {
            resetDemo();
            onOpenChange(false);
          }}
        >
          Restore demo orbit
        </Button>
      </DialogContent>
    </Dialog>
  );
}
