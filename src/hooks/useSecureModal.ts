import { useCallback, useEffect, useState } from "react";
import {
  allowScreenCaptureAsync,
  preventScreenCaptureAsync,
} from "expo-screen-capture";

/**
 * Visibility for a Modal whose content must not be screenshotted or recorded.
 * An Android Modal is its own window and copies FLAG_SECURE from the activity
 * only when it opens, so the flag is set before the Modal becomes visible;
 * calling usePreventScreenCapture inside the Modal would be too late.
 */
export function useSecureModal(key: string) {
  const [visible, setVisible] = useState(false);

  const open = useCallback(async () => {
    try {
      await preventScreenCaptureAsync(key);
    } catch {
      // Unavailable on this platform; open anyway.
    }
    setVisible(true);
  }, [key]);

  const close = useCallback(() => {
    setVisible(false);
    allowScreenCaptureAsync(key).catch(() => {});
  }, [key]);

  useEffect(
    () => () => {
      allowScreenCaptureAsync(key).catch(() => {});
    },
    [key],
  );

  return { visible, open, close };
}
