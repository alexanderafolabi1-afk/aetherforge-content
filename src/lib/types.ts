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

export type PostLanguage = "en" | "es" | "pt" | "ja" | "fr";

export const POST_LANGUAGE_LABEL: Record<PostLanguage, string> = {
  en: "English",
  es: "Español",
  pt: "Português",
  ja: "日本語",
  fr: "Français",
};

export interface ScheduledPost {
  id: string;
  title: string;
  body: string;
  vertical: string;
  language: PostLanguage;
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

/** Written by the n8n metrics-sync flow to data/live-metrics.json — see AUTOMATION_GUIDE.md. */
export interface LiveMetricsFile {
  updatedAt: string;
  stats: Stats;
  posts: Post[];
}

/** One autonomous auto-reply, written by n8n to data/x-automation-state.json. */
export interface ReplyLogEntry {
  mentionId: string;
  mentionAuthor: string;
  mentionText: string;
  replyText: string;
  replyTweetId: string;
  repliedAt: string;
}

/** Full shape of data/x-automation-state.json — sinceMentionId is n8n's own pagination cursor, ignored by the PWA. */
export interface XAutomationStateFile {
  sinceMentionId: string | null;
  replyLog: ReplyLogEntry[];
}

/**
 * One curated-account tweet worth considering a reply to — written by n8n's
 * Flow D scan to data/reply-candidates.json. Deliberately not auto-replied:
 * see AUTOMATION_GUIDE.md for why. The PWA only ever displays these.
 */
export interface ReplyCandidate {
  accountUsername: string;
  tweetId: string;
  text: string;
  createdAt: string;
  url: string;
  discoveredAt: string;
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
