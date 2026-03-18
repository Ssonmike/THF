import { describe, it, expect } from "vitest";
import {
  getWeekStart,
  toUTCMidnight,
  toDateString,
  getWeekDays,
  nextWeek,
  prevWeek,
  isSameDay,
  formatWeekRange,
} from "@/lib/dates";

describe("getWeekStart", () => {
  it("returns Monday for a Monday", () => {
    const monday = new Date("2026-03-16T00:00:00Z"); // Monday
    expect(toDateString(getWeekStart(monday))).toBe("2026-03-16");
  });

  it("returns Monday for a Wednesday", () => {
    const wednesday = new Date("2026-03-18T00:00:00Z"); // Wednesday
    expect(toDateString(getWeekStart(wednesday))).toBe("2026-03-16");
  });

  it("returns Monday for a Sunday", () => {
    const sunday = new Date("2026-03-22T00:00:00Z"); // Sunday
    expect(toDateString(getWeekStart(sunday))).toBe("2026-03-16");
  });

  it("returns Monday for a Saturday", () => {
    const saturday = new Date("2026-03-21T00:00:00Z");
    expect(toDateString(getWeekStart(saturday))).toBe("2026-03-16");
  });

  it("handles week boundary correctly — previous Monday", () => {
    const sunday = new Date("2026-03-15T00:00:00Z"); // Sunday (prev week)
    expect(toDateString(getWeekStart(sunday))).toBe("2026-03-09");
  });
});

describe("toUTCMidnight", () => {
  it("converts date string to UTC midnight", () => {
    const d = toUTCMidnight("2026-03-18");
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(2); // March = 2
    expect(d.getUTCDate()).toBe(18);
    expect(d.getUTCHours()).toBe(0);
    expect(d.getUTCMinutes()).toBe(0);
    expect(d.getUTCSeconds()).toBe(0);
  });
});

describe("toDateString", () => {
  it("formats date as YYYY-MM-DD", () => {
    expect(toDateString(new Date("2026-01-05T00:00:00Z"))).toBe("2026-01-05");
    expect(toDateString(new Date("2026-12-31T00:00:00Z"))).toBe("2026-12-31");
  });
});

describe("getWeekDays", () => {
  it("returns 7 days starting from Monday", () => {
    const monday = new Date("2026-03-16T00:00:00Z");
    const days = getWeekDays(monday);
    expect(days).toHaveLength(7);
    expect(toDateString(days[0])).toBe("2026-03-16"); // Mon
    expect(toDateString(days[6])).toBe("2026-03-22"); // Sun
  });

  it("days are consecutive", () => {
    const monday = new Date("2026-03-16T00:00:00Z");
    const days = getWeekDays(monday);
    for (let i = 1; i < 7; i++) {
      const diff = days[i].getTime() - days[i - 1].getTime();
      expect(diff).toBe(86400 * 1000); // exactly 1 day
    }
  });
});

describe("nextWeek / prevWeek", () => {
  it("nextWeek adds 7 days", () => {
    const monday = new Date("2026-03-16T00:00:00Z");
    expect(toDateString(nextWeek(monday))).toBe("2026-03-23");
  });

  it("prevWeek subtracts 7 days", () => {
    const monday = new Date("2026-03-16T00:00:00Z");
    expect(toDateString(prevWeek(monday))).toBe("2026-03-09");
  });
});

describe("isSameDay", () => {
  it("returns true for same UTC day", () => {
    const a = new Date("2026-03-18T10:00:00Z");
    const b = new Date("2026-03-18T22:00:00Z");
    expect(isSameDay(a, b)).toBe(true);
  });

  it("returns false for different days", () => {
    const a = new Date("2026-03-18T00:00:00Z");
    const b = new Date("2026-03-19T00:00:00Z");
    expect(isSameDay(a, b)).toBe(false);
  });
});

describe("formatWeekRange", () => {
  it("formats a week range", () => {
    const monday = new Date("2026-03-16T00:00:00Z");
    const result = formatWeekRange(monday);
    // Should contain the start day and end info
    expect(result).toContain("16");
    expect(result).toContain("22");
  });
});
