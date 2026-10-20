import { Alert, Linking, Platform } from "react-native";
import * as IntentLauncher from "expo-intent-launcher";

const WEB_SCHEMES = new Set([
  "http",
  "https",
  "about",
  "data",
  "blob",
  "javascript",
  "file",
  "testkart",
]);

// Payment apps register their own schemes (upi, gpay, phonepe, paytmmp, bhim, credpay, ...)
// and the list keeps growing, so anything that is not a web or internal scheme goes to the OS.
export function isPaymentAppUrl(url: string): boolean {
  const match = /^([a-z][a-z0-9+.-]*):/i.exec(url);
  return !!match && !WEB_SCHEMES.has(match[1].toLowerCase());
}

// Linking.openURL cannot resolve Android "intent://...#Intent;scheme=upi;package=...;end"
// URIs, which is what PayU's UPI app buttons navigate to. Unpack them into a plain
// ACTION_VIEW on the real upi:// URL, pinned to the chosen app when a package is given.
function parseIntentUrl(url: string) {
  const hashIndex = url.indexOf("#Intent;");
  if (hashIndex === -1) return null;
  const body = url.slice("intent://".length, hashIndex);
  const params = Object.fromEntries(
    url
      .slice(hashIndex + "#Intent;".length)
      .split(";")
      .map((part) => {
        const eq = part.indexOf("=");
        return eq === -1 ? [part, ""] : [part.slice(0, eq), part.slice(eq + 1)];
      }),
  );
  return {
    data: `${params.scheme || "upi"}://${body}`,
    packageName: params.package as string | undefined,
  };
}

export async function openPaymentApp(url: string): Promise<void> {
  try {
    if (Platform.OS === "android" && url.startsWith("intent://")) {
      const parsed = parseIntentUrl(url);
      if (parsed) {
        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: parsed.data,
          ...(parsed.packageName ? { packageName: parsed.packageName } : {}),
        });
        return;
      }
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert("App Not Found", "No UPI app found to handle this payment.");
  }
}
