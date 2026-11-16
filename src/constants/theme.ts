export const Theme = {
  light: {
    page: "#F8F5EF",
    surface: "#FFFFFF",
    tile: "#EFE8DD",
    line: "#E3DACB",
    ink: "#2D2A24",
    inkSoft: "#6A6358",
    accentText: "#AE4A1E",
  },
  dark: {
    page: "#1A1916",
    surface: "#25231F",
    tile: "#302D28",
    line: "#3A3731",
    ink: "#F3EFE8",
    inkSoft: "#B5AEA3",
    accentText: "#FFA477",
  },
  accent: "#FF8A50",
} as const;

export const Tints = {
  sand: { bg: "#EFE8DD", fg: "#2D2A24", darkBg: "#33302A", darkFg: "#F3EFE8" },
  sage: { bg: "#E2EBDD", fg: "#4F6F58", darkBg: "#27322B", darkFg: "#A9C4AF" },
  wheat: { bg: "#F4E8CC", fg: "#8A6A22", darkBg: "#352D1C", darkFg: "#E0C47F" },
  clay: { bg: "#F5E0D3", fg: "#A4502C", darkBg: "#38261E", darkFg: "#EBA585" },
  sky: { bg: "#DDE8EC", fg: "#3F6577", darkBg: "#202D33", darkFg: "#9CC0D0" },
  stone: { bg: "#E8E4DC", fg: "#5E574C", darkBg: "#302D28", darkFg: "#CFC7BA" },
} as const;

export const tintColors = (name: TintName, scheme: string | undefined) => {
  const t = Tints[name];
  return scheme === "dark"
    ? { bg: t.darkBg, fg: t.darkFg }
    : { bg: t.bg, fg: t.fg };
};

export type TintName = keyof typeof Tints;

export const themeColors = (scheme: string | undefined) =>
  scheme === "dark" ? Theme.dark : Theme.light;
