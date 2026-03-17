import { DayOfWeek } from "@prisma/client";
import { addDays, format, isSameDay, parseISO, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { dayOfWeekOrder } from "@/lib/constants/meal";

export function getWeekStart(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  start.setHours(0, 0, 0, 0);
  return start;
}

export function parseWeekStartParam(value?: string | null) {
  if (!value) {
    return getWeekStart(new Date());
  }

  const parsed = parseISO(value);
  if (Number.isNaN(parsed.getTime())) {
    return getWeekStart(new Date());
  }

  return getWeekStart(parsed);
}

export function formatWeekLabel(weekStartDate: Date) {
  const weekEndDate = addDays(weekStartDate, 6);
  return `${format(weekStartDate, "d MMM", { locale: es })} - ${format(weekEndDate, "d MMM yyyy", { locale: es })}`;
}

export function formatLongDate(date: Date) {
  return format(date, "EEEE, d MMMM yyyy", { locale: es });
}

export function getDayDateFromWeek(dayOfWeek: DayOfWeek, weekStartDate: Date) {
  const dayIndex = dayOfWeekOrder.indexOf(dayOfWeek);
  return addDays(weekStartDate, dayIndex);
}

export function getCurrentDayOfWeek(date = new Date()): DayOfWeek {
  const mondayBasedIndex = (date.getDay() + 6) % 7;
  return dayOfWeekOrder[mondayBasedIndex];
}

export function isTodayInWeek(dayOfWeek: DayOfWeek, weekStartDate: Date) {
  return isSameDay(getDayDateFromWeek(dayOfWeek, weekStartDate), new Date());
}

export function toDateInputValue(date: Date) {
  return format(date, "yyyy-MM-dd");
}
