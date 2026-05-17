import ForceUpdate from "@/components/ForceUpdate";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { EnrollmentProvider } from "@/context/EnrollmentContext";
import { useForceUpdate } from "@/hooks/useForceUpdate";
import * as Clarity from "@microsoft/react-native-clarity";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../../global.css";

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
        <EnrollmentProvider>
          <CartProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </CartProvider>
        </EnrollmentProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
