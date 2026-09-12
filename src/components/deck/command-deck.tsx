import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CelebrationOverlay } from "./celebration";
import { CommandBar } from "./command-bar";
import { ConnectorsDialog } from "./connectors";
import { GalaxyMap } from "./galaxy-map";
import { Hero } from "./hero";
import { LogPanel } from "./log-panel";
import { MilestonesPanel } from "./milestones";
import { OrbitVisual } from "./orbit";
import { Starfield } from "./starfield";
import { StatsGrid } from "./stats-grid";
import { TopPosts } from "./top-posts";
import { CONNECTOR_BRIEF } from "@/lib/copy";
import { useDeckStore } from "@/lib/store";

export function CommandDeck() {
  const [connectors, setConnectors] = useState(false);
  const celebration = useDeckStore((s) => s.celebration);
  const dismiss = useDeckStore((s) => s.dismissCelebration);

  useEffect(() => {
    void Promise.resolve(useDeckStore.persist.rehydrate()).then(() => {
      useDeckStore.getState().markHydrated();
    });
  }, []);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative min-h-dvh w-full overflow-x-hidden bg-background">
        <div className="pointer-events-none fixed inset-0 opacity-80">
          <Starfield />
        </div>
        <div className="relative z-10">
          <CommandBar onOpenConnectors={() => setConnectors(true)} />
          <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 pb-16 sm:px-6 sm:py-6">
            <Hero celebrating={Boolean(celebration)} />
            <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">
              {CONNECTOR_BRIEF.headline}. Log real hauls below, or open Connectors when you are ready to dock live APIs.
            </p>
            <StatsGrid />
            <div className="grid gap-4 lg:grid-cols-2">
              <OrbitVisual />
              <MilestonesPanel />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <GalaxyMap />
              <TopPosts />
            </div>
            <LogPanel />
          </main>
        </div>
        <ConnectorsDialog open={connectors} onOpenChange={setConnectors} />
        {celebration ? (
          <CelebrationOverlay event={celebration} onDismiss={dismiss} />
        ) : null}
        <Toaster position="bottom-center" />
      </div>
    </TooltipProvider>
  );
}
