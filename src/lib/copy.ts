import type { AstronautMood } from "./types";

export const APP_NAME = "AetherForge Command Deck";
export const APP_CALLSIGN = "Cosmic Eagle Observatory";

export const CHECK_IN_LINES = [
  "That's one small tap for you, one giant leap for the feed.",
  "Orbit locked. Houston, we have consistency.",
  "Fuel cells recharged. The galaxy noticed — try not to look surprised.",
  "Commander, your influence is achieving escape velocity.",
  "Streak intact. Gravity filed a complaint. We ignored it.",
  "Night-side burn complete. The algorithm never sleeps. Cute that it thinks you do.",
  "Telemetry green. You didn't just show up — you docked.",
  "Another cycle survived. Empires are built from boring, brilliant mornings like this.",
  "Check-in confirmed. The void remains undefeated. You, however, are on a heater.",
  "You've gone supernova on the calendar. Don't blink. Don't skip tomorrow.",
  "Attitude control: immaculate. The stars are taking notes.",
  "Docking clamp engaged. Legacy doesn't clock out, and neither did you.",
];

export const GREETINGS = {
  dawn: "Dawn watch is yours, Commander.",
  day: "Day-side burn. Make it expensive for the void.",
  dusk: "Dusk over the deck. The night shift of legends starts now.",
  night: "Night side. The universe is loud. Be louder.",
};

export const MOOD_STATUS: Record<AstronautMood, string> = {
  idle: "Pilot floating. Pulse is calm. The deck wants a signal.",
  steady: "Suit systems nominal. Trajectory is a choice — you already made it.",
  thriving: "Visor glowing. Engagement has a weather system and it's a storm.",
  blazing: "Jetpack at full burn. You are not trending. You are transiting.",
};

export const MILESTONE_HITS = [
  "Supernova. Try not to look directly at your own numbers.",
  "That's not a metric. That's a monument.",
  "The observatory just lost its mind. In a good way.",
  "Escape velocity confirmed. Please keep your arms inside the legend.",
  "We told the void you were coming. It did not prepare.",
];

export function greetingForHour(hour: number) {
  if (hour < 5) return GREETINGS.night;
  if (hour < 12) return GREETINGS.dawn;
  if (hour < 17) return GREETINGS.day;
  if (hour < 21) return GREETINGS.dusk;
  return GREETINGS.night;
}

export function pickLine(lines: readonly string[], salt = 0) {
  const i = Math.abs(salt + Date.now()) % lines.length;
  return lines[i] ?? lines[0] ?? "";
}

export function pickDailyLine(key: string, lines: readonly string[]) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return lines[h % lines.length] ?? lines[0] ?? "";
}

export const CONNECTOR_BRIEF = {
  headline: "Live telemetry from X, via n8n",
  body: "Followers, impressions, engagement, and top posts sync in read-only from data/live-metrics.json — n8n writes it, this deck just displays it. Revenue and notes stay hand-logged (X has no API for those). See AUTOMATION_GUIDE.md for the n8n side.",
};
