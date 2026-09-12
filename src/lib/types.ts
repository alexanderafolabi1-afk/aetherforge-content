export type MetricKey =
  | "followers"
  | "impressions24h"
  | "impressions7d"
  | "engagement"
  | "revenueMonth"
  | "postsWeek"
  | "streak";

export type RevenueSource = "x" | "tips" | "other";

export interface Stats {
  followers: number;
  impressions24h: number;
  impressions7d: number;
  engagement: number;
  revenueX: number;
  revenueTips: number;
  revenueOther: number;
  postsWeek: number;
  sparkline: number[];
}

export interface Milestone {
  id: string;
  title: string;
  blurb: string;
  metric: MetricKey;
  target: number;
  hitAt: string | null;
  winLine: string;
}

export interface RevenueLog {
  id: string;
  source: RevenueSource;
  amount: number;
  note: string;
  at: string;
}

export interface Note {
  id: string;
  body: string;
  at: string;
}

export interface Post {
  id: string;
  title: string;
  vertical: string;
  impressions: number;
  engagement: number;
  revenue: number;
  postedAt: string;
}

export interface Vertical {
  id: string;
  name: string;
  callsign: string;
  planet: string;
  exploration: number;
  posts: number;
  brief: string;
}

export type QueuedPostStatus = "queued" | "posted" | "skipped";

export interface ScheduledPost {
  id: string;
  title: string;
  body: string;
  vertical: string;
  /** ISO timestamp the automation layer should publish this at. */
  scheduledFor: string;
  status: QueuedPostStatus;
  createdAt: string;
}

export interface StreakState {
  count: number;
  lastCheckIn: string | null;
  todayMessage: string | null;
  todayKey: string | null;
}

export interface DeckData {
  commanderName: string;
  stats: Stats;
  milestones: Milestone[];
  revenueLogs: RevenueLog[];
  notes: Note[];
  posts: Post[];
  verticals: Vertical[];
  streak: StreakState;
  contentQueue: ScheduledPost[];
}

export type AstronautMood = "idle" | "steady" | "thriving" | "blazing";
