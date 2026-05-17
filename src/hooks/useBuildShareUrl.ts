import * as Application from "expo-application";
import { useAuth } from "@/context/AuthContext";

export const useBuildShareUrl = () => {
  const { user } = useAuth();
  const campaign = user?.role ?? "guest";

  return (url: string) => {
    const separator = url.includes("?") ? "&" : "?";
    const source = Application.applicationId ?? "testkart";
    const params = `utm_source=${encodeURIComponent(source)}&utm_medium=share&utm_campaign=${campaign}`;
    return `${url}${separator}${params}`;
  };
};
