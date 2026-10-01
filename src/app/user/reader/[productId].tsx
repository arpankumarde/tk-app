import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { router, useLocalSearchParams } from "expo-router";
import Feather from "@react-native-vector-icons/feather";
import { usePreventScreenCapture } from "expo-screen-capture";
import DocumentViewer from "@/components/DocumentViewer";
import ReaderHeader from "@/components/ReaderHeader";
import { useNoteReaderPages } from "../_hooks/useNoteReaderPages";

export default function ProductReaderScreen() {
  const { productId, fileId, title } = useLocalSearchParams<{
    productId: string;
    fileId?: string;
    title?: string;
  }>();
  usePreventScreenCapture("study-note-reader");
  const { colorScheme } = useColorScheme();

  const { info, error, loadPage, retry } = useNoteReaderPages({
    productId: Number(productId),
    fileId: fileId ? Number(fileId) : undefined,
  });

  const heading = title || info?.title || "Reading";

  const renderBody = () => {
    if (error) {
      return (
        <View className="flex-1 items-center justify-center px-8">
          <Feather name="alert-circle" size={36} color="#DC2626" />
          <Text className="mt-4 text-center text-base font-black text-slate-800 dark:text-white">
            {error}
          </Text>
          <TouchableOpacity
            onPress={retry}
            className="mt-5 flex-row items-center rounded-2xl bg-primary px-6 py-3"
          >
            <Feather name="refresh-cw" size={14} color="#fff" />
            <Text className="ml-2 text-sm font-black text-white">Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!info) {
      // The first open of a large file renders its first page on the server,
      // which can take a few seconds.
      return (
        <View className="flex-1 items-center justify-center px-10">
          <ActivityIndicator size="large" color="#FF8A50" />
          <Text className="mt-4 text-sm font-black text-slate-700 dark:text-white">
            Preparing your file...
          </Text>
        </View>
      );
    }

    return <DocumentViewer source={{ kind: "pages", loadPage }} />;
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-white dark:bg-slate-950"
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />

      <ReaderHeader title={heading} onClose={() => router.back()} />

      {renderBody()}
    </SafeAreaView>
  );
}
