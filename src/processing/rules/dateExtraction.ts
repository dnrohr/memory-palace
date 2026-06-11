import type { DateCandidate, UserProfile } from "../../core/types";
import type { IDateExtractionEngine, MemoryProcessingInput } from "../contracts";

const YEAR_PATTERN = /\b(19\d{2}|20\d{2})\b/g;
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

    if (userProfile?.birthYear) {
      const year = userProfile.birthYear + age;
      candidate.startDate = `${year}-01-01`;
      candidate.endDate = `${year}-12-31`;
      candidate.inferenceExplanation = `Inferred from age ${age} and birth year ${userProfile.birthYear}.`;
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

    if (userProfile?.birthYear) {
      const schoolStartYear = userProfile.birthYear + grade + 5;
      candidate.startDate = `${schoolStartYear}-08-01`;
      candidate.endDate = `${schoolStartYear + 1}-06-30`;
      candidate.inferenceExplanation = `Inferred from grade ${grade} and birth year ${userProfile.birthYear}.`;
    }

    candidates.push(candidate);
  }

  return dedupeDateCandidates(candidates);
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
