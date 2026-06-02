import BottomTabs from "@/components/BottomTabs";
import Header from "@/components/Header";
import Feather from "@react-native-vector-icons/feather";
import * as Application from "expo-application";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import {
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

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL ?? "https://testkart.in";
const SUPPORT_URL = process.env.EXPO_PUBLIC_SUPPORT_URL;

const withUtm = (url: string, content: string) => {
  const separator = url.includes("?") ? "&" : "?";
  const source = Application.applicationId ?? "testkart";
  const params = `utm_source=${encodeURIComponent(source)}&utm_medium=app&utm_campaign=about_page&utm_content=${content}`;
  return `${url}${separator}${params}`;
};

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

type LinkRow = {
  icon: string;
  label: string;
  onPress: () => void;
};

export default function AboutScreen() {
  const { colorScheme } = useColorScheme();

  const links: LinkRow[] = [
    {
      icon: "globe",
      label: "Visit Website",
      onPress: () => Linking.openURL(withUtm(BASE_URL, "website")),
    },
    {
      icon: "shield",
      label: "Privacy Policy",
      onPress: () => Linking.openURL(withUtm(`${BASE_URL}/privacy`, "privacy")),
    },
    {
      icon: "file-text",
      label: "Terms of Service",
      onPress: () => Linking.openURL(withUtm(`${BASE_URL}/terms`, "terms")),
    },
    {
      icon: "headphones",
      label: "Help & Support",
      onPress: () => {
        if (SUPPORT_URL) Linking.openURL(SUPPORT_URL);
      },
    },
  ];

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-white dark:bg-slate-950"
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />
      <Header />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Back */}
        <View className="px-6 pt-6 pb-2 flex-row items-center">
          <TouchableOpacity
            onPress={() =>
              router.canGoBack() ? router.back() : router.push("/")
            }
            className="w-10 h-10 rounded-full bg-gray-50 dark:bg-slate-800 items-center justify-center"
          >
            <Feather
              name="arrow-left"
              size={20}
              color={colorScheme === "dark" ? "#FFFFFF" : "#1A1A1A"}
            />
          </TouchableOpacity>
        </View>

        {/* App identity */}
        <View className="items-center px-6 pt-6 pb-2">
          <View className="w-24 h-24 rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-800">
            <Image
              source={require("@/assets/images/icon.png")}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>
          <Text className="text-2xl font-black text-slate-800 dark:text-white mt-4">
            Testkart
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1">
            Version {version} (Build {buildNumber})
          </Text>
        </View>

        {/* About description */}
        <View className="px-6 pt-6">
          <View className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5">
            <Text className="text-lg font-black text-slate-800 dark:text-white mb-3">
              About Testkart
            </Text>
            <Text className="text-slate-600 dark:text-slate-300 font-medium text-[15px] leading-6">
              Testkart is your all-in-one learning companion - browse expert-led
              courses, attempt mock tests, join live classes, and shop curated
              study notes, all from a single app. Track your enrollments,
              progress, and orders, and learn anytime, anywhere.
            </Text>
          </View>
        </View>

        {/* Links */}
        <View className="px-6 pt-6">
          <View className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm">
            {links.map((link, index) => (
              <TouchableOpacity
                key={link.label}
                onPress={link.onPress}
                className={`flex-row items-center p-5 active:bg-slate-50 dark:active:bg-slate-800/50 ${
                  index < links.length - 1
                    ? "border-b border-gray-50 dark:border-slate-800"
                    : ""
                }`}
              >
                <View className="w-11 h-11 rounded-2xl bg-orange-50 dark:bg-orange-900/20 items-center justify-center mr-4">
                  <Feather name={link.icon as any} size={20} color="#FF8A50" />
                </View>
                <Text className="flex-1 text-slate-700 dark:text-slate-200 font-bold text-base">
                  {link.label}
                </Text>
                <Feather name="chevron-right" size={20} color="#CBD5E1" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View className="items-center px-6 pt-8">
          <Text className="text-slate-400 dark:text-slate-500 font-bold text-xs">
            © {new Date().getFullYear()} Testkart. All rights reserved.
          </Text>
          <Text className="text-slate-300 dark:text-slate-600 font-medium text-[11px] mt-1">
            Made with care for learners across India.
          </Text>
        </View>
      </ScrollView>

      <BottomTabs />
    </SafeAreaView>
  );
}
