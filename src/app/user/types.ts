export interface EnrolledCourse {
  id: number;
  courseId: number;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  thumbnailImageUrl?: string | null;
  teacherName: string;
  completionPercentage: number;
  totalLessons: number;
  completedLessons: number;
  lastAccessedAt: string | null;
}

export interface EnrolledTest {
  id: number;
  testId?: number;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  thumbnailImageUrl?: string | null;
  creatorName?: string;
  teacherName?: string;
  teacherAvatar?: string;
  examName?: string;
  category?: string;
  language?: string;
  totalQuestions?: number;
  durationMinutes?: number;
  enrolledAt?: string;
  publishedAt?: string;
  pdfUrl?: string;
  lastAttemptedAt?: string | null;
  totalItems?: number;
  completedItems?: number;
  progressPercentage?: number;
  averageScore?: number | string | null;
  testItems?: {
    id: number;
    title: string;
    durationMinutes: number;
    totalQuestions: number;
    attemptsCount: number;
    isCompleted: boolean;
    bestScore?: number | null;
  }[];
}

export interface CourseProgressResponse {
  completionPercentage: number;
  completedLessonIds: number[];
  lastAccessedAt: string;
}

export interface EnrolledTestsResponse {
  tests: EnrolledTest[];
  total: number;
}

export interface EnrolledCoursesResponse {
  enrolledCourses: EnrolledCourse[];
  total: number;
}

export interface PurchasedProduct {
  purchaseId: number;
  purchasedAt: string;
  downloadCount: number;
  lastDownloadedAt: string | null;
  productId: number;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  category: string;
  teacherName: string;
  pdfUrl?: string;
}

// Individual question (without sensitive fields)
export interface Question {
  id: number;
  questionText: string;
  options?: string[];
  optionA?: string | null;
  optionB?: string | null;
  optionC?: string | null;
  optionD?: string | null;
  type?:
    | "MCQ"
    | "MSQ"
    | "NUMERIC"
    | "single_correct_mcq"
    | "multiple_correct_mcq"
    | "numerical"
    | "assertion_reason"
    | "comprehension";
  questionType?:
    | "single_correct_mcq"
    | "multiple_correct_mcq"
    | "numerical"
    | "assertion_reason"
    | "comprehension"
    | string;
  marks?: number;
  positiveMarks?: string | number;
  negativeMarks?: string | number;
  paragraphText?: string | null;
  subjectName?: string;
}

export interface GetTestQuestionsResponse {
  questions: Question[];
  calculatorEnabled: boolean;
}

export interface TestItemInstructionsResponse {
  testItem: {
    id: number;
    title: string;
    description?: string | null;
    durationMinutes: number;
    totalQuestions: number;
    totalMarks: number;
    positiveMarks: number;
    negativeMarks: number;
    isFree: boolean;
    calculatorEnabled: boolean;
    subjectWiseTiming: boolean;
    questionWiseTiming: boolean;
    scheduledDate: string | null;
  };
  package: {
    id: number;
    title: string;
    teacherName: string;
    thumbnailUrl: string | null;
  };
  subjects: Array<{
    id: number;
    subjectName: string;
    durationMinutes: number;
    questionCount: number;
    maxAttemptsAllowed: number | null;
    sections: Array<{
      id: number;
      sectionName: string;
      maxAttemptsAllowed: number | null;
      questionCount: number;
    }>;
  }>;
  access: { hasAccess: boolean; isFree: boolean };
  previousAttempt: {
    hasAttempted: boolean;
    attemptCount: number;
    lastAttempt: {
      score: number;
      totalQuestions: number;
      startedAt: string;
      completedAt: string;
    } | null;
  };
}

export interface StartAttemptRequest {
  testItemId: number;
}

export interface StartAttemptResponse {
  attemptId: number;
  startedAt: string;
}

export type OptionLetter = "A" | "B" | "C" | "D";

export type SingleAnswer = {
  questionId: number;
  answerType: "single";
  selectedOption: OptionLetter;
};

export type MultipleAnswer = {
  questionId: number;
  answerType: "multiple";
  selectedOptions: OptionLetter[];
};

