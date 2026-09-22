import { useRef, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import DocumentViewer, {
  type DocumentPageImage,
} from "@/components/DocumentViewer";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;
const LOAD_ERROR = "This preview page could not be loaded.";

export interface StudyNoteFileSummary {
  id: number;
  title: string;
  pageCount: number | null;
  fileSizeBytes: number | null;
  orderIndex: number;
}

// shop/preview-page returns one server-rendered image per page, so the paid PDF
// itself never reaches the app. A page is rendered on first request, so a cold
// page can take a few seconds.
const fetchPreviewPage = async (
  productId: number,
  page: number,
  fileId?: number,
): Promise<DocumentPageImage> => {
  const fileQuery = fileId ? `&fileId=${fileId}` : "";
  let payload: any;
  let ok = false;
  try {
    const response = await fetch(
      `${BASE_URL}/_api/shop/preview-page?productId=${productId}&page=${page}${fileQuery}`,
    );
    const data = await response.json();
    payload = data.json || data;
    ok = response.ok;
  } catch {
    throw new Error(LOAD_ERROR);
  }
  if (!ok || !payload?.imageUrl) {
    throw new Error(
      typeof payload?.error === "string" ? payload.error : LOAD_ERROR,
    );
  }
  return {
    url: payload.imageUrl,
    width: payload.width,
    height: payload.height,
    totalPages: payload.totalPages,
  };
};

/** Preview pages in the same reader as purchased notes, one scrolling document per file. */
export default function StudyNotePreview({
  productId,
  files,
}: {
  productId: number;
  files: StudyNoteFileSummary[];
}) {
  const [fileIndex, setFileIndex] = useState(0);
  const cache = useRef(new Map<string, Promise<DocumentPageImage>>());

  // The first file is the product's main file, which the endpoint previews when fileId is omitted.
  const selectedFile = files[fileIndex];
  const fileId =
    fileIndex > 0 && selectedFile && selectedFile.id > 0
      ? selectedFile.id
      : undefined;

  const loadPage = (page: number) => {
    const key = `${fileId ?? 0}:${page}`;
    let request = cache.current.get(key);
    if (!request) {
      request = fetchPreviewPage(productId, page, fileId);
      cache.current.set(key, request);
      // Drop failures so a retry asks the server again.
      request.catch(() => cache.current.delete(key));
    }
    return request;
  };

  return (
    <View className="flex-1 bg-slate-100 dark:bg-slate-950">
      {files.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="grow-0 border-b border-gray-100 bg-white dark:border-slate-800 dark:bg-slate-950"
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}
        >
          {files.map((file, index) => {
            const selected = index === fileIndex;
            return (
              <TouchableOpacity
                key={`${file.id}-${index}`}
                onPress={() => setFileIndex(index)}
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

      <DocumentViewer
        key={fileId ?? 0}
        source={{ kind: "pages", loadPage }}
        endNote="End of preview"
      />
    </View>
  );
}
