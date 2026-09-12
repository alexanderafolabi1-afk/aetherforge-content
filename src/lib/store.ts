import { create } from "zustand";
import { persist } from "zustand/middleware";
import { pickDailyLine, CHECK_IN_LINES, MILESTONE_HITS, pickLine } from "./copy";
import { seedDeck } from "./seed";
import type {
  AstronautMood,
  DeckData,
  MetricKey,
  Milestone,
  Note,
  RevenueLog,
  RevenueSource,
  Stats,
} from "./types";
import { daysBetween, todayKey, uid } from "./utils";

export interface Celebration {
  title: string;
  body: string;
  kind: "milestone" | "checkin" | "generic";
}

interface DeckStore extends DeckData {
  hydrated: boolean;
  celebration: Celebration | null;
  markHydrated: () => void;
  setCommanderName: (name: string) => void;
  patchStats: (patch: Partial<Stats>) => void;
  addRevenue: (source: RevenueSource, amount: number, note: string) => void;
  addNote: (body: string) => void;
  addMilestone: (input: Omit<Milestone, "id" | "hitAt">) => void;
  setVerticalExploration: (id: string, exploration: number) => void;
  checkIn: () => { didCheck: boolean; message: string; streak: number };
  replayMilestone: (id: string) => void;
  dismissCelebration: () => void;
  resetDemo: () => void;
}

export function monthlyRevenue(stats: Stats) {
  return stats.revenueX + stats.revenueTips + stats.revenueOther;
}

export function metricValue(data: Pick<DeckData, "stats" | "streak">, key: MetricKey) {
  switch (key) {
    case "followers":
      return data.stats.followers;
    case "impressions24h":
      return data.stats.impressions24h;
    case "impressions7d":
      return data.stats.impressions7d;
    case "engagement":
      return data.stats.engagement;
    case "revenueMonth":
      return monthlyRevenue(data.stats);
    case "postsWeek":
      return data.stats.postsWeek;
    case "streak":
      return data.streak.count;
  }
}

export function astronautMood(data: Pick<DeckData, "stats" | "streak">): AstronautMood {
  const today = todayKey();
  const checked = data.streak.todayKey === today;
  if (data.stats.engagement >= 8 || data.streak.count >= 21) return "blazing";
  if (data.stats.engagement >= 5.5 || data.streak.count >= 7) return "thriving";
  if (checked || data.streak.count >= 3) return "steady";
  return "idle";
}

function applyHits(state: DeckData, forceId?: string): { next: DeckData; hits: Milestone[] } {
  const now = new Date().toISOString();
  const hits: Milestone[] = [];
  const milestones = state.milestones.map((m) => {
    if (m.hitAt && m.id !== forceId) return m;
    const reached = metricValue(state, m.metric) >= m.target;
    if ((reached && !m.hitAt) || m.id === forceId) {
      const hit = { ...m, hitAt: m.hitAt ?? now };
      hits.push(hit);
      return hit;
    }
    return m;
  });
  return { next: { ...state, milestones }, hits };
}

export const useDeckStore = create<DeckStore>()(
  persist(
    (set, get) => ({
      ...seedDeck,
      hydrated: false,
      celebration: null,
      markHydrated: () => set({ hydrated: true }),
      setCommanderName: (commanderName) => set({ commanderName }),
      patchStats: (patch) => {
        const stats = { ...get().stats, ...patch };
        const applied = applyHits({ ...get(), stats });
        const hit = applied.hits[0];
        set({
          ...applied.next,
          stats,
          celebration: hit
            ? { title: hit.title, body: hit.winLine, kind: "milestone" }
            : get().celebration,
        });
      },
      addRevenue: (source, amount, note) => {
        if (!Number.isFinite(amount) || amount <= 0) return;
        const log: RevenueLog = {
          id: uid(),
          source,
          amount,
          note,
          at: new Date().toISOString(),
        };
        const stats = { ...get().stats };
        if (source === "x") stats.revenueX += amount;
        else if (source === "tips") stats.revenueTips += amount;
        else stats.revenueOther += amount;
        const applied = applyHits({ ...get(), stats, revenueLogs: [log, ...get().revenueLogs] });
        const hit = applied.hits[0];
        set({
          ...applied.next,
          stats,
          celebration: hit
            ? { title: hit.title, body: hit.winLine, kind: "milestone" }
            : get().celebration,
        });
      },
      addNote: (body) => {
        const trimmed = body.trim();
        if (!trimmed) return;
        const note: Note = { id: uid(), body: trimmed, at: new Date().toISOString() };
        set({ notes: [note, ...get().notes] });
      },
      addMilestone: (input) => {
        const m: Milestone = { ...input, id: uid(), hitAt: null };
        const applied = applyHits({ ...get(), milestones: [m, ...get().milestones] });
        const hit = applied.hits.find((h) => h.id === m.id);
        set({
          ...applied.next,
          celebration: hit
            ? { title: hit.title, body: hit.winLine, kind: "milestone" }
            : get().celebration,
        });
      },
      setVerticalExploration: (id, exploration) => {
        const clamped = Math.max(0, Math.min(100, Math.round(exploration)));
        set({
          verticals: get().verticals.map((v) =>
            v.id === id ? { ...v, exploration: clamped } : v,
          ),
        });
      },
      checkIn: () => {
        const today = todayKey();
        const prev = get().streak;
        if (prev.todayKey === today && prev.lastCheckIn) {
          return {
            didCheck: false,
            message: prev.todayMessage ?? "Orbit already locked for this cycle.",
            streak: prev.count,
          };
        }
        let count = 1;
        if (prev.lastCheckIn) {
          const gap = daysBetween(prev.lastCheckIn, today);
          count = gap === 1 ? prev.count + 1 : 1;
        }
        const message = pickDailyLine(`${today}:${count}`, CHECK_IN_LINES);
        const streak = {
          count,
          lastCheckIn: today,
          todayMessage: message,
          todayKey: today,
        };
        const applied = applyHits({ ...get(), streak });
        const hit = applied.hits[0];
        set({
          ...applied.next,
          streak,
          celebration: hit
            ? { title: hit.title, body: hit.winLine, kind: "milestone" }
            : {
                title: `${count}-day streak`,
                body: message,
                kind: "checkin",
              },
        });
        return { didCheck: true, message, streak: count };
      },
      replayMilestone: (id) => {
        const m = get().milestones.find((x) => x.id === id);
        if (!m) return;
        set({
          celebration: {
            title: m.title,
            body: m.hitAt ? m.winLine : pickLine(MILESTONE_HITS),
            kind: "milestone",
          },
        });
      },
      dismissCelebration: () => set({ celebration: null }),
      resetDemo: () =>
        set({
          ...seedDeck,
          hydrated: true,
          celebration: {
            title: "Telemetry reset",
            body: "Demo orbit restored. The universe is pretending with you again.",
            kind: "generic",
          },
        }),
    }),
    {
      name: "aetherforge-command-deck",
      skipHydration: true,
      partialize: (state) => ({
        commanderName: state.commanderName,
        stats: state.stats,
        milestones: state.milestones,
        revenueLogs: state.revenueLogs,
        notes: state.notes,
        posts: state.posts,
        verticals: state.verticals,
        streak: state.streak,
      }),
    },
  ),
);
