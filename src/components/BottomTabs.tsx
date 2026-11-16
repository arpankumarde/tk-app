import { themeColors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useCartContext } from "@/context/CartContext";
import Feather, { type FeatherIconName } from "@react-native-vector-icons/feather";
import { router, usePathname, type Href } from "expo-router";
import { useColorScheme } from "nativewind";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabKey = "home" | "mentors" | "cart" | "wallet" | "profile";

type Tab = {
  key: TabKey;
  label: string;
  icon: FeatherIconName;
  href: string;
};

const activeTabFor =(pathname: string): TabKey => {
  if (pathname.startsWith("/one-on-one")) return "mentors";
  if (pathname.startsWith("/user/cart")) return "cart";
  if (pathname.startsWith("/user/wallet")) return "wallet";
  if (pathname.startsWith("/user") || pathname.startsWith("/login"))
    return "profile";
  return "home";
};

const BottomTabs = () => {
  const { colorScheme } = useColorScheme();
  const c = themeColors(colorScheme);
  const { user } = useAuth();
  const { itemCount } = useCartContext();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const loggedIn = !!user;
  const active = activeTabFor(pathname);

  const tabs: Tab[] = [
    { key: "home", label: "Home", icon: "home", href: "/" },
    { key: "mentors", label: "1:1", icon: "users", href: "/one-on-one" },
    {
      key: "cart",
      label: "Cart",
      icon: "shopping-bag",
      href: loggedIn ? "/user/cart" : "/login",
    },
    ...(loggedIn
      ? [
          {
            key: "wallet" as const,
            label: "Wallet",
            icon: "credit-card" as const,
            href: "/user/wallet",
          },
        ]
      : []),
    {
      key: "profile",
      label: loggedIn ? "Profile" : "Log in",
      icon: "user",
      href: loggedIn ? "/user" : "/login",
    },
  ];

  const go = (tab: Tab) => {
    if (tab.key === active && pathname === tab.href) return;
    if (pathname !== "/") router.dismissTo("/(main)" as Href);
    if (tab.href !== "/") router.push(tab.href as Href);
  };

  return (
    <View
      style={{ paddingBottom: Math.max(insets.bottom, 10) }}
      className="flex-row bg-white dark:bg-night-raised border-t border-line dark:border-night-line pt-2"
    >
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        const showAvatar = tab.key === "profile" && loggedIn && user?.avatarUrl;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => go(tab)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={
              tab.key === "cart" && itemCount > 0
                ? `Cart, ${itemCount} items`
                : tab.label
            }
            activeOpacity={0.7}
            className="flex-1 items-center"
          >
            <View
              className={`w-14 h-8 rounded-full items-center justify-center ${
                isActive ? "bg-sand dark:bg-night-line" : ""
              }`}
            >
              {showAvatar ? (
                <View
                  className={`w-6 h-6 rounded-full overflow-hidden border ${
                    isActive ? "border-ink dark:border-white" : "border-line dark:border-night-line"
                  }`}
                >
                  <Image
                    source={{ uri: user!.avatarUrl! }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>
              ) : (
                <Feather
                  name={tab.icon}
                  size={21}
                  color={isActive ? c.ink : c.inkSoft}
                />
              )}
              {tab.key === "cart" && itemCount > 0 && (
                <View className="absolute -top-1 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary-deep items-center justify-center border-2 border-white dark:border-night-raised">
                  <Text className="text-white text-[10px] font-bold">
                    {itemCount > 9 ? "9+" : itemCount}
                  </Text>
                </View>
              )}
            </View>
            <Text
              className={`mt-1 text-[11px] ${
                isActive
                  ? "font-bold text-ink dark:text-white"
                  : "font-medium text-ink-soft dark:text-night-soft"
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default BottomTabs;
