import { useState, useEffect } from "react";
import * as Application from "expo-application";
import Constants from "expo-constants";
import { compareVersions } from "@/utils/compareVersions";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export function useForceUpdate() {
  const [forceUpdate, setForceUpdate] = useState<{
    required: boolean;
    latestVersion: string;
  } | null>(null);

  const currentVersion =
    Constants.expoConfig?.version ??
    Application.nativeApplicationVersion ??
    "0.0.0";

  useEffect(() => {
    fetch(`${BASE_URL}/_api/meta?fields=latestversion,minversion`)
      .then((res) => res.json())
      .then((data) => {
        const payload = data.json || data;
        const needsUpdate = compareVersions(currentVersion, payload.minversion);
        setForceUpdate({
          required: needsUpdate,
          latestVersion: payload.latestversion,
        });
      })
      .catch((error) => {
        console.error("Failed to check for updates: ", error);
        setForceUpdate({ required: false, latestVersion: currentVersion });
      });
  }, [currentVersion]);

  return { forceUpdate, currentVersion };
}
