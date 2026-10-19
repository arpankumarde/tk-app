import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Platform } from "react-native";
import { File, Paths } from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import * as Sharing from "expo-sharing";
import { useAuth } from "@/context/AuthContext";
import {
  findSavedNote,
  partialNoteFile,
  removeSavedNote,
  savedNoteFilename,
  savedNoteFolder,
} from "@/utils/savedNotes";
import { NoteLinkError, requestNoteLink } from "./noteLink";

const SAVE_ERROR =
  "Could not save this note. Check your connection and free space, then try again.";
const NO_SPACE = "There is not enough free space on this device to save this note.";
const PDF_MIME = "application/pdf";
// Intent.FLAG_GRANT_READ_URI_PERMISSION
const GRANT_READ = 1;

/**
 * Saves a purchased study note on the device for offline reading and hands
 * it to other apps. Only offered for notes whose teacher allows downloads;
 * the reader picks the saved copy up by itself.
 */
export const useNoteDownload = ({
  productId,
  fileId,
  title,
  sizeBytes,
}: {
  productId: number;
  fileId?: number;
  title: string;
  sizeBytes?: number | null;
}) => {
  const { token, user, invalidateSession } = useAuth();
  const userId = user?.id ?? null;
  const [saved, setSaved] = useState<File | null>(() =>
    findSavedNote(userId, productId, fileId),
  );
  // 0..1 while saving, null when idle.
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const download = useRef<AbortController | null>(null);

  useEffect(() => () => download.current?.abort(), []);

  const save = useCallback(async () => {
    if (userId == null || !token || download.current) return;
    if (sizeBytes && sizeBytes > Paths.availableDiskSpace) {
      setError(NO_SPACE);
      return;
    }

    const controller = new AbortController();
    download.current = controller;
    setError(null);
    setProgress(0);

    const folder = savedNoteFolder(userId, productId, fileId);
    const partial = partialNoteFile(folder);
    try {
      const { url } = await requestNoteLink({
        token,
        productId,
        fileId,
        onSignedOut: invalidateSession,
      });
      folder.create({ intermediates: true, idempotent: true });
      // Android can leave a partial file behind on failure, so the note only
      // gets its real name once every byte is on disk.
      await File.downloadFileAsync(url, partial, {
        idempotent: true,
        signal: controller.signal,
        onProgress: ({ bytesWritten, totalBytes }) => {
          if (totalBytes > 0) setProgress(bytesWritten / totalBytes);
        },
      });
      await partial.move(new File(folder, savedNoteFilename(title)), {
        overwrite: true,
      });
      setSaved(findSavedNote(userId, productId, fileId));
    } catch (err: any) {
      try {
        if (partial.exists) partial.delete();
      } catch {
        // Leftover partial files are harmless and overwritten next time.
      }
      if (!controller.signal.aborted) {
        console.error("Note save error:", err?.message, err);
        setError(err instanceof NoteLinkError ? err.message : SAVE_ERROR);
      }
    } finally {
      download.current = null;
      setProgress(null);
    }
  }, [userId, token, productId, fileId, title, sizeBytes, invalidateSession]);

  const cancel = useCallback(() => {
    download.current?.abort();
  }, []);

  const share = useCallback(async () => {
    if (!saved) return;
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert("Not available", "Sharing is not available on this device.");
      return;
    }
    try {
      await Sharing.shareAsync(saved.uri, {
        mimeType: PDF_MIME,
        UTI: "com.adobe.pdf",
        dialogTitle: title,
      });
    } catch (err: any) {
      console.error("Note share error:", err?.message, err);
    }
  }, [saved, title]);

  // Android opens the note straight in a PDF app (or asks which one); iOS has
  // no such intent, so its share sheet lists the apps that can open it.
  const openWith = useCallback(async () => {
    if (!saved) return;
    if (Platform.OS === "android") {
      try {
        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: saved.contentUri,
          type: PDF_MIME,
          flags: GRANT_READ,
        });
        return;
      } catch (err: any) {
        console.warn("No app opened the note:", err?.message);
      }
    }
    await share();
  }, [saved, share]);

  const remove = useCallback(() => {
    if (userId == null) return;
    try {
      removeSavedNote(userId, productId, fileId);
    } catch (err: any) {
      console.error("Note remove error:", err?.message, err);
    }
    setSaved(findSavedNote(userId, productId, fileId));
  }, [userId, productId, fileId]);

  return { saved, progress, error, save, cancel, openWith, share, remove };
};

export default useNoteDownload;
