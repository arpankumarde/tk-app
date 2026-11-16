import Placeholder from "@/constants/placeholder";
import type { EnrolledBundle } from "@/types/bundle";
import Feather from "@react-native-vector-icons/feather";
import { router } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface EnrolledBundleCardProps {
  bundle: EnrolledBundle;
  /** Lists every contained item with its own entry point. */
  expanded?: boolean;
}

const formatDate = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const EnrolledBundleCard = ({ bundle, expanded }: EnrolledBundleCardProps) => {
  const courses = bundle.courses || [];
  const tests = bundle.mockTests || [];
  const products = bundle.digitalProducts || [];
  const itemCount = courses.length + tests.length + products.length;

  const courseProgress = courses.length
    ? Math.round(
        courses.reduce((sum, c) => sum + (c.completionPercentage || 0), 0) /
          courses.length,
      )
    : 0;

  const enrolledOn = formatDate(bundle.enrolledAt);

  return (
    <View className="bg-white dark:bg-night rounded-2xl border border-line dark:border-night-line shadow-sm mb-4 overflow-hidden">
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push(`/bundles/${bundle.slug}` as any)}
        className="flex-row items-center p-4"
      >
        <Image
          source={{ uri: bundle.thumbnailUrl || Placeholder.BUNDLE }}
          className="w-28 aspect-video rounded-xl mr-4 bg-sand dark:bg-night-raised"
          resizeMode="cover"
        />

        <View className="flex-1">
          <Text
            className="text-ink dark:text-white font-extrabold text-lg mb-0.5"
            numberOfLines={2}
          >
            {bundle.title}
          </Text>
          <Text className="text-ink-soft dark:text-night-soft font-bold text-xs mb-2">
            By: {bundle.teacherName || "Testkart Expert"}
            {enrolledOn ? ` · ${enrolledOn}` : ""}
          </Text>

          <View className="flex-row items-center flex-wrap">
            <View className="flex-row items-center rounded-lg bg-clay-tint dark:bg-night-raised px-2 py-0.5 mr-2">
              <Feather name="layers" size={11} color="#FF8A50" />
              <Text className="ml-1 text-primary-deep dark:text-primary text-[10px] font-extrabold">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </Text>
            </View>
            {courses.length > 0 && (
              <Text className="text-ink-soft dark:text-night-soft font-extrabold text-[10px]">
                {courseProgress}% course progress
              </Text>
            )}
          </View>
        </View>

        <Feather name="chevron-right" size={20} color="#B5AEA3" />
      </TouchableOpacity>

      {expanded && itemCount > 0 && (
        <View className="px-4 pb-4">
          <View className="h-[1px] bg-sand dark:bg-night-raised mb-3" />

          {courses.map((course) => (
            <TouchableOpacity
              key={`course-${course.id}`}
              onPress={() =>
                router.push({
                  pathname: "/user/courses/[id]",
                  params: { id: String(course.id) },
                })
              }
              className="flex-row items-center py-2.5"
            >
              <View className="w-8 h-8 rounded-lg bg-clay-tint dark:bg-night-raised items-center justify-center mr-3">
                <Feather name="book-open" size={14} color="#FF8A50" />
              </View>
              <View className="flex-1 mr-2">
                <Text
                  className="text-ink dark:text-night-soft font-bold text-sm"
                  numberOfLines={1}
                >
                  {course.title}
                </Text>
                <View className="flex-row items-center mt-1">
                  <View className="flex-1 h-1.5 bg-sand dark:bg-night-raised rounded-full mr-2 overflow-hidden">
                    <View
                      className={`h-full ${
                        (course.completionPercentage || 0) >= 100
                          ? "bg-emerald-500"
                          : "bg-primary-deep"
                      }`}
                      style={{
                        width: `${Math.min(course.completionPercentage || 0, 100)}%`,
                      }}
                    />
                  </View>
                  <Text className="text-ink-soft dark:text-night-soft font-extrabold text-[10px]">
                    {Math.round(course.completionPercentage || 0)}%
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={16} color="#B5AEA3" />
            </TouchableOpacity>
          ))}

          {tests.map((test) => (
            <TouchableOpacity
              key={`test-${test.id}`}
              onPress={() =>
                router.push({
                  pathname: "/user/tests/[slug]",
                  params: { slug: test.slug },
                })
              }
              className="flex-row items-center py-2.5"
            >
              <View className="w-8 h-8 rounded-lg bg-sky-tint dark:bg-night-raised items-center justify-center mr-3">
                <Feather name="file-text" size={14} color="#3F6577" />
              </View>
              <Text
                className="flex-1 text-ink dark:text-night-soft font-bold text-sm mr-2"
                numberOfLines={1}
              >
                {test.title}
              </Text>
              {test.isEnrolled === false ? (
                <View className="rounded-md bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 mr-1">
                  <Text className="text-amber-600 dark:text-amber-400 font-extrabold text-[10px]">
                    Unlocking
                  </Text>
                </View>
              ) : null}
              <Feather name="chevron-right" size={16} color="#B5AEA3" />
            </TouchableOpacity>
          ))}

          {products.map((product) => (
            <TouchableOpacity
              key={`product-${product.id}`}
              onPress={() => router.push("/user/products")}
              className="flex-row items-center py-2.5"
            >
              <View className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 items-center justify-center mr-3">
                <Feather name="file" size={14} color="#10B981" />
              </View>
              <Text
                className="flex-1 text-ink dark:text-night-soft font-bold text-sm mr-2"
                numberOfLines={1}
              >
                {product.title}
              </Text>
              {product.isPurchased === false ? (
                <View className="rounded-md bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 mr-1">
                  <Text className="text-amber-600 dark:text-amber-400 font-extrabold text-[10px]">
                    Unlocking
                  </Text>
                </View>
              ) : null}
              <Feather name="chevron-right" size={16} color="#B5AEA3" />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

export default EnrolledBundleCard;
