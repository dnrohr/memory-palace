import type { UserProfile } from "./types";

export const DEFAULT_SCHOOL_YEAR_START_MONTH = 8;
export const DEFAULT_KINDERGARTEN_START_AGE = 5;

export type LifeCalendarDateRange = {
  startDate: string;
  endDate: string;
  explanation: string;
};

export function hasBirthYear(profile?: UserProfile): profile is UserProfile & { birthYear: number } {
  return Number.isInteger(profile?.birthYear);
}

export function ageToDateRange(age: number, profile?: UserProfile): LifeCalendarDateRange | undefined {
  if (!hasBirthYear(profile)) return undefined;
  const year = profile.birthYear + age;

  const birthMonth = profile.birthMonth;
  const birthDay = profile.birthDay;
  if (typeof birthMonth === "number" && typeof birthDay === "number" && isValidMonthDay(birthMonth, birthDay, year)) {
    const startDate = dateString(year, birthMonth, birthDay);
    const end = new Date(Date.UTC(year + 1, birthMonth - 1, birthDay));
    end.setUTCDate(end.getUTCDate() - 1);
    return {
      startDate,
      endDate: dateFromUtc(end),
      explanation: `Mapped from age ${age} using birthday ${dateString(profile.birthYear, birthMonth, birthDay)}.`
    };
  }

  return {
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
    explanation: `Mapped from age ${age} using birth year ${profile.birthYear}. Add birth month and day for a tighter range.`
  };
}

export function gradeToDateRange(grade: number, profile?: UserProfile): LifeCalendarDateRange | undefined {
  if (!hasBirthYear(profile)) return undefined;
  const schoolYearStartMonth = validMonth(profile.schoolYearStartMonth) ?? DEFAULT_SCHOOL_YEAR_START_MONTH;
  const kindergartenStartAgeCandidate = profile.kindergartenStartAge;
  const kindergartenStartAge =
    kindergartenStartAgeCandidate !== undefined &&
    Number.isInteger(kindergartenStartAgeCandidate) &&
    kindergartenStartAgeCandidate >= 4 &&
    kindergartenStartAgeCandidate <= 7
      ? kindergartenStartAgeCandidate
      : DEFAULT_KINDERGARTEN_START_AGE;
  const schoolStartYear = profile.birthYear + kindergartenStartAge + grade;
  const endMonth = ((schoolYearStartMonth + 9) % 12) + 1;
  const endYear = endMonth < schoolYearStartMonth ? schoolStartYear + 1 : schoolStartYear;

  return {
    startDate: dateString(schoolStartYear, schoolYearStartMonth, 1),
    endDate: dateString(endYear, endMonth, lastDayOfMonth(endYear, endMonth)),
    explanation: `Mapped from grade ${grade} using birth year ${profile.birthYear}, kindergarten start age ${kindergartenStartAge}, and a school year starting in ${monthName(
      schoolYearStartMonth
    )}.`
  };
}

export function formatLifeCalendarPreview(profile?: UserProfile): string {
  const ageRange = ageToDateRange(8, profile);
  const gradeRange = gradeToDateRange(3, profile);
  if (!ageRange || !gradeRange) {
    return "Add at least a birth year to translate ages and grades into calendar ranges.";
  }
  return `Age 8 maps to ${formatRange(ageRange)}. 3rd grade maps to ${formatRange(gradeRange)}.`;
}

export function formatRange(range: Pick<LifeCalendarDateRange, "startDate" | "endDate">): string {
  return range.startDate === range.endDate ? range.startDate : `${range.startDate} to ${range.endDate}`;
}

export function monthName(month: number): string {
  return [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ][month - 1] ?? "August";
}

function validMonth(value: number | undefined): number | undefined {
  if (value === undefined) return undefined;
  return Number.isInteger(value) && value >= 1 && value <= 12 ? value : undefined;
}

function isValidMonthDay(month: number, day: number, year: number): boolean {
  if (!validMonth(month) || !Number.isInteger(day) || day < 1 || day > 31) return false;
  return day <= lastDayOfMonth(year, month);
}

function dateString(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function dateFromUtc(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
