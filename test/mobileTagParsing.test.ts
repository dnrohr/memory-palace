import { describe, expect, it } from "vitest";
import { parseTagNames } from "../src/core/tagParsing";

describe("mobile tag parsing", () => {
  it("normalizes common manual tag separators", () => {
    expect(parseTagNames("Family; #Summer-Camp\nold house  college")).toEqual([
      "family",
      "summer camp",
      "old house",
      "college"
    ]);
  });
});
