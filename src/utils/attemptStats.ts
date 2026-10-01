type ResultLike = {
  isCorrect?: boolean | null;
  selectedOption?: string | null;
  selectedOptions?: string[] | null;
  studentNumericalAnswer?: number | null;
  matchAnswers?: Record<string, string> | null;
};

// The server sends isCorrect null for unanswered questions, and also for every
// question of a live test whose results are not out yet, so the student's own
// answer decides whether a question was attempted.
export const isQuestionAttempted = (item: ResultLike) => {
  if (item.isCorrect === true || item.isCorrect === false) return true;
  if (item.selectedOption) return true;
  if (item.selectedOptions && item.selectedOptions.length > 0) return true;
  if (
    item.studentNumericalAnswer !== null &&
    item.studentNumericalAnswer !== undefined
  ) {
    return true;
  }
  return Object.values(item.matchAnswers ?? {}).some(
    (value) => value !== null && String(value).trim() !== "",
  );
};

export const getAttemptStats = (
  results: ResultLike[],
  correctCount: number,
  totalQuestions: number,
) => {
  const total = results.length || totalQuestions;
  const notAttempted = results.length
    ? results.filter((item) => !isQuestionAttempted(item)).length
    : 0;
  const attempted = total - notAttempted;
  return {
    total,
    attempted,
    notAttempted,
    incorrect: Math.max(0, attempted - correctCount),
  };
};
