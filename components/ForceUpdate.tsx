import { View, Text, TouchableOpacity, Linking, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Application from "expo-application";

const STORE_URL = Platform.select({
  android: `https://play.google.com/store/apps/details?id=${Application.applicationId}`,
  default: "https://testkart.in",
});

export default function ForceUpdate({
  latestVersion,
  currentVersion,
}: {
  latestVersion: string;
  currentVersion: string;
}) {
  const handleUpdate = () => {
    if (STORE_URL) Linking.openURL(STORE_URL);
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      <View className="flex-1 items-center justify-center px-9">
        <View className="mb-8 h-24 w-24 items-center justify-center rounded-[32px] bg-primary">
          <Feather name="download" size={40} color="#fff" />
        </View>

        <Text className="mb-3 text-center text-3xl font-black tracking-tight text-gray-900 dark:text-white">
          Update Required
        </Text>

        <Text className="mb-4 text-center text-[15px] leading-[22px] text-gray-500 dark:text-white/60">
          A new version of Testkart is available.{"\n"}Please update to continue
          using the app.
        </Text>

        <View className="mb-10 rounded-full border border-gray-200 bg-gray-100 px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
          <Text className="text-xs font-medium text-gray-500 dark:text-white/50">
            v{latestVersion} available {"  •  "} Current: v{currentVersion}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleUpdate}
          activeOpacity={0.85}
          className="w-full rounded-2xl bg-primary py-[18px]"
        >
          <Text className="text-center text-[17px] font-semibold tracking-wide text-white">
            Update Now
          </Text>
        </TouchableOpacity>

        <Text className="mt-6 text-center text-xs leading-[18px] text-gray-400 dark:text-white/40">
          This update includes important security fixes{"\n"}and new features
          for a better experience.
        </Text>
      </View>
    </View>
  );
}
