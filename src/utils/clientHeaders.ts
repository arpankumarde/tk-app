import { Platform } from "react-native";
import * as Application from "expo-application";
import * as Device from "expo-device";

/**
 * Headers that tell the server which app, device and OS a request came from.
 * The backend stores them on every order it creates (helpers/orderClientInfo
 * in the Floot project), so send them on each call that can create an order.
 */
let cached: Record<string, string> | null = null;

function deviceTypeName(type: Device.DeviceType | null): string {
  switch (type) {
    case Device.DeviceType.PHONE:
      return "phone";
    case Device.DeviceType.TABLET:
      return "tablet";
    case Device.DeviceType.DESKTOP:
      return "desktop";
    case Device.DeviceType.TV:
      return "tv";
    default:
      return "unknown";
  }
}

export function clientHeaders(): Record<string, string> {
  if (Platform.OS !== "android" && Platform.OS !== "ios") return {};
  if (cached) return cached;

  const headers: Record<string, string> = {
    "X-Client-Platform": Platform.OS,
    "X-Client-Device": deviceTypeName(Device.deviceType),
  };

  const os = [Device.osName, Device.osVersion].filter(Boolean).join(" ");
  if (os) headers["X-Client-OS"] = os;

  const version = Application.nativeApplicationVersion;
  if (version) {
    const build = Application.nativeBuildVersion;
    headers["X-App-Version"] = build ? `${version} (${build})` : version;
  }

  cached = headers;
  return headers;
}
