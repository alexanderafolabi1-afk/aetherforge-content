import type { DeckData, MetricKey, Milestone, ScheduledPost } from "./types";

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(14 - (n % 5), 20, 0, 0);
  return d.toISOString();
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

export const METRIC_LABEL: Record<MetricKey, string> = {
  followers: "Followers",
  impressions24h: "24h impressions",
  impressions7d: "7d impressions",
  engagement: "Engagement rate",
  revenueMonth: "Monthly revenue",
  postsWeek: "Posts this week",
  streak: "Check-in streak",
};

export const seedMilestones: Milestone[] = [
  {
    id: "ms-10k",
    title: "10K event horizon",
    blurb: "Ten thousand souls in the wake. Gravity well established.",
    metric: "followers",
    target: 10_000,
    hitAt: daysAgo(40),
    winLine: "First gravity well. They can see the deck from here.",
  },
  {
    id: "ms-50k",
    title: "50K constellation",
    blurb: "A private constellation of people who chose you on purpose.",
    metric: "followers",
    target: 50_000,
    hitAt: null,
    winLine: "Fifty thousand. That's not a crowd. That's a nation-state of taste.",
  },
  {
    id: "ms-100k-day",
    title: "Hundred-thousand day",
    blurb: "A single rotation with six figures of eyes. Unholy. Delicious.",
    metric: "impressions24h",
    target: 100_000,
    hitAt: daysAgo(2),
    winLine: "The day-side of Earth just subscribed to the bit.",
  },
  {
    id: "ms-1m-week",
    title: "Million-week burn",
    blurb: "Seven days. A million impressions. Leave the atmosphere.",
    metric: "impressions7d",
    target: 1_000_000,
    hitAt: null,
    winLine: "A million looks in a week. The void filed a noise complaint.",
  },
  {
    id: "ms-8eng",
    title: "Eight-percent weather",
    blurb: "Engagement that has its own pressure system.",
    metric: "engagement",
    target: 8,
    hitAt: null,
    winLine: "Eight percent. That's not a rate. That's a climate.",
  },
  {
    id: "ms-1k-month",
    title: "First thousand-dollar moon",
    blurb: "The treasury finally has a moon of its own.",
    metric: "revenueMonth",
    target: 1_000,
    hitAt: daysAgo(18),
    winLine: "Payday has a zip code now. It's in orbit.",
  },
  {
    id: "ms-5k-month",
    title: "Five-grand apogee",
    blurb: "A month that pays like a job you can't be fired from.",
    metric: "revenueMonth",
    target: 5_000,
    hitAt: null,
    winLine: "Five thousand in a cycle. The rent just became folklore.",
  },
  {
    id: "ms-14streak",
    title: "Fortnight of fire",
    blurb: "Fourteen consecutive docks. Ritual is a superpower.",
    metric: "streak",
    target: 14,
    hitAt: null,
    winLine: "Two weeks without a miss. That's how dynasties start: on a Tuesday.",
  },
  {
    id: "ms-30streak",
    title: "Thirty-day halo",
    blurb: "A full lunar cycle of showing up. Mythic. Slightly unhinged.",
    metric: "streak",
    target: 30,
    hitAt: null,
    winLine: "Thirty days. The moon is jealous of your calendar.",
  },
  {
    id: "ms-12posts",
    title: "Dozen launches",
    blurb: "Twelve transmissions this week. The feed is a launchpad.",
    metric: "postsWeek",
    target: 12,
    hitAt: null,
    winLine: "A dozen ships left the bay. One of them will own the sky.",
  },
];

export const seedContentQueue: ScheduledPost[] = [
  {
    id: "queue-1",
    title: "The algorithm rewards frequency. Here's a 4-post cadence that doesn't burn out.",
    body: "Thread breaking down the posting rhythm that got the last **30 days** moving. Full breakdown in the [linked thread](https://x.com).",
    vertical: "Threads",
    language: "en",
    scheduledFor: daysFromNow(1),
    status: "queued",
    createdAt: new Date().toISOString(),
  },
  {
    id: "queue-2",
    title: "Detrás del visor: así se ve un post de las 2am antes de publicarse.",
    body: "Imagen fija + leyenda corta. Deja que la *imagen* aterrice primero, la leyenda va en la respuesta.",
    vertical: "Visuals",
    language: "es",
    scheduledFor: daysFromNow(2),
    status: "queued",
    createdAt: new Date().toISOString(),
  },
  {
    id: "queue-3",
    title: "長編：あなたのコンテンツは悪くない、軌道が違うだけだ。",
    body: "今週最も反応が良かったスレッドを**エッセイ形式**に拡張したもの。",
    vertical: "Longform",
    language: "ja",
    scheduledFor: daysFromNow(3),
    status: "queued",
    createdAt: new Date().toISOString(),
  },
  {
    id: "queue-4",
    title: "Colaboração com um viajante: dois poços de gravidade, uma trajetória.",
    body: "Cross-post coordenado para lançamento *simultâneo* às 9h em ambas as contas.",
    vertical: "Collabs",
    language: "pt",
    scheduledFor: daysFromNow(4),
    status: "queued",
    createdAt: new Date().toISOString(),
  },
];