export type NumericalAnswer = {
  questionId: number;
  answerType: "numerical";
  numericalAnswer: number;
};

export type MatchAnswer = {
  questionId: number;
  answerType: "match";
  matchedPairs: {
    left: string;
    right: string;
  }[];
};

export type StudentAnswer =
  | SingleAnswer
  | MultipleAnswer
  | NumericalAnswer
  | MatchAnswer;

export interface SubmitAttemptRequest {
  attemptId: number;
  answers: StudentAnswer[];
}

export interface AttemptQuestionResult {
  questionId: number;
  isCorrect?: boolean;
  marksObtained?: number;
  maxMarks?: number;
  correctAnswers?: unknown;
  studentAnswer?: unknown;
}

export interface SubmitAttemptResponse {
  score: number;
  totalMarks: number;
  maxPossibleMarks: number;
  correctAnswers: number;
  results: AttemptQuestionResult[];
}

export interface LatestAttemptDetails {
  id?: number;
  testItemId?: number;
  startedAt?: string;
  completedAt?: string;
  score?: number;
  totalMarks?: number;
  maxPossibleMarks?: number;
}

export interface LatestAttemptResultsResponse {
  attempt: LatestAttemptDetails | null;
  results: AttemptQuestionResult[];
}

export interface LatestAttemptResultItem {
  questionId: number;
  questionText: string;
  questionType?: string;
  paragraphText?: string | null;
  optionA?: string | null;
  optionB?: string | null;
  optionC?: string | null;
  optionD?: string | null;
  selectedOption?: OptionLetter | null;
  selectedOptions?: OptionLetter[] | null;
  studentNumericalAnswer?: number | null;
  correctOption?: OptionLetter | null;
  correctOptions?: OptionLetter[] | null;
  correctNumericalAnswer?: number | null;
  positiveMarks?: number;
  negativeMarks?: number;
  marksObtained?: number;
  isCorrect?: boolean;
  explanation?: string | null;
}

// Orders
export type OrderItemType = "test" | "course" | "product" | "bundle";

export type OrderStatus = "pending" | "completed" | "cancelled" | "failed";

export interface OrderItem {
  orderItemId: number;
  title: string;
  itemType: OrderItemType;
  priceAtPurchase: number;
  thumbnailUrl: string | null;
  mockTestId?: number | null;
  courseId?: number | null;
  digitalProductId?: number | null;
  bundleId?: number | null;
}

export interface OrderSummary {
  id: number;
  status: OrderStatus;
  totalAmount: number | string;
  createdAt: string;
  itemCount: number;
}

export interface Order {
  id: number;
  status: OrderStatus;
  totalAmount: number | string;
  createdAt: string;
  items: OrderItem[];
  paymentTransactionId?: string | null;
}

export interface OrdersListResponse {
  orders: Order[];
  total: number;
}

export interface OrderDetailsResponse {
  order: Order;
  error?: string;
}

// Wallet
export interface WalletBalance {
  availableBalance: number;
  totalCredits: number;
  totalWithdrawn: number;
  totalPurchased: number;
  breakdown: {
    credits: { count: number; amount: number };
    withdrawals: { count: number; amount: number };
    purchases: { count: number; amount: number };
  };
}

export type WalletTransactionType =
  | "prize_credit"
  | "prize_lock_refund"
  | "purchase_debit"
  | "withdrawal_debit";

export type WithdrawalStatus = "pending" | "completed" | "rejected";

export interface WalletTransaction {
  id: number;
  transactionType: WalletTransactionType;
  amount: number;
  description: string;
  createdAt: string;
  referenceId?: number | null;
  studentId?: number;
  withdrawalStatus?: WithdrawalStatus;
}

export interface WalletTransactionsResponse {
  transactions: WalletTransaction[];
  total: number;
  page: number;
  limit: number;
}

export interface LatestAttemptResultsPayload {
  attemptId: number;
  completedAt?: string;
  score: number;
  totalMarks: number;
  maxPossibleMarks: number;
  correctAnswers: number;
  totalQuestions?: number;
  timeTaken?: number;
  mockTestId?: number;
  testPackageTitle?: string;
  results: LatestAttemptResultItem[];
}
