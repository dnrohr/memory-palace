import { describe, expect, it } from "vitest";
import { ageToDateRange, formatLifeCalendarPreview, gradeToDateRange } from "../src/core/lifeCalendar";

describe("life calendar", () => {
  it("maps age to a broad year when only birth year is known", () => {
    expect(ageToDateRange(8, { birthYear: 1985 })).toEqual(
      expect.objectContaining({
        startDate: "1993-01-01",
        endDate: "1993-12-31"
      })
    );
  });

  it("maps age to a birthday-to-birthday range when full birthday is known", () => {
    expect(ageToDateRange(8, { birthYear: 1985, birthMonth: 3, birthDay: 12 })).toEqual(
      expect.objectContaining({
        startDate: "1993-03-12",
        endDate: "1994-03-11"
      })
    );
  });

  it("maps grade to a configurable school-year range", () => {
    expect(gradeToDateRange(3, { birthYear: 1985, schoolYearStartMonth: 9, kindergartenStartAge: 6 })).toEqual(
      expect.objectContaining({
        startDate: "1994-09-01",
        endDate: "1995-07-31",
        explanation: expect.stringContaining("September")
      })
    );
  });

  it("explains that a birth year is required before previewing conversions", () => {
    expect(formatLifeCalendarPreview()).toContain("birth year");
  });
});
