import { Directory, File, Paths } from "expo-file-system";

/**
 * Study notes a student saved for offline reading, for the notes whose
 * teacher allows downloads. Each file sits in
 * documents/notes/<userId>/<productId>[-<fileId>]/<title>.pdf, so another
 * account on the same device never opens it and the title is the name other
 * apps show.
 */
const NOTES_FOLDER = "notes";
const PARTIAL_SUFFIX = ".part";

const userFolder = (userId: number) =>
  new Directory(Paths.document, NOTES_FOLDER, String(userId));

export const savedNoteFolder = (
  userId: number,
  productId: number,
  fileId?: number,
) =>
  new Directory(
    userFolder(userId),
    fileId != null ? `${productId}-${fileId}` : String(productId),
  );

export const savedNoteFilename = (title: string) => {
  const base = title
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return `${base || "study-note"}.pdf`;
};

export const partialNoteFile = (folder: Directory) =>
  new File(folder, `download${PARTIAL_SUFFIX}`);

export const findSavedNote = (
  userId: number | null | undefined,
  productId: number,
  fileId?: number,
): File | null => {
  if (userId == null) return null;
  try {
    const folder = savedNoteFolder(userId, productId, fileId);
    if (!folder.exists) return null;
    const saved = folder
      .list()
      .find(
        (entry): entry is File =>
          entry instanceof File &&
          entry.name.toLowerCase().endsWith(".pdf") &&
          entry.size > 0,
      );
    return saved ?? null;
  } catch {
    return null;
  }
};

export const removeSavedNote = (
  userId: number,
  productId: number,
  fileId?: number,
) => {
  const folder = savedNoteFolder(userId, productId, fileId);
  if (folder.exists) folder.delete();
};

export const clearSavedNotes = () => {
  const root = new Directory(Paths.document, NOTES_FOLDER);
  if (root.exists) root.delete();
};
