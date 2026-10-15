import { useCallback, useEffect, useRef, useState } from "react";
import { Directory, Paths } from "expo-file-system";
import { useAuth } from "@/context/AuthContext";
import { isAuthError } from "@/utils/authError";
import type { DocumentSource } from "@/components/DocumentViewer";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;
const OPEN_ERROR = "Could not open this file.";
const RANGE_ERROR =
  "Could not load this part of the file. Check your connection and try again.";
const SIGNED_OUT = "Please sign in again to open this file.";

// The first read carries the PDF header and, for most files, the first page.
const INITIAL_BYTES = 512 * 1024;
const READ_ATTEMPTS = 3;
// Links last an hour; one about to expire is renewed before it is used.
const LINK_MARGIN_MS = 60 * 1000;

type RangeSource = Extract<DocumentSource, { kind: "pdfRanges" }>;
type Link = { url: string; expiresAt: number };

const toBase64 = (bytes: Uint8Array) => {
  if (typeof bytes.toBase64 === "function") return bytes.toBase64();
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return btoa(binary);
};

// "bytes 0-524287/73400320" -> 73400320
const totalFromContentRange = (header: string | null) => {
  const total = Number(header?.split("/")[1]);
  return Number.isFinite(total) && total > 0 ? total : null;
};

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
 * Purchased study notes, read straight from the PDF. student/shop/download
 * checks the purchase and returns a signed link valid for an hour; the app
 * reads only the byte ranges pdf.js asks for, so a 100MB file opens about as
 * fast as a small one and nothing is saved on the device. The link stays on
 * the React Native side and is renewed when it expires.
 */
export const useNoteReaderPdf = ({
  productId,
  fileId,
}: {
  productId: number;
  fileId?: number;
}) => {
  const { token, invalidateSession } = useAuth();
  const [source, setSource] = useState<RangeSource | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const link = useRef<Link | null>(null);
  const pendingLink = useRef<Promise<Link> | null>(null);

  useEffect(clearLegacyDownloads, []);

  const requestLink = useCallback(async (): Promise<Link> => {
    const response = await fetch(`${BASE_URL}/_api/student/shop/download`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        json: { productId, ...(fileId != null ? { fileId } : {}) },
      }),
    });
    const data = await response.json().catch(() => null);
    const payload = data?.json || data;
    if (!response.ok) {
      // 403 here means the note is not in this account's purchases.
      if (response.status !== 403 && isAuthError(response.status, payload)) {
        invalidateSession();
        throw new Error(SIGNED_OUT);
      }
      throw new Error(
        typeof payload?.error === "string" && payload.error
          ? payload.error
          : OPEN_ERROR,
      );
    }
    if (typeof payload?.downloadUrl !== "string") throw new Error(OPEN_ERROR);
    const expiresAt = Date.parse(payload.expiresAt);
    return {
      url: payload.downloadUrl,
      expiresAt: Number.isNaN(expiresAt) ? Date.now() + 10 * 60 * 1000 : expiresAt,
    };
  }, [token, productId, fileId, invalidateSession]);

  const getLink = useCallback(
    (renew: boolean): Promise<Link> => {
      const known = link.current;
      if (!renew && known && known.expiresAt - LINK_MARGIN_MS > Date.now()) {
        return Promise.resolve(known);
      }
      if (!pendingLink.current) {
        pendingLink.current = requestLink()
          .then((fresh) => {
            link.current = fresh;
            return fresh;
          })
          .finally(() => {
            pendingLink.current = null;
          });
      }
      return pendingLink.current;
    },
    [requestLink],
  );

  // end is exclusive. A failed read renews the link and tries again, which
  // covers a link that expired while the student was reading.
  const readBytes = useCallback(
    async (begin: number, end: number) => {
      let lastError: unknown = null;
      for (let tries = 0; tries < READ_ATTEMPTS; tries++) {
        const { url } = await getLink(tries > 0);
        try {
          const response = await fetch(url, {
            headers: { Range: `bytes=${begin}-${end - 1}` },
          });
          const buffer = await response.arrayBuffer();
          if (response.status === 206) {
            return {
              bytes: new Uint8Array(buffer),
              total: totalFromContentRange(response.headers.get("content-range")),
            };
          }
          if (response.status === 200) {
            // Storage ignored the range and sent the whole file.
            return {
              bytes: new Uint8Array(buffer).subarray(begin, end),
              total: buffer.byteLength,
            };
          }
          lastError = new Error(`Storage returned ${response.status}`);
        } catch (err) {
          lastError = err;
        }
      }
      console.error("Note reader range error:", begin, end, lastError);
      throw new Error(RANGE_ERROR);
    },
    [getLink],
  );

  useEffect(() => {
    if (!token) return;
    let alive = true;
    link.current = null;

    (async () => {
      try {
        const first = await readBytes(0, INITIAL_BYTES);
        if (!first.total) throw new Error(OPEN_ERROR);
        if (!alive) return;
        setSource({
          kind: "pdfRanges",
          length: first.total,
          initial: toBase64(first.bytes),
          readRange: async (begin, end) =>
            toBase64((await readBytes(begin, end)).bytes),
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
  }, [token, readBytes, attempt]);

  const retry = useCallback(() => {
    setSource(null);
    setError(null);
    setAttempt((value) => value + 1);
  }, []);

  return {
    source,
    error: token ? error : SIGNED_OUT,
    retry,
  };
};

export default useNoteReaderPdf;
