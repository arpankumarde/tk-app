import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { Link, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";

const BottomTabs = () => {
  const { colorScheme } = useColorScheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (user) {
      setIsLoggedIn(true);
    }
  }, [user]);

  const tabs = [
    { name: "Courses", icon: "book" },
    { name: "Tests", icon: "file-text" },
    { name: "Live", icon: "radio", badge: true },
    { name: "Shop", icon: "shopping-bag" },
    {
      name: isLoggedIn ? "Profile" : "Login",
      icon: isLoggedIn ? "user" : "user-plus",
      isProfile: isLoggedIn,
    },
  ];

  return (
    <View
      style={{ paddingBottom: Math.max(insets?.bottom ?? 0, 12) }}
      className="flex-row bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 pb-2 pt-3 justify-around items-center"
    >
      {tabs.map((tab, index) => {
        let href = "/";
        if (tab.name === "Login") href = "/login";
        if (tab.name === "Profile") href = "/(user)";
        if (tab.name === "Live") href = "/live";
        if (tab.name === "Courses") href = "/courses";
        if (tab.name === "Tests") href = "/tests";
        if (tab.name === "Shop") href = "/shop";

        let isActive = false;

        if (pathname === href) {
          isActive = true;
        }

        if (pathname === "/" && href === "/" && index !== 0) {
          isActive = false;
        }

        return (
          <Link href={href as any} key={index} asChild>
            <TouchableOpacity className="items-center justify-center flex-1">
              <View className="items-center justify-center">
                {tab.isProfile && isLoggedIn ? (
                  user?.avatarUrl ? (
                    <View
                      className={`w-6 h-6 rounded-full overflow-hidden border ${isActive ? "border-primary" : "border-gray-300"}`}
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
                      size={22}
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
                    size={22}
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
                  <View className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white dark:border-slate-900" />
                )}
              </View>
              <Text
                className={`text-[12px] mt-1 font-medium ${isActive ? "text-primary" : colorScheme === "dark" ? "text-gray-400" : "text-gray-500"}`}
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
