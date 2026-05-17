import { useRootNavigationState, Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const rootNavigationState = useRootNavigationState();
  const { user, loading } = useAuth();

  if (!rootNavigationState?.key || loading) return null;

  if (!user) {
    return <Redirect href={"/(auth)/login" as any} />;
  }

  return <Redirect href={"/(main)" as any} />;
}
