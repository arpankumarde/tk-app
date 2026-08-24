import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import Feather from "@react-native-vector-icons/feather";
import { useColorScheme } from "nativewind";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import {
  buildReaderHtml,
  PDF_CHUNK_SIZE,
  type PdfReaderMessage,
} from "@/utils/pdfjs";

// pdf.js is fetched from cdnjs, so a blocked or offline network stalls the
// shell before it can report anything. Fail loudly instead of hanging.
const ENGINE_TIMEOUT_MS = 20000;

interface PdfViewerProps {
  base64: string;
  onError?: (message: string) => void;
}

const PdfViewer = ({ base64, onError }: PdfViewerProps) => {
  const { colorScheme } = useColorScheme();
  const webViewRef = useRef<WebView>(null);
  const sentRef = useRef(false);

  const [loaded, setLoaded] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const isDark = colorScheme === "dark";
  // Pinned for the life of the component. Rebuilding the shell would reload the
  // WebView and strip the bytes we have already pushed into it.
  const [html] = useState(() =>
    buildReaderHtml({
      background: colorScheme === "dark" ? "#0f172a" : "#f1f5f9",
    }),
  );

  const fail = useCallback(
    (message: string) => {
      setError(message);
      onError?.(message);
    },
    [onError],
  );

  useEffect(() => {
    if (loaded || error) return;
    const timer = setTimeout(() => {
      if (!sentRef.current) {
        fail("Could not load the reader. Check your connection and try again.");
      }
    }, ENGINE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [loaded, error, fail, attempt]);

  const pushDocument = useCallback(async () => {
    if (sentRef.current) return;
    sentRef.current = true;

    for (let start = 0; start < base64.length; start += PDF_CHUNK_SIZE) {
      const chunk = base64.slice(start, start + PDF_CHUNK_SIZE);
      // Base64 has no quote or backslash characters, so a plain literal is safe.
      webViewRef.current?.injectJavaScript(`window.tkChunk('${chunk}');true;`);
      // Yield between chunks so a large file does not block the JS thread.
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    webViewRef.current?.injectJavaScript("window.tkEnd();true;");
  }, [base64]);

  const handleMessage = (event: WebViewMessageEvent) => {
    let message: PdfReaderMessage;
    try {
      message = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }

    switch (message.type) {
      case "READY":
        pushDocument();
        break;
      case "LOADED":
        setTotalPages(message.totalPages);
        setLoaded(true);
        break;
      case "PAGE_CHANGED":
        setPage(message.page);
        break;
      case "ERROR":
        fail(message.message);
        break;
    }
  };

  const retry = () => {
    sentRef.current = false;
    setError(null);
    setLoaded(false);
    setTotalPages(0);
    setPage(1);
    setAttempt((value) => value + 1);
  };

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-100 px-8 dark:bg-slate-950">
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

  return (
    <View className="flex-1 bg-slate-100 dark:bg-slate-950">
      <WebView
        key={attempt}
        ref={webViewRef}
        source={{ html }}
        onMessage={handleMessage}
        originWhitelist={["about:blank"]}
        onShouldStartLoadWithRequest={(request) =>
          request.url === "about:blank" || request.url.startsWith("data:")
        }
        setSupportMultipleWindows={false}
        javaScriptCanOpenWindowsAutomatically={false}
        allowFileAccess={false}
        allowFileAccessFromFileURLs={false}
        allowUniversalAccessFromFileURLs={false}
        allowsLinkPreview={false}
        setBuiltInZoomControls={false}
        androidLayerType="hardware"
        overScrollMode="never"
        style={{ flex: 1, backgroundColor: isDark ? "#0f172a" : "#f1f5f9" }}
      />

      {!loaded && (
        <View className="absolute inset-0 items-center justify-center bg-slate-100 dark:bg-slate-950">
          <ActivityIndicator size="large" color="#FF8A50" />
          <Text className="mt-3 text-xs font-bold text-slate-500 dark:text-slate-400">
            Opening...
          </Text>
        </View>
      )}

      {loaded && totalPages > 0 && (
        <View className="absolute bottom-5 self-center rounded-full bg-slate-900/85 px-4 py-1.5 dark:bg-slate-700">
          <Text className="text-xs font-black text-white">
            {page} / {totalPages}
          </Text>
        </View>
      )}
    </View>
  );
};

export default PdfViewer;
