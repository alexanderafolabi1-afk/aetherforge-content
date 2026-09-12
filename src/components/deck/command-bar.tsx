import { Flame, Plus, RefreshCw, Satellite, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { APP_NAME } from "@/lib/copy";
import { todayKey } from "@/lib/utils";
import { useDeckStore } from "@/lib/store";

export function CommandBar({
  onOpenConnectors,
}: {
  onOpenConnectors: () => void;
}) {
  const streak = useDeckStore((s) => s.streak);
  const checkIn = useDeckStore((s) => s.checkIn);
  const checked = streak.todayKey === todayKey();

  return (
    <header className="safe-top sticky top-0 z-40 border-b border-border/80 bg-background/75 backdrop-blur-md">
      <div className="safe-px mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-primary shadow-[var(--shadow-border)]">
            <Satellite className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="font-display truncate text-sm font-semibold leading-tight">{APP_NAME}</p>
            <p className="truncate text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Command Deck
            </p>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <Button
            size="icon"
            variant="outline"
            aria-label="Refresh"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="size-4" />
          </Button>
          <Badge variant={checked ? "gold" : "primary"} className="h-8 gap-1 px-2 sm:px-2.5">
            <Flame className="size-3" />
            <span className="tabular-nums normal-case tracking-normal">
              <span className="sm:hidden">{streak.count}d</span>
              <span className="hidden sm:inline">{streak.count}-day streak</span>
            </span>
          </Badge>
          <Button
            size="sm"
            variant={checked ? "secondary" : "default"}
            onClick={() => {
              checkIn();
            }}
          >
            {checked ? "Orbit locked" : "Daily check-in"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline" aria-label="Quick log">
                <Plus className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => document.getElementById("log-panel")?.scrollIntoView({ behavior: "smooth" })}
              >
                Log a haul / note
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onOpenConnectors}>
                <Settings2 className="size-4" />
                Connectors
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
