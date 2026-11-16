import BottomTabs from "@/components/BottomTabs";
import { themeColors } from "@/constants/theme";
import Feather from "@react-native-vector-icons/feather";
import MaterialIcons from "@react-native-vector-icons/material-icons";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

type Teacher = {
  id: number;
  slug: string;
  displayName: string;
  avatarUrl?: string | null;
  isVerified?: boolean;
  tagline?: string | null;
  studentCount?: number;
};

const OneOnOne = () => {
  const { colorScheme } = useColorScheme();
  const c = themeColors(colorScheme);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(`${BASE_URL}/_api/homepage/data`);
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      const payload = data.json || data;
      setTeachers(payload.popularTeachers || []);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-paper dark:bg-night"
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={c.page}
      />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}>
        <View className="px-5 pt-6 pb-5">
          <Text className="text-[28px] leading-9 font-extrabold text-ink dark:text-white">
            1:1 with teachers
          </Text>
          <Text className="mt-2 text-[15px] leading-6 text-ink-soft dark:text-night-soft">
            Booking a one-on-one session is coming soon. Until then, open a
            teacher&apos;s profile to see their courses, tests and notes.
          </Text>
        </View>

        {loading ? (
          <View className="py-16 items-center">
            <ActivityIndicator color={c.ink} />
          </View>
        ) : failed ? (
          <View className="mx-5 p-5 rounded-2xl bg-sand dark:bg-night-raised">
            <Text className="text-ink dark:text-white font-semibold">
              Teachers could not be loaded.
            </Text>
            <Text className="mt-1 text-ink-soft dark:text-night-soft">
              Check your connection and try again.
            </Text>
            <TouchableOpacity
              onPress={load}
              className="mt-4 self-start px-5 py-2.5 rounded-xl bg-ink dark:bg-paper"
            >
              <Text className="font-bold text-white dark:text-ink">
                Try again
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="mx-5 rounded-3xl bg-white dark:bg-night-raised border border-line dark:border-night-line overflow-hidden">
            {teachers.map((t, i) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => router.push(`/expert/${t.slug}` as any)}
                activeOpacity={0.7}
                className={`flex-row items-center px-4 py-4 ${
                  i > 0 ? "border-t border-line dark:border-night-line" : ""
                }`}
              >
                <Image
                  source={{
                    uri:
                      t.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(t.displayName)}&background=EFE8DD&color=2D2A24`,
                  }}
                  className="w-12 h-12 rounded-full bg-sand"
                />
                <View className="flex-1 ml-3">
                  <View className="flex-row items-center">
                    <Text
                      numberOfLines={1}
                      className="shrink text-base font-bold text-ink dark:text-white"
                    >
                      {t.displayName}
                    </Text>
                    {t.isVerified && (
                      <MaterialIcons
                        name="verified"
                        size={15}
                        color="#2E7D5B"
                        style={{ marginLeft: 4 }}
                      />
                    )}
                  </View>
                  {!!t.tagline && (
                    <Text
                      numberOfLines={1}
                      className="mt-0.5 text-sm text-ink-soft dark:text-night-soft"
                    >
                      {t.tagline}
                    </Text>
                  )}
                </View>
                <Feather name="chevron-right" size={18} color={c.inkSoft} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
      <BottomTabs />
    </SafeAreaView>
  );
};

export default OneOnOne;
