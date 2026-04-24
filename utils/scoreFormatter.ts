export const parseScore = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  const normalized = String(value).replace(/%/g, "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const formatScore = (value: number | string | null | undefined) => {
  const numeric = parseScore(value);
  if (numeric === null) return "N/A";
  return `${numeric % 1 === 0 ? numeric.toFixed(0) : numeric.toFixed(1)}%`;
};

export const calculateAverageScore = (test: any) => {
  // Prioritize the average score from the API if available
  const apiScore = parseScore(test.averageScore);
  if (apiScore !== null) return apiScore;

  // Fallback to local calculation if API score is missing
  const itemBestScores = (test.testItems || [])
    .map((item: any) => parseScore(item.bestScore))
    .filter((score: any): score is number => score !== null);

  if (itemBestScores.length > 0) {
    return (
      itemBestScores.reduce((sum: number, score: number) => sum + score, 0) /
      itemBestScores.length
    );
  }

  return null;
};
