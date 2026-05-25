import { useEffect, useState } from "react";
import Ionicons from "@react-native-vector-icons/ionicons";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "@/components/Header";
import { useColorScheme } from "nativewind";
import { Link, router } from "expo-router";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { useAuth } from "@/context/AuthContext";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

const Signup = () => {
  const { colorScheme } = useColorScheme();
  const { signInWithGoogle } = useGoogleAuth();
  const { user, setAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.push("/user");
    }
  }, [user]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push("/user");
    } catch (err) {
      console.error("[SignupScreen] signInWithGoogle threw:", err);
      Alert.alert("Sign-up failed", "Please try again.");
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
    if (displayName.trim().length === 0) {
      Alert.alert("Name required", "Please enter your full name.");
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/_api/auth/mobile-signup/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: { mobileNumber: trimmed, role: "student" } }),
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
      console.error("[SignupScreen] sendOtp error:", err);
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
      const res = await fetch(
        `${BASE_URL}/_api/auth/mobile-signup/verify-and-register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ json: {
            mobileNumber: mobileNumber.trim(),
            otpCode: otp.trim(),
            displayName: displayName.trim(),
            role: "student",
          } }),
        },
      );
      const data = await res.json();
      const result = data.json || data;
      if (result.error) {
        const msg = Array.isArray(result.error) ? result.error.map((e: any) => e.message ?? e).join("\n") : String(result.error);
        Alert.alert("Registration failed", msg);
      } else if (result.user) {
        const token = result.token || res.headers.get("x-auth-token") || res.headers.get("authorization");
        if (token) {
          await setAuth(result.user, token);
          router.push("/user");
        } else {
          Alert.alert("Error", "Signed up but no auth token received. Try logging in.");
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
            Create Account
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-sm font-bold text-center px-10">
            Sign up with Google or mobile number to get started
          </Text>
        </View>

          {/* Google Login */}
          <TouchableOpacity
            className="flex-row items-center justify-center border border-gray-100 dark:border-slate-800 rounded-2xl h-14 mb-8 bg-white dark:bg-slate-900 shadow-sm"
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colorScheme === "dark" ? "#fff" : "#000"} />
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
            <Text className="px-4 text-gray-400 font-bold uppercase tracking-widest text-[10px]">OR</Text>
            <View className="flex-1 h-[1px] bg-gray-100 dark:bg-slate-800" />
          </View>

          {/* Form */}
          <View className="mb-6">
            <Text className="text-slate-800 dark:text-white font-black mb-3 text-base">
              Full Name
            </Text>
            <TextInput
              placeholder="Enter your full name"
              placeholderTextColor="#94a3b8"
              value={displayName}
              onChangeText={setDisplayName}
              editable={!otpSent}
              className="border border-gray-100 dark:border-slate-800 rounded-2xl h-16 px-5 text-slate-900 dark:text-white text-lg bg-gray-50 dark:bg-slate-900/50"
            />
          </View>

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

          {otpSent && (
            <View className="mb-8">
              <Text className="text-slate-800 dark:text-white font-black mb-3 text-base">
                Enter OTP
              </Text>
              <TextInput
                placeholder="Enter OTP"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
                className="border border-gray-100 dark:border-slate-800 rounded-2xl h-16 px-5 text-slate-900 dark:text-white text-lg bg-gray-50 dark:bg-slate-900/50"
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
            className="bg-primary rounded-2xl h-16 items-center justify-center shadow-lg shadow-primary/30 mb-6"
            onPress={otpSent ? handleVerifyOtp : handleSendOtp}
            disabled={otpLoading}
          >
            {otpLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-lg font-bold">
                {otpSent ? "Verify & Register" : "Send OTP"}
              </Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center items-center mt-4">
            <Text className="text-slate-500 dark:text-slate-400 text-base">
              Already have an account?{" "}
            </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text className="text-primary font-bold text-base">Login</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Signup;