export const seedDeck: DeckData = {
  commanderName: "Commander",
  stats: {
    followers: 47_832,
    impressions24h: 128_440,
    impressions7d: 891_200,
    engagement: 6.8,
    revenueX: 1_840,
    revenueTips: 1_620,
    revenueOther: 820,
    postsWeek: 11,
    sparkline: [
      42_000, 51_200, 48_800, 62_400, 71_100, 68_900, 88_200, 79_400, 94_600,
      102_800, 97_200, 118_400, 121_000, 128_440,
    ],
  },
  milestones: seedMilestones,
  revenueLogs: [
    {
      id: "rev-1",
      source: "x",
      amount: 420,
      note: "Ad rev spike off the slingshot thread.",
      at: daysAgo(1),
    },
    {
      id: "rev-2",
      source: "tips",
      amount: 180,
      note: "A stranger tipped like they meant it.",
      at: daysAgo(3),
    },
    {
      id: "rev-3",
      source: "other",
      amount: 750,
      note: "Brand orbit — one-off collab, no soul sold.",
      at: daysAgo(6),
    },
  ],
  notes: [
    {
      id: "note-1",
      body: "The 2am post outperformed the 'safe' noon slot. Night-side audience is the real one. Stop negotiating with daytime.",
      at: daysAgo(1),
    },
    {
      id: "note-2",
      body: "Visuals planet is under-explored. Next week: three stills, no captions until the third. Let the image do the docking.",
      at: daysAgo(4),
    },
  ],
  posts: [
    {
      id: "p1",
      title: "The algorithm is a gravity well. Here's the slingshot.",
      vertical: "Threads",
      impressions: 184_200,
      engagement: 8.4,
      revenue: 312,
      postedAt: daysAgo(2),
    },
    {
      id: "p2",
      title: "I posted this at 2am. The night side of Earth said thank you.",
      vertical: "Visuals",
      impressions: 156_800,
      engagement: 9.1,
      revenue: 188,
      postedAt: daysAgo(3),
    },
    {
      id: "p3",
      title: "Unpopular: your content isn't bad. It's in the wrong orbit.",
      vertical: "Longform",
      impressions: 121_400,
      engagement: 7.2,
      revenue: 96,
      postedAt: daysAgo(4),
    },
    {
      id: "p4",
      title: "A 47-second clip that paid a week of rent.",
      vertical: "Livestreams",
      impressions: 98_600,
      engagement: 11.4,
      revenue: 640,
      postedAt: daysAgo(5),
    },
    {
      id: "p5",
      title: "Collab with a moon. Metaphorically. Mostly.",
      vertical: "Collabs",
      impressions: 74_200,
      engagement: 6.1,
      revenue: 210,
      postedAt: daysAgo(6),
    },
  ],
  verticals: [
    {
      id: "threads",
      name: "Threads",
      callsign: "Helix",
      planet: "/brand/planet-threads.jpg",
      exploration: 74,
      posts: 18,
      brief: "Short burns. High spin. The slingshot lane.",
    },
    {
      id: "visuals",
      name: "Visuals",
      callsign: "Solaris",
      planet: "/brand/planet-visuals.jpg",
      exploration: 58,
      posts: 9,
      brief: "Stills that stop a thumb mid-orbit.",
    },
    {
      id: "longform",
      name: "Longform",
      callsign: "Nebula",
      planet: "/brand/planet-longform.jpg",
      exploration: 41,
      posts: 4,
      brief: "Deep-field essays. Slow, then sudden.",
    },
    {
      id: "collabs",
      name: "Collabs",
      callsign: "Twin Suns",
      planet: "/brand/planet-collabs.jpg",
      exploration: 33,
      posts: 3,
      brief: "Two gravity wells, one trajectory.",
    },
    {
      id: "live",
      name: "Livestreams",
      callsign: "Forge",
      planet: "/brand/planet-live.jpg",
      exploration: 22,
      posts: 2,
      brief: "Heat, voice, no take-backs. The furnace.",
    },
    {
      id: "labs",
      name: "Experiments",
      callsign: "Drift",
      planet: "/brand/planet-labs.jpg",
      exploration: 61,
      posts: 7,
      brief: "Unmapped. On purpose. That's the point.",
    },
  ],
  streak: {
    count: 13,
    lastCheckIn: yesterdayKey(),
    todayMessage: null,
    todayKey: null,
  },
  contentQueue: seedContentQueue,
};
