import BottomTabs from "@/components/BottomTabs";
import DetailHeader from "@/components/DetailHeader";
import Feather from "@react-native-vector-icons/feather";
import * as Application from "expo-application";
import Constants from "expo-constants";
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
      className="flex-1 bg-paper dark:bg-night"
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />
      <DetailHeader title="About" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* App identity */}
        <View className="items-center px-6 pt-6 pb-2">
          <View className="w-24 h-24 rounded-3xl overflow-hidden border border-line dark:border-night-line">
            <Image
              source={require("@/assets/images/icon.png")}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>
          <Text className="text-2xl font-extrabold text-ink dark:text-white mt-4">
            Testkart
          </Text>
          <Text className="text-ink-soft dark:text-night-soft font-bold text-sm mt-1">
            Version {version} (Build {buildNumber})
          </Text>
        </View>

        {/* About description */}
        <View className="px-6 pt-6">
          <View className="bg-white dark:bg-night rounded-2xl border border-line dark:border-night-line p-5">
            <Text className="text-lg font-extrabold text-ink dark:text-white mb-3">
              About Testkart
            </Text>
            <Text className="text-ink-soft dark:text-night-soft font-medium text-[15px] leading-6">
              Testkart is your all-in-one learning companion - browse expert-led
              courses, attempt mock tests, join live classes, and shop curated
              study notes, all from a single app. Track your enrollments,
              progress, and orders, and learn anytime, anywhere.
            </Text>
          </View>
        </View>

        {/* Links */}
        <View className="px-6 pt-6">
          <View className="bg-white dark:bg-night rounded-2xl border border-line dark:border-night-line overflow-hidden shadow-sm">
            {links.map((link, index) => (
              <TouchableOpacity
                key={link.label}
                onPress={link.onPress}
                className={`flex-row items-center p-5 active:bg-sand dark:active:bg-night-line ${
                  index < links.length - 1
                    ? "border-b border-line dark:border-night-line"
                    : ""
                }`}
              >
                <View className="w-11 h-11 rounded-2xl bg-clay-tint dark:bg-night-raised items-center justify-center mr-4">
                  <Feather name={link.icon as any} size={20} color="#FF8A50" />
                </View>
                <Text className="flex-1 text-ink dark:text-night-soft font-bold text-base">
                  {link.label}
                </Text>
                <Feather name="chevron-right" size={20} color="#B5AEA3" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View className="items-center px-6 pt-8">
          <Text className="text-ink-soft dark:text-night-soft font-bold text-xs">
            © {new Date().getFullYear()} Testkart. All rights reserved.
          </Text>
          <Text className="text-ink-soft dark:text-night-soft font-medium text-[11px] mt-1">
            Made with care for learners across India.
          </Text>
        </View>
      </ScrollView>

      <BottomTabs />
    </SafeAreaView>
  );
}
