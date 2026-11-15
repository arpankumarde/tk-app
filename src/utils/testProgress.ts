import type { StudentAnswer } from "@/app/user/types";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

type Letter = "A" | "B" | "C" | "D" | "E";

export type SavedAnswer =
  | { type: "single"; value: Letter }
  | { type: "multiple"; value: Letter[] }
  | { type: "numerical"; value: number }
  | { type: "match"; value: Record<string, string> };

// Same shape the web player saves (helpers/testAttemptProgressState in the
// Floot project), so a test paused on one can be resumed on the other.
export type AttemptProgressState = {
  v: 1;
  answers: [number, SavedAnswer][];
  currentQuestionId: number | null;
  markedForReview: number[];
  visitedQuestionIds: number[];
  timeRemaining: number;
  subjectTimerStates: Record<string, { remaining: number; submitted: boolean }>;
  activeSubjectName: string;
  expiredQuestionIds: number[];
  questionTimerSeconds: number | null;
};

export type SavedAttempt = {
  attemptId: number;
  startedAt: string;
  savedAt: string;
  answeredCount: number;
  totalQuestions: number;
  elapsedSeconds: number;
  state: AttemptProgressState;
};

export type ResumedAttempt = {
  attemptId: number;
  startedAt: string;
  elapsedSeconds: number;
};

const errorMessage = (payload: any, fallback: string) => {
  const error = payload?.error ?? payload?.message;
  if (typeof error === "string" && error) return error;
  if (Array.isArray(error) && typeof error[0]?.message === "string") {
    return error[0].message;
  }
  return fallback;
};

