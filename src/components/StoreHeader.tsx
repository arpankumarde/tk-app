import { themeColors, tintColors, type TintName } from "@/constants/theme";
import { setThemePreference } from "@/utils/themePreference";
import Feather, { type FeatherIconName } from "@react-native-vector-icons/feather";
import { router, usePathname, type Href } from "expo-router";
import { useColorScheme } from "nativewind";
import {
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Category = {
  label: string;
  icon: FeatherIconName;
  href: string;
  tint: TintName;
};

const CATEGORIES: Category[] = [
  { label: "All", icon: "grid", href: "/", tint: "sand" },
  { label: "Notes", icon: "book-open", href: "/shop", tint: "wheat" },
  { label: "Mock tests", icon: "clipboard", href: "/tests", tint: "sage" },
  { label: "Live tests", icon: "radio", href: "/live", tint: "clay" },
  { label: "Courses", icon: "play-circle", href: "/courses", tint: "sky" },
  { label: "Bundles", icon: "package", href: "/bundles", tint: "stone" },
];

const isCategoryRoot = (path: string) =>
  CATEGORIES.some((c) => c.href === path);

const openCategory = (current: string, target: string) => {
  if (current === target) return;
  if (target === "/") {
    router.dismissTo("/(main)" as Href);
  } else if (current === "/") {
    router.push(target as Href);
  } else if (isCategoryRoot(current)) {
    router.replace(target as Href);
  } else {
    router.push(target as Href);
  }
};

const StoreHeader = () => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = themeColors(colorScheme);
  const pathname = usePathname();

  return (
    <View className="bg-paper dark:bg-night border-b border-line dark:border-night-line">
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={c.page}
      />
      <View className="flex-row items-center px-4 pt-3">
        <Pressable
          onPress={() => router.push("/search")}
          accessibilityRole="search"
          className="flex-1 h-12 flex-row items-center rounded-2xl px-4 bg-white dark:bg-night-raised border border-line dark:border-night-line"
        >
          <Feather name="search" size={18} color={c.inkSoft} />
          <Text
            numberOfLines={1}
            className="ml-3 flex-1 text-[15px] text-ink-soft dark:text-night-soft"
          >
            Search notes, mock tests, courses
          </Text>
        </Pressable>
        <TouchableOpacity
          onPress={() => setThemePreference(isDark ? "light" : "dark")}
          accessibilityLabel={isDark ? "Use light theme" : "Use dark theme"}
          className="ml-2 w-12 h-12 rounded-2xl items-center justify-center bg-sand dark:bg-night-raised"
        >
          <Feather name={isDark ? "sun" : "moon"} size={19} color={c.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 14 }}
      >
        {CATEGORIES.map((cat) => {
          const active = pathname === cat.href;
          return (
            <TouchableOpacity
              key={cat.href}
              onPress={() => openCategory(pathname, cat.href)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              activeOpacity={0.8}
              className="items-center px-2 pb-3"
            >
              <View
                className={`w-12 h-12 rounded-2xl items-center justify-center ${
                  active ? "bg-ink dark:bg-paper" : ""
                }`}
                style={
                  active
                    ? undefined
                    : { backgroundColor: tintColors(cat.tint, colorScheme).bg }
                }
              >
                <Feather
                  name={cat.icon}
                  size={20}
                  color={
                    active
                      ? isDark
                        ? "#2D2A24"
                        : "#FFFFFF"
                      : tintColors(cat.tint, colorScheme).fg
                  }
                />
              </View>
              <Text
                className={`mt-1.5 text-xs ${
                  active
                    ? "font-bold text-ink dark:text-white"
                    : "font-medium text-ink-soft dark:text-night-soft"
                }`}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default StoreHeader;
