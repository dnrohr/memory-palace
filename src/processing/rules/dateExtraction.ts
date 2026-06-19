import type { DateCandidate, UserProfile } from "../../core/types";
import { ageToDateRange, gradeToDateRange } from "../../core/lifeCalendar";
import type { IDateExtractionEngine, MemoryProcessingInput } from "../contracts";

const YEAR_PATTERN = /\b(19\d{2}|20\d{2})\b/g;
const MONTH_YEAR_PATTERN = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(19\d{2}|20\d{2})\b/gi;
const DECADE_PATTERN = /\b((?:19|20)\d0)s\b/g;
const AGE_PATTERN = /\b(?:when I was|at age|age)\s+(\d{1,2})\b/gi;
const GRADE_PATTERN = /\b(\d{1,2})(?:st|nd|rd|th)\s+grade\b/gi;

export class RulesDateExtractionEngine implements IDateExtractionEngine {
  async extractDates(input: MemoryProcessingInput): Promise<DateCandidate[]> {
    return extractDateCandidates(input.rawText, input.userProfile);
  }
}

export function extractDateCandidates(text: string, userProfile?: UserProfile): DateCandidate[] {
  const candidates: DateCandidate[] = [];

  for (const match of text.matchAll(MONTH_YEAR_PATTERN)) {
    const monthName = match[1];
    const year = match[2];
    if (!monthName || !year) continue;
    const month = monthNumber(monthName);
    candidates.push({
      label: `${monthName} ${year}`,
      startDate: `${year}-${month}-01`,
      endDate: `${year}-${month}-${lastDayOfMonth(Number(year), Number(month))}`,
      precision: "month",
      confidence: 0.93,
      sourceText: match[0]
    });
  }

  for (const match of text.matchAll(YEAR_PATTERN)) {
    const year = match[1];
    if (!year) continue;
    candidates.push({
      label: year,
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      precision: "year",
      confidence: 0.9,
      sourceText: match[0]
    });
  }

  for (const match of text.matchAll(DECADE_PATTERN)) {
    const decade = match[1];
    if (!decade) continue;
    const startYear = Number(decade);
    candidates.push({
      label: `${decade}s`,
      startDate: `${startYear}-01-01`,
      endDate: `${startYear + 9}-12-31`,
      precision: "decade",
      confidence: 0.82,
      sourceText: match[0]
    });
  }

  for (const match of text.matchAll(AGE_PATTERN)) {
    const age = Number(match[1]);
    const candidate: DateCandidate = {
      label: `age ${age}`,
      precision: "age",
      confidence: userProfile?.birthYear ? 0.74 : 0.52,
      sourceText: match[0]
    };

    const range = ageToDateRange(age, userProfile);
    if (range) {
      candidate.startDate = range.startDate;
      candidate.endDate = range.endDate;
      candidate.inferenceExplanation = range.explanation;
    } else {
      candidate.inferenceExplanation = `Age mentions need a birth year before memory palace can map "${match[0]}" to a calendar year.`;
    }

    candidates.push(candidate);
  }

  for (const match of text.matchAll(GRADE_PATTERN)) {
    const grade = Number(match[1]);
    const candidate: DateCandidate = {
      label: `${grade}${ordinalSuffix(grade)} grade`,
      precision: "grade",
      confidence: userProfile?.birthYear ? 0.75 : 0.55,
      sourceText: match[0]
    };

    const range = gradeToDateRange(grade, userProfile);
    if (range) {
      candidate.startDate = range.startDate;
      candidate.endDate = range.endDate;
      candidate.inferenceExplanation = range.explanation;
    } else {
      candidate.inferenceExplanation = `Grade mentions need a birth year before memory palace can map "${match[0]}" to a school-year range.`;
    }

    candidates.push(candidate);
  }

  return dedupeDateCandidates(candidates);
}

function monthNumber(value: string): string {
  const index = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december"
  ].indexOf(value.toLocaleLowerCase());
  return String(index + 1).padStart(2, "0");
}

function lastDayOfMonth(year: number, month: number): string {
  return String(new Date(Date.UTC(year, month, 0)).getUTCDate()).padStart(2, "0");
}

function ordinalSuffix(value: number): string {
  const remainder = value % 100;
  if (remainder >= 11 && remainder <= 13) return "th";

  switch (value % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function dedupeDateCandidates(candidates: DateCandidate[]): DateCandidate[] {
  const byKey = new Map<string, DateCandidate>();

  for (const candidate of candidates) {
    const key = `${candidate.label}:${candidate.startDate ?? ""}:${candidate.endDate ?? ""}`;
    const existing = byKey.get(key);
    if (!existing || candidate.confidence > existing.confidence) {
      byKey.set(key, candidate);
    }
  }

  return [...byKey.values()];
}
