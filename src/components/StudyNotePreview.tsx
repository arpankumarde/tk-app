import Feather from "@react-native-vector-icons/feather";
import { Image } from "expo-image";
import { useColorScheme } from "nativewind";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;
const LOAD_ERROR = "This preview page could not be loaded.";

export interface StudyNoteFileSummary {
  id: number;
  title: string;
  pageCount: number | null;
  fileSizeBytes: number | null;
  orderIndex: number;
}

interface PreviewPage {
  page: number;
  totalPages: number;
  imageUrl: string;
  width: number;
  height: number;
}

type PageResult = { data: PreviewPage } | { error: string };

// Same contract as the web ProductPDFPreview: shop/preview-page returns one server-rendered
// image per page, so the paid PDF itself never reaches the app.
const fetchPreviewPage = async (
  productId: number,
  page: number,
  fileId?: number,
): Promise<PageResult> => {
  const fileQuery = fileId ? `&fileId=${fileId}` : "";
  try {
    const response = await fetch(
      `${BASE_URL}/_api/shop/preview-page?productId=${productId}&page=${page}${fileQuery}`,
    );
    const data = await response.json();
    const payload = data.json || data;
    if (!response.ok || !payload?.imageUrl) {
      return {
        error: typeof payload?.error === "string" ? payload.error : LOAD_ERROR,
      };
    }
    return { data: payload };
  } catch {
    return { error: LOAD_ERROR };
  }
};

