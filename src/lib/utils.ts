import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function daysBetween(isoA: string, isoB: string) {
  const a = Date.parse(isoA.slice(0, 10) + "T00:00:00");
  const b = Date.parse(isoB.slice(0, 10) + "T00:00:00");
  return Math.round((b - a) / 86_400_000);
}
