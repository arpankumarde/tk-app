import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useColorScheme } from "nativewind";
import { router, useLocalSearchParams } from "expo-router";
import Feather from "@react-native-vector-icons/feather";
import * as IntentLauncher from "expo-intent-launcher";
import * as Sharing from "expo-sharing";
import PdfViewer from "@/components/PdfViewer";
import {
  MAX_INLINE_BYTES,
  useProductFileDownload,
} from "../_hooks/useProductFileDownload";

const formatSize = (bytes: number | null) => {
  if (!bytes) return null;
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
};

export default function ProductReaderScreen() {
  const { productId, fileId, title } = useLocalSearchParams<{
    productId: string;
    fileId?: string;
    title?: string;
  }>();
  const { colorScheme } = useColorScheme();
  const [handingOff, setHandingOff] = useState(false);

  const {
    state,
    progress,
    fileName,
    kind,
    mime,
    uti,
    base64,
    fileUri,
    contentUri,
    sizeBytes,
    oversized,
    error,
    retry,
  } = useProductFileDownload({
    productId: Number(productId),
    fileId: fileId ? Number(fileId) : undefined,
  });

  const heading = title || fileName || "Reading";

  // Only reached for file types the app has no renderer for. PDFs and images
  // never take this path, so no study note is ever handed to another app.
  const openExternally = async () => {
    if (!fileUri || handingOff) return;
    try {
      setHandingOff(true);
      if (Platform.OS === "android" && contentUri) {
        try {
          await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
            data: contentUri,
            type: mime,
            flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
          });
          return;
        } catch {
          // No viewer registered for this type - fall through to the share sheet.
        }
      }
      await Sharing.shareAsync(fileUri, { mimeType: mime, UTI: uti });
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Could not open this file.");
    } finally {
      setHandingOff(false);
    }
  };

  const renderBody = () => {
    if (state === "error") {
      return (
        <View className="flex-1 items-center justify-center px-8">
          <Feather name="alert-circle" size={36} color="#DC2626" />
          <Text className="mt-4 text-center text-base font-black text-slate-800 dark:text-white">
            {error || "Could not open this file."}
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

    if (state !== "ready") {
      const percent = progress != null ? Math.round(progress * 100) : null;
      return (
        <View className="flex-1 items-center justify-center px-10">
          <ActivityIndicator size="large" color="#FF8A50" />
          <Text className="mt-4 text-sm font-black text-slate-700 dark:text-white">
            Preparing your file...
          </Text>
          <View className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <View
              className="h-full bg-primary"
              style={{ width: `${percent ?? 8}%` }}
            />
          </View>
          {percent != null && (
            <Text className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">
              {percent}%
            </Text>
          )}
        </View>
      );
    }

    if (kind === "pdf" && base64) {
      return <PdfViewer base64={base64} />;
    }

    if (kind === "image" && fileUri) {
      return (
        <View className="flex-1 bg-slate-100 dark:bg-slate-950">
          <Image
            source={{ uri: fileUri }}
            contentFit="contain"
            style={{ flex: 1 }}
          />
        </View>
      );
    }

    const sizeLabel = formatSize(sizeBytes);
    return (
      <View className="flex-1 items-center justify-center px-8">
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Feather name="file" size={28} color="#FF8A50" />
        </View>
        <Text
          className="mt-4 text-center text-base font-black text-slate-800 dark:text-white"
          numberOfLines={2}
        >
          {fileName}
        </Text>
        {sizeLabel && (
          <Text className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
            {sizeLabel}
          </Text>
        )}
        <Text className="mt-4 text-center text-sm font-bold leading-6 text-slate-600 dark:text-slate-300">
          {oversized
            ? `This file is larger than ${MAX_INLINE_BYTES / (1024 * 1024)} MB, so it opens in another app.`
            : "This file type opens in another app."}
        </Text>
        <TouchableOpacity
          onPress={openExternally}
          disabled={handingOff}
          className="mt-5 flex-row items-center rounded-2xl bg-primary px-6 py-3"
        >
          {handingOff ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Feather name="external-link" size={14} color="#fff" />
              <Text className="ml-2 text-sm font-black text-white">Open</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-white dark:bg-slate-950"
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />

      <View className="flex-row items-center border-b border-gray-100 px-4 py-3 dark:border-slate-800">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
        >
          <Feather
            name="arrow-left"
            size={18}
            color={colorScheme === "dark" ? "#fff" : "#1A1A1A"}
          />
        </TouchableOpacity>
        <Text
          className="ml-3 flex-1 text-base font-black text-slate-800 dark:text-white"
          numberOfLines={1}
        >
          {heading}
        </Text>
      </View>

      {renderBody()}
    </SafeAreaView>
  );
}
