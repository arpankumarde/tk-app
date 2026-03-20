import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AntDesign } from "@expo/vector-icons";
import Header from "@/components/Header";
import BottomTabs from "@/components/BottomTabs";
import { useColorScheme } from "nativewind";
import { Link, router } from "expo-router";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { useAuth } from "@/context/AuthContext";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

const Login = () => {
  const { colorScheme } = useColorScheme();
  const { signInWithGoogle } = useGoogleAuth();
  const { user, setAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.push("/(user)" as any);
    }
  }, [user]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push("/(user)" as any);
    } catch (err) {
      console.error("[LoginScreen] signInWithGoogle threw:", err);
      Alert.alert("Sign-in failed", "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    const trimmed = mobileNumber.trim();
    if (trimmed.length !== 10) {
      Alert.alert("Invalid number", "Please enter a valid 10-digit mobile number.");
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/_api/auth/mobile-login/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: { mobileNumber: trimmed } }),
      });
      const data = await res.json();
      const result = data.json || data;
      if (result.error) {
        const msg = Array.isArray(result.error) ? result.error.map((e: any) => e.message ?? e).join("\n") : String(result.error);
        Alert.alert("Error", msg);
      } else {
        setOtpSent(true);
      }
    } catch (err) {
      console.error("[LoginScreen] sendOtp error:", err);
      Alert.alert("Error", "Failed to send OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.trim().length === 0) {
      Alert.alert("Enter OTP", "Please enter the OTP sent to your mobile.");
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/_api/auth/mobile-login/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: {
          mobileNumber: mobileNumber.trim(),
          otpCode: otp.trim(),
          role: "user",
        } }),
      });
      const data = await res.json();
      const result = data.json || data;
      if (result.error) {
        const msg = Array.isArray(result.error) ? result.error.map((e: any) => e.message ?? e).join("\n") : String(result.error);
        Alert.alert("Verification failed", msg);
      } else if (result.user) {
        const token = result.token || res.headers.get("x-auth-token") || res.headers.get("authorization");
        if (token) {
          await setAuth(result.user, token);
          router.push("/(user)" as any);
        } else {
          Alert.alert("Error", "Logged in but no auth token received.");
        }
      } else {
        Alert.alert("Error", "Unexpected response from server.");
      }
    } catch (err) {
      console.error("[LoginScreen] verifyOtp error:", err);
      Alert.alert("Error", "Failed to verify OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-white dark:bg-slate-900"
    >
      <Header />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-5 py-8">
        <View className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <Text className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">
            Student Login
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-center mb-8 px-4">
            Log in with Google or mobile OTP to access your account
          </Text>

          {/* Google Login */}
          <TouchableOpacity
            className="flex-row items-center justify-center border border-gray-200 dark:border-slate-600 rounded-xl h-14 mb-8"
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <AntDesign
                  name="google"
                  size={24}
                  color={colorScheme === "dark" ? "#fff" : "#4285F4"}
                />
                <Text className="text-primary font-bold ml-3 text-lg">
                  Continue with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center mb-8">
            <View className="flex-1 h-[1px] bg-gray-200 dark:bg-slate-700" />
            <Text className="px-4 text-gray-400 font-bold">OR</Text>
            <View className="flex-1 h-[1px] bg-gray-200 dark:bg-slate-700" />
          </View>

          {/* Form */}
          <View className="mb-8">
            <Text className="text-slate-900 dark:text-white font-bold mb-2 text-lg">
              Mobile Number
            </Text>
            <TextInput
              placeholder="Enter your 10-digit mobile number"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              maxLength={10}
              value={mobileNumber}
              onChangeText={setMobileNumber}
              editable={!otpSent}
              className="border border-gray-200 dark:border-slate-600 rounded-xl h-14 px-4 text-slate-900 dark:text-white text-base bg-gray-50 dark:bg-slate-700/50"
            />
          </View>

          {otpSent && (
            <View className="mb-8">
              <Text className="text-slate-900 dark:text-white font-bold mb-2 text-lg">
                Enter OTP
              </Text>
              <TextInput
                placeholder="Enter OTP"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
                className="border border-gray-200 dark:border-slate-600 rounded-xl h-14 px-4 text-slate-900 dark:text-white text-base bg-gray-50 dark:bg-slate-700/50"
              />
              <TouchableOpacity
                onPress={handleSendOtp}
                disabled={otpLoading}
                className="mt-2"
              >
                <Text className="text-primary font-bold text-sm text-right">
                  Resend OTP
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            className="bg-primary rounded-xl h-14 items-center justify-center shadow-lg shadow-primary mb-6"
            onPress={otpSent ? handleVerifyOtp : handleSendOtp}
            disabled={otpLoading}
          >
            {otpLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-lg font-bold">
                {otpSent ? "Verify OTP" : "Send OTP"}
              </Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center items-center">
            <Text className="text-slate-500 dark:text-slate-400 text-base">
              Don&apos;t have an account?{" "}
            </Text>
            <Link href="/signup" asChild>
              <TouchableOpacity>
                <Text className="text-primary font-bold text-base">
                  Sign up
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
        <View className="h-10" />
      </ScrollView>
      <BottomTabs />
    </SafeAreaView>
  );
};

export default Login;
