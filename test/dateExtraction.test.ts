import { describe, expect, it } from "vitest";
import { extractDateCandidates } from "../src/processing/rules/dateExtraction";

describe("rules date extraction", () => {
  it("extracts explicit years", () => {
    const candidates = extractDateCandidates("In 2004 we moved.");

    expect(candidates).toContainEqual(
      expect.objectContaining({
        label: "2004",
        startDate: "2004-01-01",
        endDate: "2004-12-31",
        precision: "year"
      })
    );
  });

  it("extracts month and year mentions", () => {
    const candidates = extractDateCandidates("We moved in February 2004.");

    expect(candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "February 2004",
          startDate: "2004-02-01",
          endDate: "2004-02-29",
          precision: "month",
          sourceText: "February 2004"
        })
      ])
    );
  });

  it("infers school year range from grade and birth year", () => {
    const candidates = extractDateCandidates("When I was in 4th grade, my dog Patrick died.", { birthYear: 1985 });

    expect(candidates).toContainEqual(
      expect.objectContaining({
        label: "4th grade",
        startDate: "1994-08-01",
        endDate: "1995-06-30",
        precision: "grade"
      })
    );
  });

  it("keeps grade date uncertain without profile context", () => {
    const candidates = extractDateCandidates("When I was in 4th grade, we moved.");

    expect(candidates).toContainEqual(
      expect.objectContaining({
        label: "4th grade",
        precision: "grade",
        confidence: 0.55,
        inferenceExplanation: expect.stringContaining("need a birth year")
      })
    );
  });

  it("keeps age date uncertain without profile context", () => {
    const candidates = extractDateCandidates("When I was 8, we moved.");

    expect(candidates).toContainEqual(
      expect.objectContaining({
        label: "age 8",
        precision: "age",
        confidence: 0.52,
        inferenceExplanation: expect.stringContaining("need a birth year")
      })
    );
  });

  it("extracts decades", () => {
    const candidates = extractDateCandidates("This happened in the 1990s.");

    expect(candidates).toContainEqual(
      expect.objectContaining({
        label: "1990s",
        startDate: "1990-01-01",
        endDate: "1999-12-31",
        precision: "decade"
      })
    );
  });
});
