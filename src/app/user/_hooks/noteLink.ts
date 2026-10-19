import { isAuthError } from "@/utils/authError";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;
export const NOTE_OPEN_ERROR = "Could not open this file.";
export const NOTE_SIGNED_OUT = "Please sign in again to open this file.";

export type NoteLink = { url: string; expiresAt: number };

/** A refusal from the server, worded for students. */
export class NoteLinkError extends Error {}

/**
 * student/shop/download checks the purchase and returns a signed storage
 * link for the note's PDF, valid for an hour.
 */
export const requestNoteLink = async ({
  token,
  productId,
  fileId,
  onSignedOut,
}: {
  token: string | null;
  productId: number;
  fileId?: number;
  onSignedOut: () => void;
}): Promise<NoteLink> => {
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
      onSignedOut();
      throw new NoteLinkError(NOTE_SIGNED_OUT);
    }
    throw new NoteLinkError(
      typeof payload?.error === "string" && payload.error
        ? payload.error
        : NOTE_OPEN_ERROR,
    );
  }
  if (typeof payload?.downloadUrl !== "string") {
    throw new Error(NOTE_OPEN_ERROR);
  }
  const expiresAt = Date.parse(payload.expiresAt);
  return {
    url: payload.downloadUrl,
    expiresAt: Number.isNaN(expiresAt)
      ? Date.now() + 10 * 60 * 1000
      : expiresAt,
  };
};
