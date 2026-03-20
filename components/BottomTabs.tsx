import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { Link, usePathname, useSegments } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";

const BottomTabs = () => {
  const { colorScheme } = useColorScheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const segments = useSegments();

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (user) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, [user]);

  const tabs = [
    { name: "Courses", icon: "book", href: "/courses" },
    { name: "Tests", icon: "file-text", href: "/tests" },
    { name: "Live", icon: "radio", badge: true, href: "/live" },
    { name: "Shop", icon: "shopping-bag", href: "/shop" },
    {
      name: isLoggedIn ? "Dashboard" : "Login",
      icon: isLoggedIn ? "user" : "user-plus",
      isProfile: isLoggedIn,
      href: isLoggedIn ? "/(user)" : "/login",
    },
  ];

  return (
    <View
      style={{ paddingBottom: Math.max(insets?.bottom ?? 0, 12) }}
      className="flex-row bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 pb-2 pt-3 justify-around items-center"
    >
      {tabs.map((tab, index) => {
        const href = tab.href;
        let isActive = false;

        // More robust active state detection
        if (tab.isProfile) {
          isActive = (segments as string[]).includes("(user)");
        } else {
          isActive =
            pathname === href || (href !== "/" && pathname.startsWith(href));
        }

        return (
          <Link href={href as any} key={index} asChild>
            <TouchableOpacity className="items-center justify-center flex-1 active:opacity-70">
              <View className="items-center justify-center">
                {tab.isProfile && isLoggedIn ? (
                  user?.avatarUrl ? (
                    <View
                      className={`w-7 h-7 rounded-full overflow-hidden border-2 ${isActive ? "border-primary" : "border-gray-200 dark:border-slate-700"}`}
                    >
                      <Image
                        source={{ uri: user.avatarUrl }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    </View>
                  ) : (
                    <Feather
                      name="user"
                      size={24}
                      color={
                        isActive
                          ? "#FF8A50"
                          : colorScheme === "dark"
                            ? "#94a3b8"
                            : "#64748b"
                      }
                    />
                  )
                ) : (
                  <Feather
                    name={tab.icon as any}
                    size={24}
                    color={
                      isActive
                        ? "#FF8A50"
                        : colorScheme === "dark"
                          ? "#94a3b8"
                          : "#64748b"
                    }
                  />
                )}
                {tab.badge && (
                  <View className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white dark:border-slate-900" />
                )}
              </View>
              <Text
                className={`text-[11px] mt-1 font-bold ${isActive ? "text-primary" : colorScheme === "dark" ? "text-slate-500" : "text-slate-400"}`}
              >
                {tab.name}
              </Text>
            </TouchableOpacity>
          </Link>
        );
      })}
    </View>
  );
};

export default BottomTabs;
