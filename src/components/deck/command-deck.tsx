import { useEffect, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Starfield } from "./starfield";
import { StatsGrid } from "./stats-grid";
import { TopPosts } from "./top-posts";
import { UpcomingPostCard } from "./upcoming-post";
import { CONNECTOR_BRIEF } from "@/lib/copy";
import { useDeckStore } from "@/lib/store";

export function CommandDeck() {
  const [connectors, setConnectors] = useState(false);
  const [activeTab, setActiveTab] = useState<"deck" | "briefing">("deck");
  const pendingLogScroll = useRef(false);
  const celebration = useDeckStore((s) => s.celebration);
  const dismiss = useDeckStore((s) => s.dismissCelebration);

  useEffect(() => {
    void Promise.resolve(useDeckStore.persist.rehydrate()).then(() => {
      useDeckStore.getState().markHydrated();
    });
  }, []);

  useEffect(() => {
    if (activeTab === "deck" && pendingLogScroll.current) {
      pendingLogScroll.current = false;
      document.getElementById("log-panel")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeTab]);

  const goToLogPanel = () => {
    if (activeTab === "deck") {
      document.getElementById("log-panel")?.scrollIntoView({ behavior: "smooth" });
    } else {
      pendingLogScroll.current = true;
      setActiveTab("deck");
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="safe-bottom relative min-h-dvh w-full overflow-x-hidden bg-background">
        <div className="pointer-events-none fixed inset-0 opacity-80">
          <Starfield />
        </div>
        <div className="relative z-10">
          <CommandBar onOpenConnectors={() => setConnectors(true)} onNavigateToLog={goToLogPanel} />
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "deck" | "briefing")}>
            <div className="safe-px mx-auto w-full max-w-6xl pt-4">
              <TabsList className="max-w-xs">
                <TabsTrigger value="deck">Deck</TabsTrigger>
                <TabsTrigger value="briefing">Briefing</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="deck" className="mt-0">
              <main className="safe-px mx-auto flex w-full max-w-6xl flex-col gap-4 py-4 pb-16 sm:py-6">
                <Hero celebrating={Boolean(celebration)} />
                <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">
                  {CONNECTOR_BRIEF.headline}. Log real hauls below, or open Connectors when you are ready to dock live APIs.
                </p>
                <UpcomingPostCard />
                <StatsGrid />
                <div className="grid gap-4 lg:grid-cols-2">
                  <OrbitVisual />
                  <MilestonesPanel />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <GalaxyMap />
                  <TopPosts />
                </div>
                <ContentQueuePanel />
                <LogPanel />
              </main>
            </TabsContent>
            <TabsContent value="briefing" className="mt-0">
              <main className="safe-px mx-auto flex w-full max-w-6xl flex-col gap-4 py-4 pb-16 sm:py-6">
                <ExecutiveBriefing />
              </main>
            </TabsContent>
          </Tabs>
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
