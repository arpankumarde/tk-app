import { useCallback, useEffect, useRef, useState } from "react";
import { Directory, Paths } from "expo-file-system";
import { useAuth } from "@/context/AuthContext";
import type { DocumentPageImage } from "@/components/DocumentViewer";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;
const PAGE_ERROR = "This page could not be loaded.";
const OPEN_ERROR = "Could not open this file.";

// Pages scrolled far out of view are evicted by the reader and asked for again
// on the way back, so a few are kept; the rest would only hold memory.
const PAGE_CACHE_SIZE = 12;

export interface NoteReaderInfo {
  title: string;
  totalPages: number;
  width: number;
  height: number;
}

const readError = async (response: Response, fallback: string) => {
  try {
    const data = await response.json();
    const payload = data?.json || data;
    if (typeof payload?.error === "string" && payload.error) return payload.error;
  } catch {
    // Not JSON - fall through to the generic message.
  }
  return fallback;
};

// The page arrives as a WebP that needs the bearer token, so the WebView cannot
// load it by URL. It is handed over as a data URL instead, with the type set
// explicitly because React Native's blob type can come back empty.
const toWebpDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const comma = result.indexOf(",");
      if (comma < 0) {
        reject(new Error(PAGE_ERROR));
        return;
      }
      resolve(`data:image/webp;base64${result.slice(comma)}`);
    };
    reader.onerror = () => reject(new Error(PAGE_ERROR));
    reader.readAsDataURL(blob);
  });

// Earlier builds downloaded whole study note files into this folder.
const clearLegacyDownloads = () => {
  try {
    const legacy = new Directory(Paths.cache, "downloads");
    if (legacy.exists) legacy.delete();
  } catch {
    // Cache cleanup is best effort.
  }
};

/**
 * Purchased study notes through the same reader as the web: reader/info checks
 * the purchase and returns the page count, reader/page serves each page as a
 * watermarked image. The file itself never reaches the device.
 */
export const useNoteReaderPages = ({
  productId,
  fileId,
}: {
  productId: number;
  fileId?: number;
}) => {
  const { token } = useAuth();
  const [info, setInfo] = useState<NoteReaderInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const pages = useRef(new Map<number, Promise<string>>());

  const query = `type=note&productId=${productId}${fileId != null ? `&fileId=${fileId}` : ""}`;

  useEffect(clearLegacyDownloads, []);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    pages.current.clear();

    (async () => {
      try {
        const response = await fetch(`${BASE_URL}/_api/reader/info?${query}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error(await readError(response, OPEN_ERROR));
        const data = await response.json();
        const payload = data?.json || data;
        if (!payload?.totalPages || !payload?.firstPage) throw new Error(OPEN_ERROR);
        if (!alive) return;
        setInfo({
          title: payload.title,
          totalPages: payload.totalPages,
          width: payload.firstPage.width,
          height: payload.firstPage.height,
        });
      } catch (err: any) {
        if (!alive) return;
        console.error("Note reader open error:", err?.message, err);
        setError(err?.message || OPEN_ERROR);
      }
    })();

    return () => {
      alive = false;
    };
  }, [token, query, attempt]);

  const fetchPage = useCallback(
    async (page: number) => {
      const response = await fetch(
        `${BASE_URL}/_api/reader/page?${query}&page=${page}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) throw new Error(await readError(response, PAGE_ERROR));
      return toWebpDataUrl(await response.blob());
    },
    [token, query],
  );

  const loadPage = useCallback(
    async (page: number): Promise<DocumentPageImage> => {
      if (!info) throw new Error(OPEN_ERROR);
      const cache = pages.current;
      let request = cache.get(page);
      if (request) {
        cache.delete(page);
      } else {
        request = fetchPage(page);
        // Drop failures so a retry asks the server again.
        request.catch(() => cache.delete(page));
      }
      cache.set(page, request);
      while (cache.size > PAGE_CACHE_SIZE) {
        cache.delete(cache.keys().next().value as number);
      }
      return {
        url: await request,
        width: info.width,
        height: info.height,
        totalPages: info.totalPages,
      };
    },
    [info, fetchPage],
  );

  const retry = useCallback(() => {
    setInfo(null);
    setError(null);
    setAttempt((value) => value + 1);
  }, []);

  return {
    info,
    error: token ? error : "Please sign in again to open this file.",
    loadPage,
    retry,
  };
};

export default useNoteReaderPages;
