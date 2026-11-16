import Feather from "@react-native-vector-icons/feather";
import MaterialIcons from "@react-native-vector-icons/material-icons";
import { router } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface TeacherItem {
  id: number;
  slug: string;
  displayName: string;
  avatarUrl?: string | null;
  isVerified?: boolean;
  tagline?: string | null;
  studentCount?: number;
  courseCount?: number;
  testCount?: number;
  productCount?: number;
}

const TeacherRailCard = ({ teacher }: { teacher: TeacherItem }) => {
  const avatarUri =
    teacher.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.displayName)}&background=FF8A50&color=fff`;

  const contentCount =
    (teacher.courseCount || 0) +
    (teacher.testCount || 0) +
    (teacher.productCount || 0);

  return (
    <TouchableOpacity
      onPress={() => router.push(`/expert/${teacher.slug}` as any)}
      activeOpacity={0.9}
      className="w-[144px] items-center bg-white dark:bg-night-raised rounded-3xl border border-line dark:border-night-line px-4 py-5"
    >
      <View className="w-16 h-16 rounded-full overflow-hidden border-2 border-line dark:border-night-line mb-3">
        <Image
          source={{ uri: avatarUri }}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>

      <View className="flex-row items-center mb-1 max-w-full">
        <Text
          className="text-ink dark:text-white font-extrabold text-[13px]"
          numberOfLines={1}
        >
          {teacher.displayName}
        </Text>
        {teacher.isVerified && (
          <MaterialIcons
            name="verified"
            size={12}
            color="#22C55E"
            style={{ marginLeft: 3 }}
          />
        )}
      </View>

      <Text
        className="text-ink-soft dark:text-night-soft text-[10px] font-medium text-center mb-3 leading-[14px] h-[14px]"
        numberOfLines={1}
      >
        {teacher.tagline || `${contentCount} resources`}
      </Text>

      <View className="flex-row items-center border-t border-line dark:border-night-line pt-3 w-full justify-center">
        <Feather name="users" size={11} color="#9A8A93" />
        <Text className="ml-1.5 text-ink-soft dark:text-night-soft text-[11px] font-bold">
          {teacher.studentCount ?? 0} students
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default TeacherRailCard;
