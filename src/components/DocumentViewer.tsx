import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import Feather from "@react-native-vector-icons/feather";
import { useColorScheme } from "nativewind";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import {
  buildReaderHtml,
  jsArg,
  READER_CHUNK_SIZE,
  type ReaderEngine,
  type ReaderMessage,
} from "@/utils/readerShell";

// pdf.js is fetched from cdnjs, so a blocked or offline network stalls the
// shell before it can report anything. Fail loudly instead of hanging.
const ENGINE_TIMEOUT_MS = 20000;

export interface DocumentPageImage {
  url: string;
  width: number;
  height: number;
  totalPages: number;
}

/**
 * Where the pages come from. Everything else - scrolling, zoom, the page counter -
 * is the same for every source.
 * - `file`: a downloaded PDF or image, pushed into the page as base64.
 * - `pdfUrl`: a PDF pdf.js fetches by URL.
 * - `pages`: one image per page, loaded as the reader scrolls. Reject with an
 *   Error whose message is shown on the failed page.
 */
export type DocumentSource =
  | { kind: "file"; base64: string; mime: string }
  | { kind: "pdfUrl"; url: string }
  | { kind: "pages"; loadPage: (page: number) => Promise<DocumentPageImage> };

const engineFor = (source: DocumentSource): ReaderEngine =>
  source.kind === "pages" ||
  (source.kind === "file" && source.mime.startsWith("image/"))
    ? "images"
    : "pdf";

const errorMessage = (err: unknown, fallback: string) =>
  err instanceof Error && err.message ? err.message : fallback;

interface DocumentViewerProps {
  source: DocumentSource;
  /** Shown below the last page, for example to mark the end of a preview. */
  endNote?: string;
  onError?: (message: string) => void;
}

const DocumentViewer = ({ source, endNote, onError }: DocumentViewerProps) => {
  const { colorScheme } = useColorScheme();
  const webViewRef = useRef<WebView>(null);
  const startedRef = useRef(false);

  const [loaded, setLoaded] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const isDark = colorScheme === "dark";
  // Pinned for the life of the component. Rebuilding the shell would reload the
  // WebView and strip anything already pushed into it. Remount to change source.
  const [html] = useState(() =>
    buildReaderHtml({ engine: engineFor(source), dark: isDark, endNote }),
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
      if (!startedRef.current) {
        fail("Could not load the reader. Check your connection and try again.");
      }
    }, ENGINE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [loaded, error, fail, attempt]);

  const inject = (script: string) => {
    webViewRef.current?.injectJavaScript(`${script};true;`);
  };

  const start = async () => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (source.kind === "file") {
      for (let at = 0; at < source.base64.length; at += READER_CHUNK_SIZE) {
        const chunk = source.base64.slice(at, at + READER_CHUNK_SIZE);
        // Base64 has no quote or backslash characters, so a plain literal is safe.
        inject(`window.tkChunk('${chunk}')`);
        // Yield between chunks so a large file does not block the JS thread.
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      inject(`window.tkEnd(${jsArg(source.mime)})`);
      return;
    }

    if (source.kind === "pdfUrl") {
      inject(`window.tkOpenUrl(${jsArg(source.url)})`);
      return;
    }

    try {
      const first = await source.loadPage(1);
      inject(
        `window.tkInitPages(${first.totalPages}, ${first.width}, ${first.height})`,
      );
    } catch (err) {
      fail(errorMessage(err, "Could not open this file."));
    }
  };

  const supplyPage = async (pageNumber: number) => {
    if (source.kind !== "pages") return;
    try {
      const next = await source.loadPage(pageNumber);
      inject(`window.tkPage(${pageNumber}, ${jsArg(next.url)})`);
    } catch (err) {
      inject(
        `window.tkPageFailed(${pageNumber}, ${jsArg(
          errorMessage(err, "This page could not be loaded."),
        )})`,
      );
    }
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    let message: ReaderMessage;
    try {
      message = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }

    switch (message.type) {
      case "READY":
        start();
        break;
      case "LOADED":
        setTotalPages(message.totalPages);
        setLoaded(true);
        break;
      case "PAGE_CHANGED":
        setPage(message.page);
        break;
      case "NEED_PAGE":
        supplyPage(message.page);
        break;
      case "ERROR":
        fail(message.message);
        break;
    }
  };

  const retry = () => {
    startedRef.current = false;
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
        setBuiltInZoomControls
        setDisplayZoomControls={false}
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

export default DocumentViewer;
