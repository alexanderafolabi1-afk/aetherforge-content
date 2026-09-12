import { Flame, Plus, RefreshCw, Satellite, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { APP_NAME } from "@/lib/copy";
import { cn, todayKey } from "@/lib/utils";
import { useDeckStore } from "@/lib/store";

export function CommandBar({
  onOpenConnectors,
  onNavigateToLog,
}: {
  onOpenConnectors: () => void;
  onNavigateToLog: () => void;
}) {
  const streak = useDeckStore((s) => s.streak);
  const checkIn = useDeckStore((s) => s.checkIn);
  const automationActive = useDeckStore((s) => s.automationActive);
  const toggleAutomation = useDeckStore((s) => s.toggleAutomation);
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
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-pressed={automationActive}
                aria-label="Toggle automation status"
                onClick={toggleAutomation}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors",
                  automationActive
                    ? "border-success/40 bg-success/10 text-success"
                    : "border-border text-muted-foreground hover:bg-secondary",
                )}
              >
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    automationActive ? "animate-pulse bg-success" : "bg-muted-foreground/50",
                  )}
                  aria-hidden
                />
                <span className="hidden sm:inline">
                  {automationActive ? "Automation live" : "Automation idle"}
                </span>
                <span className="sm:hidden">{automationActive ? "Live" : "Idle"}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-64 text-center">
              {automationActive
                ? "Marked as listening. Toggle off if you pause the n8n workflow."
                : "Toggle on once your n8n webhook workflow is active. This is a manual status flag, not a live ping — the browser never talks to n8n directly."}
            </TooltipContent>
          </Tooltip>
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
              <DropdownMenuItem onSelect={onNavigateToLog}>
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
