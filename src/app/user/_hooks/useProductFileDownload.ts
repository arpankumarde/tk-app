import { useCallback, useEffect, useRef, useState } from "react";
import { Directory, File, Paths } from "expo-file-system";
import { useAuth } from "@/context/AuthContext";
import { getMimeFromName, isImageName, isPdfName } from "@/utils/mimeTypes";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

/**
 * Above this the base64 round trip into the WebView costs more memory than a
 * low-end device can spare, so the file falls back to the external handoff.
 */
export const MAX_INLINE_BYTES = 25 * 1024 * 1024;

export type ProductFileKind = "pdf" | "image" | "other";

export type ProductFileState =
  | "idle"
  | "downloading"
  | "reading"
  | "ready"
  | "error";

interface UseProductFileDownloadArgs {
  productId: number;
  fileId?: number;
}

const safeFileName = (downloadUrl: string) => {
  const path = downloadUrl.split("?")[0];
  const raw = path.split("/").pop() || "file";
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // A malformed escape sequence just means we keep the raw segment.
  }
  return decoded.replace(/[/\\]/g, "_") || "file";
};

export const useProductFileDownload = ({
  productId,
  fileId,
}: UseProductFileDownloadArgs) => {
  const { token } = useAuth();

  const [state, setState] = useState<ProductFileState>("idle");
  const [progress, setProgress] = useState<number | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [kind, setKind] = useState<ProductFileKind>("other");
  const [mime, setMime] = useState<string>("*/*");
  const [uti, setUti] = useState<string | undefined>(undefined);
  const [base64, setBase64] = useState<string | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [contentUri, setContentUri] = useState<string | null>(null);
  const [sizeBytes, setSizeBytes] = useState<number | null>(null);
  const [oversized, setOversized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    if (!token) {
      setState("error");
      setError("Please sign in again to open this file.");
      return;
    }

    setState("downloading");
    setProgress(null);
    setError(null);
    setBase64(null);
    setOversized(false);

    let destination: File | null = null;

    try {
      const response = await fetch(`${BASE_URL}/_api/student/shop/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          json: fileId != null ? { productId, fileId } : { productId },
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const payload = data.json || data;
      const downloadUrl: string | undefined = payload.downloadUrl;

      if (!downloadUrl) throw new Error("Download link not available.");

      const name = safeFileName(downloadUrl);

      // Namespaced per file so two products whose URLs end in the same segment
      // cannot serve each other's content out of the cache.
      const folder = new Directory(
        Paths.cache,
        "downloads",
        `${productId}-${fileId ?? "single"}`,
      );
      folder.create({ intermediates: true, idempotent: true });

      const finalFile = new File(folder, name);
      let file: File;

      if (finalFile.exists && finalFile.size > 0) {
        file = finalFile;
      } else {
        if (finalFile.exists) finalFile.delete();

        // Download to a scratch name and only adopt it once the transfer has
        // finished, so a killed download cannot become a permanent cache hit.
        const partial = new File(folder, `${name}.part`);
        destination = partial;
        if (partial.exists) partial.delete();

        let lastPercent = -1;
        await File.downloadFileAsync(downloadUrl, partial, {
          idempotent: true,
          onProgress: ({ bytesWritten, totalBytes }) => {
            if (!aliveRef.current || totalBytes <= 0) return;
            const percent = Math.round((bytesWritten / totalBytes) * 100);
            if (percent === lastPercent) return;
            lastPercent = percent;
            setProgress(percent / 100);
          },
        });

        partial.rename(name);
        destination = null;
        file = new File(folder, name);
      }

      if (!aliveRef.current) return;

      const { mime: resolvedMime, uti: resolvedUti } = getMimeFromName(name);
      const resolvedKind: ProductFileKind = isPdfName(name)
        ? "pdf"
        : isImageName(name)
          ? "image"
          : "other";
      const tooBig = file.size > MAX_INLINE_BYTES;

      setFileName(name);
      setMime(resolvedMime);
      setUti(resolvedUti);
      setSizeBytes(file.size);
      setFileUri(file.uri);
      try {
        // Android-only; reading it on other platforms is not guaranteed to work.
        setContentUri(file.contentUri);
      } catch {
        setContentUri(null);
      }
      setOversized(tooBig);
      setKind(tooBig ? "other" : resolvedKind);

      if (resolvedKind === "pdf" && !tooBig) {
        setState("reading");
        const encoded = await file.base64();
        if (!aliveRef.current) return;
        setBase64(encoded);
      }

      setState("ready");
      setProgress(1);
    } catch (err: any) {
      // A half-written file would otherwise be a permanent cache hit.
      try {
        if (destination?.exists) destination.delete();
      } catch {
        // Nothing useful to do if the cleanup itself fails.
      }
      if (!aliveRef.current) return;
      console.error("Product file open error:", err?.message, err);
      setState("error");
      setError(err?.message || "Could not open this file.");
    }
  }, [token, productId, fileId]);

  useEffect(() => {
    run();
  }, [run, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return {
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
  };
};

export default useProductFileDownload;
