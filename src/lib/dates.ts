/**
 * Date utilities for TheHomeFood.
 *
 * All dates are stored as UTC midnight (ISO 8601).
 * Week always starts on Monday (ISO 8601 standard).
 * "Today" is computed from the browser/server's local date string, then
 * stored/compared as UTC midnight to avoid timezone bugs.
 */

/**
 * Returns a Date representing the Monday at 00:00:00 UTC
 * for the ISO week containing the given date.
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  // day 0 = Sunday, 1 = Monday, …, 6 = Saturday
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day; // adjust to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns today as a Date at 00:00:00 UTC.
 * Uses the wall-clock date string to avoid UTC offset issues.
 */
export function getTodayUTC(): Date {
  const now = new Date();
  // Use local date components so midnight UTC ≈ local midnight
  const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return toUTCMidnight(localDateStr);
}

/**
 * Converts a YYYY-MM-DD string to a Date at 00:00:00 UTC.
 */
export function toUTCMidnight(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Formats a Date as YYYY-MM-DD using UTC components.
 */
export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Returns an array of 7 Date objects (Mon–Sun) for the week containing 'weekStart'.
 */
export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setUTCDate(d.getUTCDate() + i);
    return d;
  });
}

/**
 * Returns the next week's Monday given a weekStart Date.
 */
export function nextWeek(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setUTCDate(d.getUTCDate() + 7);
  return d;
}

/**
 * Returns the previous week's Monday given a weekStart Date.
 */
export function prevWeek(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setUTCDate(d.getUTCDate() - 7);
  return d;
}

/**
 * Format a Date for display. Uses UTC to be consistent with storage.
 * E.g. "lun 18 mar"
 */
export function formatDayShort(date: Date, locale = "es-ES"): string {
  return date.toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/**
 * Format a Date for display. E.g. "Lunes, 18 de marzo"
 */
export function formatDayLong(date: Date, locale = "es-ES"): string {
  return date.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

/**
 * Format a week range: "17–23 mar 2026"
 */
export function formatWeekRange(weekStart: Date, locale = "es-ES"): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

  const startDay = weekStart.toLocaleDateString(locale, {
    day: "numeric",
    timeZone: "UTC",
  });
  const endStr = weekEnd.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  return `${startDay}–${endStr}`;
}

/**
 * Returns true if two dates represent the same UTC calendar day.
 */
export function isSameDay(a: Date, b: Date): boolean {
  return toDateString(a) === toDateString(b);
}

/**
 * Day names for display (Mon–Sun, Spanish).
 */
export const DAY_NAMES_ES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

/**
 * Slot display names.
 */
export const SLOT_LABELS: Record<string, string> = {
  BREAKFAST: "Desayuno",
  LUNCH: "Almuerzo",
  SNACK: "Merienda",
  DINNER: "Cena",
};

export const SLOT_ORDER = ["BREAKFAST", "LUNCH", "SNACK", "DINNER"];

export const MEAL_TYPE_LABELS: Record<string, string> = {
  BREAKFAST: "Desayuno",
  LUNCH: "Almuerzo",
  SNACK: "Merienda",
  DINNER: "Cena",
};

export const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;
export type MealType = (typeof MEAL_TYPES)[number];
export type MealSlot = (typeof MEAL_TYPES)[number];
