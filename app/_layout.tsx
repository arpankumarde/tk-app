import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import ForceUpdate from "@/components/ForceUpdate";
import { useForceUpdate } from "@/hooks/useForceUpdate";
import * as Clarity from "@microsoft/react-native-clarity";
import Constants, { ExecutionEnvironment } from "expo-constants";

if (Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
  try {
    Clarity.initialize(process.env.EXPO_PUBLIC_CLARITY_ID!);
  } catch (e) {
    console.warn("Clarity failed to initialize:", e);
  }
}

export default function RootLayout() {
  const { forceUpdate, currentVersion } = useForceUpdate();

  if (forceUpdate?.required) {
    return (
      <SafeAreaProvider>
        <ForceUpdate
          latestVersion={forceUpdate.latestVersion}
          currentVersion={currentVersion}
        />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
