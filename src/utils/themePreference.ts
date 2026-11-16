import * as SecureStore from "expo-secure-store";
import { colorScheme } from "nativewind";

const KEY = "theme_preference";

export type ThemePreference = "light" | "dark";

export async function restoreThemePreference(): Promise<void> {
  try {
    const saved = await SecureStore.getItemAsync(KEY);
    if (saved === "light" || saved === "dark") colorScheme.set(saved);
  } catch {
    // Unreadable storage falls back to the device setting.
  }
}

export function setThemePreference(value: ThemePreference): void {
  colorScheme.set(value);
  SecureStore.setItemAsync(KEY, value).catch(() => {});
}
