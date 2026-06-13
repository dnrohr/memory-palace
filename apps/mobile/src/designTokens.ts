export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 28
} as const;

export const radius = {
  sm: 8,
  md: 8,
  pill: 999,
  circle: 999
} as const;

export const typography = {
  brand: { fontSize: 24, fontWeight: "700" },
  screenTitle: { fontSize: 24, fontWeight: "800", lineHeight: 30 },
  title: { fontSize: 18, fontWeight: "700" },
  body: { fontSize: 16, lineHeight: 24 },
  metadata: { fontSize: 13, lineHeight: 20 },
  label: { fontSize: 12, fontWeight: "800" },
  button: { fontSize: 15, fontWeight: "700" },
  nav: { fontSize: 12, fontWeight: "700" }
} as const;

const lightColors = {
  background: "#f6f2ea",
  shellSurface: "#f8f5ee",
  surface: "#fffdf8",
  paper: "#fffaf1",
  quietSurface: "#f1f0eb",
  elevatedSurface: "#f7faf3",
  primaryText: "#252925",
  secondaryText: "#41463f",
  mutedText: "#697067",
  metadataText: "#697067",
  connectionText: "#596c55",
  accent: "#334f39",
  accentText: "#ffffff",
  accentSoft: "#ebe4d5",
  accentSage: "#38543c",
  accentSageText: "#ffffff",
  border: "#d8d4c8",
  strongBorder: "#d1cdbf",
  warmBorder: "#d4c7b4",
  navBorder: "#ddd5c6",
  tagBackground: "#e9eee4",
  tagText: "#374236",
  tagSelectedBackground: "#38543c",
  tagSelectedText: "#ffffff",
  dateBadgeBackground: "#e9eee4",
  dateBadgeText: "#4e554c",
  dangerText: "#9a3d2f"
} as const;

const darkColors = {
  background: "#171b18",
  shellSurface: "#20251f",
  surface: "#20251f",
  paper: "#251f1b",
  quietSurface: "#252822",
  elevatedSurface: "#202a1f",
  primaryText: "#f3efe7",
  secondaryText: "#d8d2c5",
  mutedText: "#aab1a6",
  metadataText: "#aab1a6",
  connectionText: "#b8c9b1",
  accent: "#66825f",
  accentText: "#ffffff",
  accentSoft: "#2c382d",
  accentSage: "#6f8a68",
  accentSageText: "#111511",
  border: "#3a4338",
  strongBorder: "#485244",
  warmBorder: "#534235",
  navBorder: "#343b33",
  tagBackground: "#30362f",
  tagText: "#dbe1d7",
  tagSelectedBackground: "#6f8a68",
  tagSelectedText: "#111511",
  dateBadgeBackground: "#30362f",
  dateBadgeText: "#dbe1d7",
  dangerText: "#eba18e"
} as const;

export const lightTheme = {
  colors: lightColors,
  spacing,
  radius,
  typography
} as const;

export const darkTheme = {
  colors: darkColors,
  spacing,
  radius,
  typography
} as const;

export type AppTheme = typeof lightTheme;
