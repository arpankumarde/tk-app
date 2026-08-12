import Header from "@/components/Header";
import TurnstileGate, {
  TurnstileGateHandle,
  TurnstileStatus,
} from "@/components/TurnstileGate";
import { useAuth } from "@/context/AuthContext";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Link, router } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AuthMethod = "mobile" | "email";

const Login = () => {
  const { colorScheme } = useColorScheme();
  const { signInWithGoogle } = useGoogleAuth();
  const { user, setAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<AuthMethod>("mobile");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileStatus, setTurnstileStatus] =
    useState<TurnstileStatus>("pending");
  const turnstileRef = useRef<TurnstileGateHandle>(null);

  // Only holds the send button back while a token is on its way; the server
  // is what enforces Turnstile.
  const awaitingTurnstile = !turnstileToken && turnstileStatus === "pending";

  useEffect(() => {
    if (user) {
      router.replace("/user");
    }
  }, [user]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("[LoginScreen] signInWithGoogle threw:", err);
      Alert.alert("Sign-in failed", "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const switchAuthMethod = (method: AuthMethod) => {
    setAuthMethod(method);
    setOtpSent(false);
    setOtp("");
  };

  const handleSendOtp = async () => {
    if (authMethod === "mobile") {
      const trimmed = mobileNumber.trim();
      if (trimmed.length !== 10) {
        Alert.alert(
          "Invalid number",
          "Please enter a valid 10-digit mobile number.",
        );
        return;
      }
    } else {
      const trimmed = email.trim();
      if (!EMAIL_REGEX.test(trimmed)) {
        Alert.alert("Invalid email", "Please enter a valid email address.");
        return;
      }
    }
    setOtpLoading(true);
    try {
      const endpoint =
        authMethod === "mobile"
          ? `${BASE_URL}/_api/auth/mobile-login/send-otp`
          : `${BASE_URL}/_api/auth/email-login/send-otp`;
      const payload =
        authMethod === "mobile"
          ? {
              mobileNumber: mobileNumber.trim(),
              turnstileToken: turnstileToken ?? undefined,
            }
          : {
              email: email.trim(),
              turnstileToken: turnstileToken ?? undefined,
            };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: payload }),
      });
      const data = await res.json();
      const result = data.json || data;
      if (result.error) {
        const msg = Array.isArray(result.error)
          ? result.error.map((e: any) => e.message ?? e).join("\n")
          : String(result.error);
        Alert.alert("Error", msg);
      } else {
        setOtpSent(true);
      }
    } catch (err) {
      console.error("[LoginScreen] sendOtp error:", err);
      Alert.alert("Error", "Failed to send OTP. Please try again.");
    } finally {
      setOtpLoading(false);
      // Turnstile tokens are single-use - mint a fresh one for the next attempt.
      setTurnstileToken(null);
      turnstileRef.current?.reset();
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.trim().length === 0) {
      Alert.alert(
        "Enter OTP",
        `Please enter the OTP sent to your ${authMethod === "mobile" ? "mobile" : "email"}.`,
      );
      return;
    }
    setOtpLoading(true);
    try {
      const endpoint =
        authMethod === "mobile"
          ? `${BASE_URL}/_api/auth/mobile-login/verify-otp`
          : `${BASE_URL}/_api/auth/email-login/verify-otp`;
      const payload =
        authMethod === "mobile"
          ? {
              mobileNumber: mobileNumber.trim(),
              otpCode: otp.trim(),
              role: "user",
            }
          : {
              email: email.trim(),
              otpCode: otp.trim(),
              role: "user",
            };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: payload }),
      });
      const data = await res.json();
      const result = data.json || data;
      if (result.error) {
        const msg = Array.isArray(result.error)
          ? result.error.map((e: any) => e.message ?? e).join("\n")
          : String(result.error);
        Alert.alert("Verification failed", msg);
      } else if (result.user) {
        const token =
          result.token ||
          res.headers.get("x-auth-token") ||
          res.headers.get("authorization");
        if (token) {
          await setAuth(result.user, token);
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
      className="flex-1 bg-white dark:bg-slate-950"
    >
      <Header />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }}
          className="px-6 py-10"
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center mb-10">
            <View className="w-12 h-1 bg-orange-500 rounded-full mb-4" />
            <Text className="text-2xl font-black text-slate-800 dark:text-white mb-2 text-center uppercase tracking-tight">
              Student Login
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 text-sm font-bold text-center px-10">
              Log in with Google, mobile OTP, or email OTP
            </Text>
          </View>

          {/* Google Login */}
          <TouchableOpacity
            className="flex-row items-center justify-center border border-gray-100 dark:border-slate-800 rounded-2xl h-14 mb-8 bg-white dark:bg-slate-900 shadow-sm"
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator
                color={colorScheme === "dark" ? "#fff" : "#000"}
              />
            ) : (
              <>
                <Ionicons
                  name="logo-google"
                  size={24}
                  color={colorScheme === "dark" ? "#fff" : "#000"}
                />
                <Text className="text-slate-900 dark:text-white font-bold ml-3 text-lg">
                  Continue with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center mb-8">
            <View className="flex-1 h-[1px] bg-gray-100 dark:bg-slate-800" />
            <Text className="px-4 text-gray-400 font-bold uppercase tracking-widest text-[10px]">
              OR
            </Text>
            <View className="flex-1 h-[1px] bg-gray-100 dark:bg-slate-800" />
          </View>

          {/* Auth Method Tabs */}
          <View className="flex-row bg-gray-50 dark:bg-slate-900/50 rounded-2xl p-1 mb-8">
            <TouchableOpacity
              className={`flex-1 h-12 items-center justify-center rounded-xl ${
                authMethod === "mobile" ? "bg-primary" : ""
              }`}
              onPress={() => switchAuthMethod("mobile")}
              disabled={otpLoading}
            >
              <Text
                className={`font-bold ${
                  authMethod === "mobile"
                    ? "text-white"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                Mobile
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 h-12 items-center justify-center rounded-xl ${
                authMethod === "email" ? "bg-primary" : ""
              }`}
              onPress={() => switchAuthMethod("email")}
              disabled={otpLoading}
            >
              <Text
                className={`font-bold ${
                  authMethod === "email"
                    ? "text-white"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                Email
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          {authMethod === "mobile" ? (
            <View className="mb-8">
              <Text className="text-slate-800 dark:text-white font-black mb-3 text-base">
                Mobile Number
              </Text>
              <TextInput
                placeholder="Enter your 10-digit mobile number"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                maxLength={10}
                value={mobileNumber}
                onChangeText={setMobileNumber}
                editable={!otpSent}
                className="border border-gray-100 dark:border-slate-800 rounded-2xl h-16 px-5 text-slate-900 dark:text-white text-lg bg-gray-50 dark:bg-slate-900/50"
              />
            </View>
          ) : (
            <View className="mb-8">
              <Text className="text-slate-800 dark:text-white font-black mb-3 text-base">
                Email Address
              </Text>
              <TextInput
                placeholder="Enter your email address"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                editable={!otpSent}
                className="border border-gray-100 dark:border-slate-800 rounded-2xl h-16 px-5 text-slate-900 dark:text-white text-lg bg-gray-50 dark:bg-slate-900/50"
              />
            </View>
          )}

          {otpSent && (
            <View className="mb-8">
              <Text className="text-slate-800 dark:text-white font-black mb-3 text-base">
                Enter OTP
              </Text>
              <TextInput
                placeholder="Enter OTP"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
                maxLength={authMethod === "mobile" ? 4 : 6}
                value={otp}
                onChangeText={setOtp}
                className="border border-gray-100 dark:border-slate-800 rounded-2xl h-16 px-5 text-slate-900 dark:text-white text-lg bg-gray-50 dark:bg-slate-900/50"
              />
              <TouchableOpacity
                onPress={handleSendOtp}
                disabled={otpLoading || awaitingTurnstile}
                className="mt-2"
              >
                <Text className="text-primary font-bold text-sm text-right">
                  Resend OTP
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Bot check for the SMS OTP flow. Invisible unless Cloudflare
              demands an interactive challenge. */}
          <TurnstileGate
            ref={turnstileRef}
            onVerify={setTurnstileToken}
            onExpire={() => setTurnstileToken(null)}
            onStatusChange={setTurnstileStatus}
          />

          {awaitingTurnstile && (
            <Text className="text-slate-400 dark:text-slate-500 text-xs font-bold text-center mb-4">
              Verifying your device...
            </Text>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            className="bg-primary rounded-2xl h-16 items-center justify-center shadow-lg shadow-primary/30 mb-6"
            onPress={otpSent ? handleVerifyOtp : handleSendOtp}
            disabled={otpLoading || (!otpSent && awaitingTurnstile)}
          >
            {otpLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-lg font-bold">
                {otpSent ? "Verify OTP" : "Send OTP"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/(main)" as any)}
            className="h-10 items-center justify-center mb-6"
          >
            <Text className="text-slate-500 dark:text-slate-400 font-bold underline">
              Skip for now
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center items-center mt-4">
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;
