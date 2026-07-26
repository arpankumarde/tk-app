// Shapes for teacher-curated course bundles. Bundles span the public route
// group, the protected `user/` area and shared components, so unlike the
// route-scoped `app/user/types.ts` these live in a shared module.

export type BundleItemType = "course" | "test" | "digital_product";

export interface BundleListItem {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  originalPrice: number;
  discountPercentage: number | null;
  thumbnailUrl: string | null;
  isPublished: boolean;
  teacherId: number;
  teacherName: string;
  teacherIsVerified: boolean;
  itemCount: number;
  courseTitles?: string[];
}

export interface BundleListResponse {
  bundles: BundleListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface BundleItem {
  type: BundleItemType;
  id: number;
  title: string;
  slug?: string | null;
  price: number;
  orderIndex: number;
  // course
  level?: string | null;
  language?: string | null;
  // test
  durationMinutes?: number | null;
  totalQuestions?: number | null;
  // digital product
  pageCount?: number | null;
}

export interface BundleTeacher {
  id: number;
  displayName: string;
  profilePicture: string | null;
}

export interface BundleDetails {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  originalPrice: number;
  discountPercentage: number | null;
  thumbnailUrl: string | null;
  introVideoUrl: string | null;
  teacher: BundleTeacher;
  items: BundleItem[];
  isEnrolled: boolean;
  disclaimer?: string | null;
}

/** PayU field set returned by `POST /_api/bundles/purchase` for a paid bundle. */
export interface BundlePaymentData {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  hash: string;
  payuUrl: string;
  udf1?: string;
}

export interface EnrolledBundleCourse {
  id: number;
  title: string;
  slug: string;
  completionPercentage: number;
  lastAccessedAt: string | null;
}

export interface EnrolledBundleTest {
  id: number;
  title: string;
  slug: string;
  isEnrolled: boolean;
}

export interface EnrolledBundleProduct {
  id: number;
  title: string;
  slug: string;
  isPurchased: boolean;
}

export interface EnrolledBundle {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  teacherName: string;
  enrolledAt: string;
  courses: EnrolledBundleCourse[];
  mockTests: EnrolledBundleTest[];
  digitalProducts: EnrolledBundleProduct[];
}

export interface EnrolledBundlesResponse {
  enrolledBundles: EnrolledBundle[];
}
