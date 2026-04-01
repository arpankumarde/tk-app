import { useState, useEffect, useCallback } from "react";
import { EnrolledCourse, CourseProgressResponse } from "../types";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export const useEnrolledCourses = (
  token: string | null,
  options?: { limit?: number },
) => {
  const limit = options?.limit ?? 5;
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchCourses = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${BASE_URL}/_api/student/enrolled-courses?limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch courses");

      const data = await response.json();
      const payload = data.json || data;
      const baseCourses = payload.enrolledCourses || [];

      const detailedCourses = await Promise.all(
        baseCourses.map(async (c: any) => {
          try {
            const progressRes = await fetch(
              `${BASE_URL}/_api/student/course/progress?courseId=${c.id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );
            const progressData = await progressRes.json();
            const progressPayload: CourseProgressResponse =
              progressData.json || progressData;

            const thumbUrl = c.thumbnailUrl || c.thumbnailImageUrl;
            const isVideo =
              thumbUrl?.toLowerCase().endsWith(".mp4") ||
              thumbUrl?.includes("/course_videos/");

            return {
              ...c,
              thumbnailUrl:
                !isVideo && thumbUrl
                  ? thumbUrl
                  : "https://ik.imagekit.io/testkart/placeholders/mock-test-placeholder__FmYrad7s.png",
              completionPercentage:
                progressPayload.completionPercentage ??
                c.completionPercentage ??
                0,
              completedLessons: progressPayload.completedLessonIds?.length ?? 0,
              totalLessons: c.totalLessons || 0,
            };
          } catch (e) {
            return c;
          }
        }),
      );

      setCourses(detailedCourses);
      setTotal(detailedCourses.length);
    } catch (error) {
      console.error("Error fetching enrolled courses:", error);
    } finally {
      setLoading(false);
    }
  }, [token, limit]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return { courses, loading, total, refetch: fetchCourses };
};

export default useEnrolledCourses;
