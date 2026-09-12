import {
  LayoutDashboard,
  LogOut,
  NotebookPen,
  Radio,
  Send,
  Settings2,
  TrendingUp,
  X,
  type LucideIcon,
} from "lucide-react";
import { APP_NAME } from "@/lib/copy";
import { cn } from "@/lib/utils";

export type PageId = "overview" | "growth" | "queue" | "log" | "briefing";

const NAV_ITEMS: { id: PageId; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "growth", label: "Growth", icon: TrendingUp },
  { id: "queue", label: "Launch Queue", icon: Send },
  { id: "log", label: "Mission Log", icon: NotebookPen },
  { id: "briefing", label: "Briefing", icon: Radio },
];

function SidebarContent({
  activePage,
  onNavigate,
  onOpenConnectors,
  onLogout,
  onClose,
}: {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  onOpenConnectors: () => void;
  onLogout: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 px-4 py-4">
        <div className="min-w-0">
          <p className="font-display truncate text-sm font-semibold leading-tight">{APP_NAME}</p>
          <p className="truncate text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Command Deck
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="shrink-0 rounded-md p-2 text-muted-foreground hover:bg-secondary"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2">
        {NAV_ITEMS.map((item) => {
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-secondary text-foreground shadow-[var(--shadow-border)]"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-border/80 px-2 py-3">
        <button
          type="button"
          onClick={onOpenConnectors}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
        >
          <Settings2 className="size-4 shrink-0" />
          Connectors
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="size-4 shrink-0" />
          Logout
        </button>
      </div>
    </div>
  );
}

export function Sidebar({
  activePage,
  onNavigate,
  onOpenConnectors,
  onLogout,
  mobileOpen,
  onCloseMobile,
}: {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  onOpenConnectors: () => void;
  onLogout: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  return (
    <>
      <aside className="hidden shrink-0 border-r border-border/80 bg-background/60 lg:sticky lg:top-0 lg:block lg:h-dvh lg:w-64">
        <SidebarContent
          activePage={activePage}
          onNavigate={onNavigate}
          onOpenConnectors={onOpenConnectors}
          onLogout={onLogout}
        />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="safe-top relative z-10 h-full w-[85vw] max-w-72 border-r border-border bg-card shadow-[var(--shadow-border)]">
            <SidebarContent
              activePage={activePage}
              onNavigate={(page) => {
                onNavigate(page);
                onCloseMobile();
              }}
              onOpenConnectors={() => {
                onOpenConnectors();
                onCloseMobile();
              }}
              onLogout={onLogout}
              onClose={onCloseMobile}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
