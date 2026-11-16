import BottomTabs from "@/components/BottomTabs";
import {
  CoursesArt,
  DotField,
  NotesStack,
  ProgressTrail,
  TestsArt,
} from "@/components/AccountArt";
import DetailHeader from "@/components/DetailHeader";
import { themeColors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import Feather, {
  type FeatherIconName,
} from "@react-native-vector-icons/feather";
import MaterialIcons from "@react-native-vector-icons/material-icons";
import * as Application from "expo-application";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import {
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEnrolledBundles } from "./_hooks/useEnrolledBundles";
import { useEnrolledCourses } from "./_hooks/useEnrolledCourses";
import { useEnrolledTests } from "./_hooks/useEnrolledTests";
import { usePurchasedProducts } from "./_hooks/usePurchasedProducts";

const version =
  Constants.expoConfig?.version ??
  Application.nativeApplicationVersion ??
  "0.0.0";
const buildNumber =
  (Platform.OS === "android"
    ? Constants.expoConfig?.android?.versionCode
    : Constants.expoConfig?.ios?.buildNumber) ??
  Application.nativeBuildVersion ??
  "—";

const FOREST = "#26352D";
const FOREST_SOFT = "#B9C8BD";

function MenuRow({
  icon,
  label,
  detail,
  onPress,
  last,
}: {
  icon: FeatherIconName;
  label: string;
  detail?: string;
  onPress: () => void;
  last?: boolean;
}) {
  const { colorScheme } = useColorScheme();
  const c = themeColors(colorScheme);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`flex-row items-center px-5 py-4 ${
        last ? "" : "border-b border-line dark:border-night-line"
      }`}
    >
      <Feather name={icon} size={20} color={c.ink} />
      <View className="flex-1 ml-4">
        <Text className="text-[16px] font-semibold text-ink dark:text-white">
          {label}
        </Text>
        {!!detail && (
          <Text className="mt-0.5 text-sm text-ink-soft dark:text-night-soft">
            {detail}
          </Text>
        )}
      </View>
      <Feather name="chevron-right" size={20} color={c.inkSoft} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, token, loading: authLoading, logout } = useAuth();
  const { colorScheme } = useColorScheme();

  const { loading: loadingCourses, total: totalCourses } =
    useEnrolledCourses(token);

  const {
    tests: enrolledTests,
    loading: loadingTests,
    total: totalTests,
  } = useEnrolledTests(token);

  const { loading: loadingProducts, total: totalProducts } =
    usePurchasedProducts(token, { limit: 5 });

  const { loading: loadingBundles, total: totalBundles } =
    useEnrolledBundles(token);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user]);

  if (!user) return null;

  const handleLogout = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const completedTests = enrolledTests.reduce(
    (sum, t) => sum + (t.completedItems || 0),
    0,
  );
  const count = (loading: boolean, value: number) =>
    loading ? "-" : String(value);
  const initials =
    (user.displayName || "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "T";

  const openSupport = () => {
    let message = `Hello, I need help. I'm ${user?.displayName || "a user"}.`;
    if (user?.email) message += ` Email: ${user.email}`;
    const supportUrl = process.env.EXPO_PUBLIC_SUPPORT_URL;
    Linking.openURL(`${supportUrl}?text=${encodeURIComponent(message)}`);
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-paper dark:bg-night"
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />
      <DetailHeader title="My account" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-4 pt-5">
          <View className="rounded-[28px] bg-sage-tint dark:bg-night-raised">
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => router.push("/user/profile")}
              className="rounded-[28px] overflow-hidden"
              style={{ backgroundColor: FOREST }}
            >
              <View className="absolute right-0 top-0">
                <DotField />
              </View>
              <View className="flex-row items-center px-5 pt-5">
                {user.avatarUrl ? (
                  <Image
                    source={{ uri: user.avatarUrl }}
                    className="w-12 h-12 rounded-2xl"
                  />
                ) : (
                  <View className="w-12 h-12 rounded-2xl bg-sage-tint items-center justify-center">
                    <Text className="text-base font-bold text-sage">
                      {initials}
                    </Text>
                  </View>
                )}
                <Text
                  numberOfLines={1}
                  className="flex-1 ml-4 text-[26px] font-bold text-white"
                >
                  {user.displayName || "Student"}
                </Text>
                <Feather name="chevron-right" size={22} color="#FFFFFF" />
              </View>

              <View
                className="mx-5 mt-5 border-t border-dashed"
                style={{ borderColor: "#5D7566" }}
              />

              <View className="flex-row px-5 pt-4 pb-5">
                <View className="flex-1 pr-3">
                  <Text className="text-sm" style={{ color: FOREST_SOFT }}>
                    Phone number
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Text
                      numberOfLines={1}
                      className="text-[15px] font-semibold text-white"
                    >
                      {user.mobileNumber
                        ? `+91 ${user.mobileNumber}`
                        : "Not added"}
                    </Text>
                    {user.mobileVerified && (
                      <MaterialIcons
                        name="verified"
                        size={15}
                        color="#A9C4AF"
                        style={{ marginLeft: 4 }}
                      />
                    )}
                  </View>
                </View>
                <View
                  className="w-px my-1"
                  style={{ backgroundColor: "#5D7566" }}
                />
                <View className="flex-1 pl-4">
                  <Text className="text-sm" style={{ color: FOREST_SOFT }}>
                    Email
                  </Text>
                  <Text
                    numberOfLines={1}
                    className="mt-1 text-[15px] font-semibold text-white"
                  >
                    {user.email || "Not added"}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/user/tests")}
              className="flex-row items-center pl-5 h-[84px] overflow-hidden"
            >
              <View className="absolute bottom-0" style={{ right: 84 }}>
                <ProgressTrail />
              </View>
              <View className="flex-row items-center flex-1">
                <Text className="text-[16px] font-semibold text-sage dark:text-sage-light">
                  Tests completed
                </Text>
                <View className="ml-2 w-6 h-6 rounded-full bg-sage items-center justify-center">
                  <Feather name="arrow-right" size={14} color="#FFFFFF" />
                </View>
              </View>
              <Text className="w-[84px] pr-6 text-right text-[44px] font-light text-ink dark:text-white">
                {count(loadingTests, completedTests)}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row mt-6" style={{ gap: 12 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/user/tests")}
              className="flex-1 h-[148px] rounded-3xl bg-sand dark:bg-night-raised overflow-hidden"
            >
              <View className="px-4 pt-4">
                <Text className="text-[17px] font-semibold text-ink dark:text-white">
                  My tests
                </Text>
                <Text className="mt-0.5 text-sm text-ink-soft dark:text-night-soft">
                  {count(loadingTests, totalTests)} enrolled
                </Text>
              </View>
              <View className="absolute right-0 bottom-0">
                <TestsArt />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/user/courses")}
              className="flex-1 h-[148px] rounded-3xl bg-sand dark:bg-night-raised overflow-hidden"
            >
              <View className="px-4 pt-4">
                <Text className="text-[17px] font-semibold text-ink dark:text-white">
                  My courses
                </Text>
                <Text className="mt-0.5 text-sm text-ink-soft dark:text-night-soft">
                  {count(loadingCourses, totalCourses)} enrolled
                </Text>
              </View>
              <View className="absolute right-0 bottom-0">
                <CoursesArt />
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/user/products")}
            className="mt-3 flex-row items-center rounded-3xl border border-line dark:border-night-line bg-white dark:bg-night-raised px-5 py-4"
          >
            <View className="flex-1">
              <Text className="text-[17px] font-semibold text-ink dark:text-white">
                My notes
              </Text>
              <Text className="mt-0.5 text-sm text-ink-soft dark:text-night-soft">
                {count(loadingProducts, totalProducts)} purchased
              </Text>
            </View>
            <NotesStack />
          </TouchableOpacity>

          <Text className="mt-9 mb-3 px-1 text-[22px] font-bold text-ink dark:text-white">
            Purchases
          </Text>
          <View className="rounded-3xl border border-line dark:border-night-line bg-white dark:bg-night-raised overflow-hidden">
            <MenuRow
              icon="shopping-bag"
              label="Orders"
              detail="Payments and receipts"
              onPress={() => router.push("/user/orders")}
            />
            <MenuRow
              icon="package"
              label="Bundles"
              detail={
                loadingBundles
                  ? undefined
                  : totalBundles > 0
                    ? `${totalBundles} owned`
                    : "Courses, tests and notes together"
              }
              onPress={() => router.push("/user/bundles" as any)}
            />
            <MenuRow
              icon="gift"
              label="Coupons"
              detail="Rewards from Spin and Win"
              onPress={() => router.push("/user/coupons" as any)}
            />
            <MenuRow
              icon="credit-card"
              label="Wallet"
              detail="Balance, T-coins and withdrawals"
              onPress={() => router.push("/user/wallet")}
              last
            />
          </View>

          <Text className="mt-9 mb-3 px-1 text-[22px] font-bold text-ink dark:text-white">
            Account
          </Text>
          <View className="rounded-3xl border border-line dark:border-night-line bg-white dark:bg-night-raised overflow-hidden">
            <MenuRow
              icon="user"
              label="Edit profile"
              detail="Name, bio and mobile number"
              onPress={() => router.push("/user/profile")}
            />
            <MenuRow
              icon="headphones"
              label="Help and support"
              detail="Chat with us on WhatsApp"
              onPress={openSupport}
            />
            <MenuRow
              icon="info"
              label="About Testkart"
              onPress={() => router.push("/about" as any)}
              last
            />
          </View>

          <TouchableOpacity
            onPress={handleLogout}
            className="mt-6 h-14 rounded-2xl border border-line dark:border-night-line flex-row items-center justify-center"
          >
            <Feather name="log-out" size={18} color="#B42318" />
            <Text className="ml-2 text-base font-bold text-[#B42318] dark:text-[#F97066]">
              Sign out
            </Text>
          </TouchableOpacity>

          <View className="items-center pt-8">
            <Text className="text-ink-soft dark:text-night-soft text-xs">
              Version {version} (Build {buildNumber})
            </Text>
            <Text className="text-ink-soft dark:text-night-soft text-xs mt-1">
              © {new Date().getFullYear()} Testkart. Made with care for learners
              across India.
            </Text>
          </View>
        </View>
      </ScrollView>

      <BottomTabs />
    </SafeAreaView>
  );
}