const call = async <T>(
  token: string,
  path: string,
  fallback: string,
  body?: unknown,
): Promise<T> => {
  const response = await fetch(`${BASE_URL}/_api/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify({ json: body }),
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    // Keep the fallback message below.
  }
  const payload = data?.json ?? data;

  if (!response.ok) {
    throw new Error(errorMessage(payload, fallback));
  }
  return payload as T;
};

export const fetchSavedAttempt = async (
  token: string,
  testItemId: number,
): Promise<SavedAttempt | null> => {
  const payload = await call<{ attempt: SavedAttempt | null }>(
    token,
    `student/test-item/saved-attempt?testItemId=${testItemId}`,
    "Could not load your saved test.",
  );
  return payload?.attempt ?? null;
};

export const resumeAttempt = (token: string, attemptId: number) =>
  call<ResumedAttempt>(
    token,
    "student/test-item/resume-attempt",
    "Could not resume your test.",
    { attemptId },
  );

export const saveAttemptProgress = (
  token: string,
  attemptId: number,
  elapsedSeconds: number,
  state: AttemptProgressState,
) =>
  call<{ ok: true }>(
    token,
    "student/test-item/save-progress",
    "Could not save your progress.",
    { attemptId, elapsedSeconds, state },
  );

export const discardAttempt = (token: string, attemptId: number) =>
  call<{ ok: true }>(
    token,
    "student/test-item/discard-attempt",
    "Could not clear your saved test.",
    { attemptId },
  );

export type ProgressQuestion = {
  id: number;
  category: string;
  optionLetters: Letter[];
};

export type ProgressSubject = {
  subjectId: number;
  subjectName: string;
  sections: { questions: ProgressQuestion[] }[];
};

export type SelectedValue = number | number[] | string | null;

export type CarriedProgress = {
  answers: [number, SavedAnswer][];
  markedForReview: number[];
  visitedQuestionIds: number[];
  expiredQuestionIds: number[];
};

export const EMPTY_CARRIED: CarriedProgress = {
  answers: [],
  markedForReview: [],
  visitedQuestionIds: [],
  expiredQuestionIds: [],
};

const toSavedAnswer = (answer: StudentAnswer): [number, SavedAnswer] | null => {
  switch (answer.answerType) {
    case "single":
      return [answer.questionId, { type: "single", value: answer.selectedOption }];
    case "multiple":
      return [
        answer.questionId,
        { type: "multiple", value: answer.selectedOptions },
      ];
    case "numerical":
      return [
        answer.questionId,
        { type: "numerical", value: answer.numericalAnswer },
      ];
    default:
      return null;
  }
};

type BuildArgs = {
  answers: StudentAnswer[];
  currentQuestionId: number | null;
  subjects: ProgressSubject[];
  subjectWiseTiming: boolean;
  activeSubjectIndex: number;
  completedSubjectIds: number[];
  remainingSeconds: number;
  questionRemainingSeconds: number | null;
  carried: CarriedProgress;
};

export const buildProgressState = (args: BuildArgs): AttemptProgressState => {
  const answered = new Set<number>();
  const answers: [number, SavedAnswer][] = [];

  args.answers.forEach((answer) => {
    const saved = toSavedAnswer(answer);
    if (saved) {
      answered.add(saved[0]);
      answers.push(saved);
    }
  });

  // Answers this app cannot show (match the following) and answers for
  // questions it did not load are written back untouched, so pausing here
  // never wipes what the web saved.
  args.carried.answers.forEach((entry) => {
    if (!answered.has(entry[0])) answers.push(entry);
  });

  const subjectTimerStates: AttemptProgressState["subjectTimerStates"] = {};
  let activeSubjectName = "";

  if (args.subjectWiseTiming) {
    args.subjects.forEach((subject, index) => {
      const done = args.completedSubjectIds.includes(subject.subjectId);
      if (index === args.activeSubjectIndex) {
        activeSubjectName = subject.subjectName;
        subjectTimerStates[subject.subjectName] = {
          remaining: Math.max(0, Math.round(args.remainingSeconds)),
          submitted: false,
        };
      } else if (done) {
        subjectTimerStates[subject.subjectName] = {
          remaining: 0,
          submitted: true,
        };
      }
    });
  } else {
    activeSubjectName = args.subjects[args.activeSubjectIndex]?.subjectName ?? "";
  }

  return {
    v: 1,
    answers: answers.slice(0, 2000),
    currentQuestionId: args.currentQuestionId,
    markedForReview: args.carried.markedForReview,
    visitedQuestionIds: args.carried.visitedQuestionIds,
    timeRemaining: Math.max(0, Math.round(args.remainingSeconds)),
    subjectTimerStates,
    activeSubjectName: activeSubjectName.slice(0, 300),
    expiredQuestionIds: args.carried.expiredQuestionIds,
    questionTimerSeconds:
      args.questionRemainingSeconds == null
        ? null
        : Math.max(0, Math.round(args.questionRemainingSeconds)),
  };
};

export type RestoredAttempt = {
  selectedAnswers: Record<number, SelectedValue>;
  subjectIndex: number;
  sectionIndex: number;
  questionIndex: number;
  completedSubjectIds: number[];
  subjectRemainingSeconds: number | null;
  questionTimer: { id: number; seconds: number } | null;
  carried: CarriedProgress;
};

export const restoreAttempt = (
  state: AttemptProgressState,
  subjects: ProgressSubject[],
  subjectWiseTiming: boolean,
): RestoredAttempt => {
  const byId = new Map<number, ProgressQuestion>();
  subjects.forEach((subject) =>
    subject.sections.forEach((section) =>
      section.questions.forEach((q) => byId.set(q.id, q)),
    ),
  );

  const selectedAnswers: Record<number, SelectedValue> = {};
  const carriedAnswers: [number, SavedAnswer][] = [];

  state.answers.forEach((entry) => {
    const [questionId, answer] = entry;
    const question = byId.get(questionId);
    let restored: SelectedValue | undefined;

    if (question) {
      if (answer.type === "single" && question.category !== "multi") {
        const index = question.optionLetters.indexOf(answer.value);
        if (index >= 0) restored = index;
      } else if (answer.type === "multiple" && question.category === "multi") {
        const indexes = answer.value
          .map((letter) => question.optionLetters.indexOf(letter))
          .filter((index) => index >= 0);
        if (indexes.length > 0) restored = indexes;
      } else if (answer.type === "numerical" && question.category === "numeric") {
        restored = String(answer.value);
      }
    }

    if (restored === undefined) {
      carriedAnswers.push(entry);
    } else {
      selectedAnswers[questionId] = restored;
    }
  });

  let subjectIndex = 0;
  let sectionIndex = 0;
  let questionIndex = 0;

  if (subjectWiseTiming && state.activeSubjectName) {
    const found = subjects.findIndex(
      (subject) => subject.subjectName === state.activeSubjectName,
    );
    if (found >= 0) subjectIndex = found;
  }

  const target = state.currentQuestionId;
  if (target != null) {
    outer: for (let s = 0; s < subjects.length; s++) {
      for (let sec = 0; sec < subjects[s].sections.length; sec++) {
        const index = subjects[s].sections[sec].questions.findIndex(
          (q) => q.id === target,
        );
        if (index >= 0) {
          // Subject-wise tests stay in the saved active subject.
          if (!subjectWiseTiming || s === subjectIndex) {
            subjectIndex = s;
            sectionIndex = sec;
            questionIndex = index;
          }
          break outer;
        }
      }
    }
  }

  const completedSubjectIds: number[] = [];
  let subjectRemainingSeconds: number | null = null;

  if (subjectWiseTiming) {
    subjects.forEach((subject) => {
      if (state.subjectTimerStates[subject.subjectName]?.submitted) {
        completedSubjectIds.push(subject.subjectId);
      }
    });
    const active = state.subjectTimerStates[subjects[subjectIndex]?.subjectName];
    subjectRemainingSeconds = active ? active.remaining : null;
  }

  const currentId =
    subjects[subjectIndex]?.sections[sectionIndex]?.questions[questionIndex]?.id;

  return {
    selectedAnswers,
    subjectIndex,
    sectionIndex,
    questionIndex,
    completedSubjectIds,
    subjectRemainingSeconds,
    questionTimer:
      currentId != null && state.questionTimerSeconds != null
        ? { id: currentId, seconds: state.questionTimerSeconds }
        : null,
    carried: {
      answers: carriedAnswers,
      markedForReview: state.markedForReview,
      visitedQuestionIds: state.visitedQuestionIds,
      expiredQuestionIds: state.expiredQuestionIds,
    },
  };
};
