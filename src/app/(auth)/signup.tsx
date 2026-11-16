import LoginIllustration from "@/components/LoginIllustration";
import TurnstileGate, {
  TurnstileGateHandle,
  TurnstileStatus,
} from "@/components/TurnstileGate";
import { themeColors } from "@/constants/theme";
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
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AuthMethod = "mobile" | "email";

const Signup = () => {
  const { colorScheme } = useColorScheme();
  const c = themeColors(colorScheme);
  const isDark = colorScheme === "dark";
  const { signInWithGoogle } = useGoogleAuth();
  const { user, setAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<AuthMethod>("mobile");
  const [displayName, setDisplayName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [turnstileStatus, setTurnstileStatus] =
    useState<TurnstileStatus>("pending");
  const turnstileRef = useRef<TurnstileGateHandle>(null);

  // Only holds the send button back while a token is on its way; the server
  // is what enforces Turnstile.
  const awaitingTurnstile = turnstileStatus === "pending";

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
      console.error("[SignupScreen] signInWithGoogle threw:", err);
      Alert.alert("Sign-up failed", "Please try again.");
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
      if (displayName.trim().length === 0) {
        Alert.alert("Name required", "Please enter your full name.");
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
      // Single-use: the first send spends the token minted on mount, and only
      // a later send (a retry or resend) runs a new check.
      const turnstileToken = await turnstileRef.current?.getToken();
      const endpoint =
        authMethod === "mobile"
          ? `${BASE_URL}/_api/auth/mobile-signup/send-otp`
          : `${BASE_URL}/_api/auth/email-signup/send-otp`;
      const payload =
        authMethod === "mobile"
          ? {
              mobileNumber: mobileNumber.trim(),
              role: "student",
              turnstileToken: turnstileToken ?? undefined,
            }
          : {
              email: email.trim(),
              role: "student",
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
      console.error("[SignupScreen] sendOtp error:", err);
      Alert.alert("Error", "Failed to send OTP. Please try again.");
    } finally {
      setOtpLoading(false);
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
          ? `${BASE_URL}/_api/auth/mobile-signup/verify-and-register`
          : `${BASE_URL}/_api/auth/email-login/verify-otp`;
      const payload =
        authMethod === "mobile"
          ? {
              mobileNumber: mobileNumber.trim(),
              otpCode: otp.trim(),
              displayName: displayName.trim(),
              role: "student",
            }
          : {
              email: email.trim(),
              otpCode: otp.trim(),
              role: "student",
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
        Alert.alert("Registration failed", msg);
      } else if (result.user) {
        const token =
          result.token ||
          res.headers.get("x-auth-token") ||
          res.headers.get("authorization");
        if (token) {
          await setAuth(result.user, token);
        } else {
          Alert.alert(
            "Error",
            "Signed up but no auth token received. Try logging in.",
          );
        }
      } else {
        Alert.alert("Error", "Unexpected response from server.");
      }
    } catch (err) {
      console.error("[SignupScreen] verifyOtp error:", err);
      Alert.alert("Error", "Failed to verify OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const inputClass =
    "border border-line dark:border-night-line rounded-2xl h-14 px-5 text-ink dark:text-white text-base bg-white dark:bg-night-raised";

  const tabClass = (active: boolean) =>
    `flex-1 h-11 items-center justify-center rounded-xl ${
      active ? "bg-white dark:bg-night-line" : ""
    }`;

  const tabTextClass = (active: boolean) =>
    active
      ? "font-bold text-ink dark:text-white"
      : "font-semibold text-ink-soft dark:text-night-soft";

  return (
    <SafeAreaView
      edges={["left", "right", "bottom"]}
      className="flex-1 bg-paper dark:bg-night"
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#27322B" : "#E2EBDD"}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SafeAreaView
            edges={["top"]}
            className="bg-sage-tint dark:bg-[#27322B] rounded-b-[32px] overflow-hidden"
          >
            <View className="flex-row justify-end px-5 pt-2">
              <TouchableOpacity
                onPress={() => router.replace("/(main)" as any)}
                accessibilityRole="button"
                className="px-4 h-9 rounded-full bg-white dark:bg-night-raised items-center justify-center"
              >
                <Text className="text-sm font-bold text-ink dark:text-white">
                  Skip
                </Text>
              </TouchableOpacity>
            </View>
            <View className="px-4 pt-1">
              <LoginIllustration height={170} />
            </View>
          </SafeAreaView>

          <View className="px-6 pt-7">
            <Text className="text-[28px] leading-9 font-extrabold text-ink dark:text-white">
              Create your account
            </Text>
            <Text className="mt-2 text-[15px] leading-6 text-ink-soft dark:text-night-soft">
              Save your progress, keep your purchases in one place and attempt
              tests on the web or the app.
            </Text>

            <TouchableOpacity
              className="mt-7 flex-row items-center justify-center border border-line dark:border-night-line rounded-2xl h-14 bg-white dark:bg-night-raised"
              onPress={handleGoogleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={c.ink} />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color={c.ink} />
                  <Text className="text-ink dark:text-white font-bold ml-3 text-base">
                    Continue with Google
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View className="flex-row items-center my-6">
              <View className="flex-1 h-px bg-line dark:bg-night-line" />
              <Text className="px-4 text-ink-soft dark:text-night-soft text-sm">
                or sign up with a one-time code
              </Text>
              <View className="flex-1 h-px bg-line dark:bg-night-line" />
            </View>

            <View className="flex-row bg-sand dark:bg-night-raised rounded-2xl p-1 mb-5">
              <TouchableOpacity
                className={tabClass(authMethod === "mobile")}
                onPress={() => switchAuthMethod("mobile")}
                disabled={otpLoading}
                accessibilityRole="tab"
                accessibilityState={{ selected: authMethod === "mobile" }}
              >
                <Text className={tabTextClass(authMethod === "mobile")}>
                  Mobile
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={tabClass(authMethod === "email")}
                onPress={() => switchAuthMethod("email")}
                disabled={otpLoading}
                accessibilityRole="tab"
                accessibilityState={{ selected: authMethod === "email" }}
              >
                <Text className={tabTextClass(authMethod === "email")}>
                  Email
                </Text>
              </TouchableOpacity>
            </View>

            {authMethod === "mobile" && (
              <View className="mb-5">
                <Text className="text-ink dark:text-white font-semibold mb-2 text-sm">
                  Full name
                </Text>
                <TextInput
                  placeholder="Your name as it should appear"
                  placeholderTextColor={c.inkSoft}
                  value={displayName}
                  onChangeText={setDisplayName}
                  editable={!otpSent}
                  className={inputClass}
                />
              </View>
            )}

            {authMethod === "mobile" ? (
              <View className="mb-5">
                <Text className="text-ink dark:text-white font-semibold mb-2 text-sm">
                  Mobile number
                </Text>
                <TextInput
                  placeholder="10-digit mobile number"
                  placeholderTextColor={c.inkSoft}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  editable={!otpSent}
                  className={inputClass}
                />
              </View>
            ) : (
              <View className="mb-5">
                <Text className="text-ink dark:text-white font-semibold mb-2 text-sm">
                  Email address
                </Text>
                <TextInput
                  placeholder="name@example.com"
                  placeholderTextColor={c.inkSoft}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  editable={!otpSent}
                  className={inputClass}
                />
              </View>
            )}

            {otpSent && (
              <View className="mb-5">
                <Text className="text-ink dark:text-white font-semibold mb-2 text-sm">
                  One-time code
                </Text>
                <TextInput
                  placeholder={
                    authMethod === "mobile" ? "4-digit code" : "6-digit code"
                  }
                  placeholderTextColor={c.inkSoft}
                  keyboardType="number-pad"
                  maxLength={authMethod === "mobile" ? 4 : 6}
                  value={otp}
                  onChangeText={setOtp}
                  className={inputClass}
                />
                <TouchableOpacity
                  onPress={handleSendOtp}
                  disabled={otpLoading || awaitingTurnstile}
                  className="mt-2 self-end"
                >
                  <Text className="text-primary-deep dark:text-primary font-bold text-sm">
                    Resend code
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Bot check for both OTP flows. Invisible unless Cloudflare
                demands an interactive challenge. */}
            <TurnstileGate
              ref={turnstileRef}
              onStatusChange={setTurnstileStatus}
            />

            {awaitingTurnstile && (
              <Text className="text-ink-soft dark:text-night-soft text-xs font-semibold text-center mb-4">
                Verifying your device...
              </Text>
            )}

            <TouchableOpacity
              className="bg-primary-deep rounded-2xl h-14 items-center justify-center"
              onPress={otpSent ? handleVerifyOtp : handleSendOtp}
              disabled={otpLoading || (!otpSent && awaitingTurnstile)}
            >
              {otpLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-base font-bold">
                  {otpSent ? "Verify and create account" : "Send code"}
                </Text>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center items-center mt-8">
              <Text className="text-ink-soft dark:text-night-soft text-[15px]">
                Already have an account?{" "}
              </Text>
              <Link href="/login" asChild>
                <TouchableOpacity>
                  <Text className="text-primary-deep dark:text-primary font-bold text-[15px]">
                    Log in
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Signup;