export default function StudyNotePreview({
  productId,
  previewPages,
  files,
}: {
  productId: number;
  previewPages: number;
  files: StudyNoteFileSummary[];
}) {
  const [fileIndex, setFileIndex] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [results, setResults] = useState<Record<string, PageResult>>({});
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [imageAttempt, setImageAttempt] = useState(0);
  const requested = useRef(new Set<string>());
  const { colorScheme } = useColorScheme();
  const accentColor = colorScheme === "dark" ? "#FDBA74" : "#903209";
  const mutedColor = colorScheme === "dark" ? "#94A3B8" : "#64748B";

  // The first file is the product's main file, which the endpoint previews when fileId is omitted.
  const selectedFile = files[fileIndex];
  const fileId =
    fileIndex > 0 && selectedFile && selectedFile.id > 0
      ? selectedFile.id
      : undefined;
  const fileKey = String(fileId ?? 0);
  const pageKey = `${fileKey}:${pageNumber}`;

  const result = results[pageKey];
  const previewPage = result && "data" in result ? result.data : null;
  const pageError = result && "error" in result ? result.error : null;
  const imageFailed = !!previewPage && failedUrl === previewPage.imageUrl;
  const isLoading =
    !result ||
    (!!previewPage && !imageFailed && loadedUrl !== previewPage.imageUrl);

  const totalPages =
    totals[fileKey] ??
    Math.max(
      1,
      Math.min(previewPages, selectedFile?.pageCount || previewPages),
    );

  useEffect(() => {
    const load = (page: number, prefetchImage: boolean) => {
      const key = `${fileKey}:${page}`;
      if (requested.current.has(key)) return;
      requested.current.add(key);
      fetchPreviewPage(productId, page, fileId).then((next) => {
        if ("data" in next) {
          setTotals((prev) => ({ ...prev, [fileKey]: next.data.totalPages }));
          if (prefetchImage) {
            Image.prefetch(next.data.imageUrl).catch(() => {});
          }
        }
        setResults((prev) => ({ ...prev, [key]: next }));
      });
    };

    if (!result) {
      load(pageNumber, false);
    }
    if (previewPage && pageNumber < previewPage.totalPages) {
      load(pageNumber + 1, true);
    }
  }, [productId, fileId, fileKey, pageNumber, result, previewPage]);

  const selectFile = (index: number) => {
    setFileIndex(index);
    setPageNumber(1);
  };

  const retry = () => {
    setFailedUrl(null);
    setImageAttempt((attempt) => attempt + 1);
    if (pageError) {
      requested.current.delete(pageKey);
      setResults((prev) => {
        const next = { ...prev };
        delete next[pageKey];
        return next;
      });
    }
  };

  const navButton = (
    label: string,
    icon: "chevron-left" | "chevron-right",
    disabled: boolean,
    onPress: () => void,
  ) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${label} page`}
      accessibilityState={{ disabled }}
      className={`h-11 px-4 rounded-xl border flex-row items-center justify-center ${
        disabled
          ? "border-slate-200 dark:border-slate-700"
          : "border-orange-300 dark:border-orange-400"
      }`}
    >
      {icon === "chevron-left" && (
        <Feather
          name={icon}
          size={18}
          color={disabled ? mutedColor : accentColor}
        />
      )}
      <Text
        className={`font-bold text-sm mx-1 ${
          disabled
            ? "text-slate-500 dark:text-slate-400"
            : "text-[#903209] dark:text-orange-300"
        }`}
      >
        {label}
      </Text>
      {icon === "chevron-right" && (
        <Feather
          name={icon}
          size={18}
          color={disabled ? mutedColor : accentColor}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-white dark:bg-slate-900">
      {files.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="grow-0 border-b border-gray-200 dark:border-slate-700"
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}
        >
          {files.map((file, index) => {
            const selected = index === fileIndex;
            return (
              <TouchableOpacity
                key={`${file.id}-${index}`}
                onPress={() => selectFile(index)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                className={`px-4 py-2 rounded-full border mr-2 ${
                  selected
                    ? "bg-[#903209] border-[#903209]"
                    : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                }`}
              >
                <Text
                  numberOfLines={1}
                  className={`text-sm font-bold max-w-[220px] ${
                    selected
                      ? "text-white"
                      : "text-slate-700 dark:text-slate-200"
                  }`}
                >
                  {file.title || `File ${index + 1}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <Text className="px-4 pt-3 pb-2 text-sm font-medium text-slate-600 dark:text-slate-300">
        Showing {totalPages} preview {totalPages === 1 ? "page" : "pages"}
      </Text>

      <ScrollView
        className="flex-1 bg-slate-100 dark:bg-slate-950"
        contentContainerStyle={{ padding: 12, flexGrow: 1 }}
      >
        {pageError || imageFailed ? (
          <View className="flex-1 items-center justify-center px-8 py-16">
            <Feather name="alert-circle" size={32} color="#DC2626" />
            <Text className="text-slate-700 dark:text-slate-200 text-center text-sm font-medium mt-3">
              {pageError || LOAD_ERROR}
            </Text>
            <TouchableOpacity
              onPress={retry}
              accessibilityRole="button"
              className="mt-4 h-10 px-5 rounded-xl border border-orange-300 dark:border-orange-400 items-center justify-center"
            >
              <Text className="text-[#903209] dark:text-orange-300 font-bold text-sm">
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View
            className="w-full bg-white rounded-md overflow-hidden"
            style={{
              aspectRatio: previewPage
                ? previewPage.width / previewPage.height
                : 1 / 1.414,
            }}
          >
            {previewPage && (
              <Image
                key={`${previewPage.imageUrl}-${imageAttempt}`}
                source={{ uri: previewPage.imageUrl }}
                contentFit="contain"
                accessibilityLabel={`Preview page ${previewPage.page} of ${previewPage.totalPages}`}
                style={{ width: "100%", height: "100%" }}
                onLoad={() => setLoadedUrl(previewPage.imageUrl)}
                onError={() => setFailedUrl(previewPage.imageUrl)}
              />
            )}
            {isLoading && (
              <View className="absolute inset-0 items-center justify-center bg-slate-100 dark:bg-slate-950">
                <ActivityIndicator size="large" color="#FF8A50" />
                <Text className="text-slate-600 dark:text-slate-300 text-sm font-medium mt-3">
                  Loading preview...
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View className="flex-row items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-slate-700">
        {navButton("Previous", "chevron-left", pageNumber <= 1, () =>
          setPageNumber((page) => page - 1),
        )}
        <Text className="text-slate-700 dark:text-slate-200 font-bold text-sm">
          Page {pageNumber} of {totalPages}
        </Text>
        {navButton("Next", "chevron-right", pageNumber >= totalPages, () =>
          setPageNumber((page) => page + 1),
        )}
      </View>
    </View>
  );
}
