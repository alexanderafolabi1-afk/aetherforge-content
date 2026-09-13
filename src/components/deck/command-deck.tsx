import { useCallback, useEffect, useRef, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CelebrationOverlay } from "./celebration";
import { CommandBar } from "./command-bar";
import { ConnectorsDialog } from "./connectors";
import { ContentQueuePanel } from "./content-queue";
import { ExecutiveBriefing } from "./executive-briefing";
import { GalaxyMap } from "./galaxy-map";
import { Hero } from "./hero";
import { LogPanel } from "./log-panel";
import { MilestonesPanel } from "./milestones";
import { OrbitVisual } from "./orbit";
import { PinConfirmDialog } from "./pin-confirm-dialog";
import { Sidebar, type PageId } from "./sidebar";
import { Starfield } from "./starfield";
import { StatsGrid } from "./stats-grid";
import { TopPosts } from "./top-posts";
import { UpcomingPostCard } from "./upcoming-post";
import { formatRelative } from "@/lib/format";
import { useDeckStore } from "@/lib/store";

export function CommandDeck({ onLogout }: { onLogout: () => void }) {
  const [connectors, setConnectors] = useState(false);
  const [activePage, setActivePage] = useState<PageId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const celebration = useDeckStore((s) => s.celebration);
  const dismiss = useDeckStore((s) => s.dismissCelebration);
  const liveMetricsUpdatedAt = useDeckStore((s) => s.liveMetricsUpdatedAt);

  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinActionLabel, setPinActionLabel] = useState("");
  const pinResolverRef = useRef<((ok: boolean) => void) | null>(null);

  const requestPinConfirm = useCallback((actionLabel: string): Promise<boolean> => {
    // Fail closed rather than orphaning a pending confirmation if two
    // restricted actions are triggered before the first one resolves.
    if (pinResolverRef.current) return Promise.resolve(false);
    return new Promise((resolve) => {
      pinResolverRef.current = resolve;
      setPinActionLabel(actionLabel);
      setPinDialogOpen(true);
    });
  }, []);

  const handlePinResult = (ok: boolean) => {
    setPinDialogOpen(false);
    pinResolverRef.current?.(ok);
    pinResolverRef.current = null;
  };

  useEffect(() => {
    void Promise.resolve(useDeckStore.persist.rehydrate()).then(async () => {
      // Pull the real queue down before anything can push a stale local
      // copy back up — must finish before markHydrated lets the rest of the
      // app (including the Launch Queue's auto-sync effect) render.
      await useDeckStore.getState().pullQueueFromGithub();
      useDeckStore.getState().markHydrated();
      void useDeckStore.getState().syncLiveData();
    });
  }, []);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="safe-bottom relative flex min-h-dvh w-full overflow-x-hidden bg-background">
        <div className="pointer-events-none fixed inset-0 opacity-80">
          <Starfield />
        </div>

        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
          onOpenConnectors={() => setConnectors(true)}
          onLogout={onLogout}
          mobileOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
        />

        <div className="relative z-10 flex min-w-0 flex-1 flex-col">
          <CommandBar onToggleSidebar={() => setSidebarOpen(true)} />
          <main className="safe-px mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-4 py-4 pb-16 sm:py-6">
            {activePage === "overview" ? (
              <>
                <Hero celebrating={Boolean(celebration)} />
                <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">
                  {liveMetricsUpdatedAt
                    ? `Live from X via n8n · synced ${formatRelative(liveMetricsUpdatedAt)}.`
                    : "Awaiting first live sync from n8n — see AUTOMATION_GUIDE.md to wire it up."}{" "}
                  Revenue and notes still get hand-logged in Mission Log (X has no API for those).
                </p>
                <UpcomingPostCard />
                <StatsGrid />
              </>
            ) : null}

            {activePage === "growth" ? (
              <>
                <div className="grid gap-4 lg:grid-cols-2">
                  <OrbitVisual />
                  <MilestonesPanel />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <GalaxyMap />
                  <TopPosts />
                </div>
              </>
            ) : null}

            {activePage === "queue" ? (
              <ContentQueuePanel requestPinConfirm={requestPinConfirm} />
            ) : null}

            {activePage === "log" ? <LogPanel requestPinConfirm={requestPinConfirm} /> : null}

            {activePage === "briefing" ? <ExecutiveBriefing /> : null}
          </main>
        </div>

        <ConnectorsDialog
          open={connectors}
          onOpenChange={setConnectors}
          requestPinConfirm={requestPinConfirm}
        />
        <PinConfirmDialog open={pinDialogOpen} actionLabel={pinActionLabel} onResult={handlePinResult} />
        {celebration ? (
          <CelebrationOverlay event={celebration} onDismiss={dismiss} />
        ) : null}
        <Toaster position="bottom-center" />
      </div>
    </TooltipProvider>
  );
}
