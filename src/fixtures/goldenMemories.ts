import type { DatePrecision, TagType, UserProfile } from "../core/types";

export type GoldenMemory = {
  id: string;
  title: string;
  input: string;
  userProfile?: UserProfile;
  expectedTags: Array<{ name: string; type?: TagType }>;
  expectedDate?: {
    precision: DatePrecision;
    startDate?: string;
    endDate?: string;
  };
};

export const goldenMemories: GoldenMemory[] = [
  {
    id: "childhood-pet-grade",
    title: "Childhood pet memory with grade inference",
    input:
      "When I was in 4th grade, my dog Patrick died and my parents decided to get a cat. We went to the animal shelter and found a tabby. I named her Lila.",
    userProfile: { birthYear: 1985 },
    expectedTags: [
      { name: "Patrick", type: "pet" },
      { name: "Lila", type: "pet" },
      { name: "dog", type: "theme" },
      { name: "cat", type: "theme" },
      { name: "pet", type: "theme" },
      { name: "animal shelter", type: "place" }
    ],
    expectedDate: {
      precision: "grade",
      startDate: "1994-08-01",
      endDate: "1995-06-30"
    }
  },
  {
    id: "college-roommate-year",
    title: "College roommate memory with explicit year",
    input: "In 2004 my college roommate Maya taught me how to make soup after late study nights.",
    expectedTags: [
      { name: "college", type: "life_period" },
      { name: "roommate", type: "theme" },
      { name: "Maya", type: "person" }
    ],
    expectedDate: {
      precision: "year",
      startDate: "2004-01-01",
      endDate: "2004-12-31"
    }
  },
  {
    id: "first-job",
    title: "First job memory",
    input: "My first job was at the bookstore downtown. I worked the closing shift and loved stacking the front table.",
    expectedTags: [{ name: "work", type: "activity" }]
  },
  {
    id: "moving-apartment",
    title: "Moving apartment memory",
    input: "The apartment felt too quiet after we moved out of the old house.",
    expectedTags: [
      { name: "apartment", type: "place" },
      { name: "old house", type: "place" }
    ]
  },
  {
    id: "vacation",
    title: "Vacation memory",
    input: "Our vacation trip to Lake George was the first time I remember seeing my father relax.",
    expectedTags: [
      { name: "travel", type: "activity" },
      { name: "George", type: "person" }
    ]
  },
  {
    id: "grief-pet",
    title: "Grief memory",
    input: "I still feel grief when I remember the day we lost our cat Lila.",
    expectedTags: [
      { name: "grief", type: "emotion" },
      { name: "cat", type: "theme" },
      { name: "pet", type: "theme" },
      { name: "Lila", type: "pet" }
    ]
  },
  {
    id: "ambiguous-date",
    title: "Ambiguous date memory",
    input: "Sometime before we moved, I remember standing in the hallway listening to rain.",
    expectedTags: []
  },
  {
    id: "same-name",
    title: "Multiple people with the same name",
    input: "Alex from school and Alex from work both came to the party, which confused everyone.",
    expectedTags: [
      { name: "Alex", type: "person" },
      { name: "work", type: "activity" }
    ]
  }
];
