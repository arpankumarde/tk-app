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
