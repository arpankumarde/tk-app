import { useAuth } from "@/context/AuthContext";
import Feather from "@react-native-vector-icons/feather";
import MaterialIcons from "@react-native-vector-icons/material-icons";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;
const RESEND_COOLDOWN = 30; // seconds, enforced client-side per API docs

// Valid 10-digit Indian mobile (starts 6-9), optionally +91-prefixed.
const MOBILE_REGEX = /^(?:\+91)?[6-9]\d{9}$/;

type Step = "phone" | "otp";

// Pull a user-facing message out of the various error shapes the API may return.
function extractError(payload: any, fallback: string): string {
  if (payload && typeof payload.error === "string") return payload.error;
  if (Array.isArray(payload?.error)) {
    return payload.error
      .map((e: { message?: string }) => e?.message ?? String(e))
      .join("\n");
  }
  if (payload && typeof payload.message === "string") return payload.message;
  return fallback;
}

export default function MobileVerification() {
  const { user, token, refreshSession } = useAuth();
  const { colorScheme } = useColorScheme();

  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<Step>("phone");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Resend cooldown ticker.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  if (!user) return null;

  const openModal = (prefill: string) => {
    setMobileNumber(prefill);
    setOtp("");
    setStep("phone");
    setCooldown(0);
    setVisible(true);
  };

  const closeModal = () => {
    if (sending || verifying) return;
    setVisible(false);
  };

  const handleSendOtp = async () => {
    const trimmed = mobileNumber.trim();
    if (!MOBILE_REGEX.test(trimmed)) {
      Alert.alert(
        "Invalid number",
        "Enter a valid 10-digit mobile number starting with 6-9.",
      );
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`${BASE_URL}/_api/auth/send_otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ json: { mobileNumber: trimmed } }),
      });
      const data = await res.json();
      const payload = data.json || data;

      if (!res.ok || payload?.success === false) {
        Alert.alert("Error", extractError(payload, "Failed to send OTP."));
        return;
      }

      setStep("otp");
      setCooldown(RESEND_COOLDOWN);
    } catch (e) {
      console.error("send_otp error:", e);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.trim();
    if (code.length !== 4) {
      Alert.alert("Invalid OTP", "Enter the 4-digit code sent to your mobile.");
      return;
    }

    setVerifying(true);
    try {
      const res = await fetch(`${BASE_URL}/_api/auth/verify_otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          json: { mobileNumber: mobileNumber.trim(), otpCode: code },
        }),
      });
      const data = await res.json();
      const payload = data.json || data;

      if (!res.ok || payload?.success === false) {
        Alert.alert(
          "Verification failed",
          extractError(payload, "Invalid OTP. Please try again."),
        );
        return;
      }

      await refreshSession();
      setVisible(false);
      Alert.alert("Success", "Mobile number verified successfully.");
    } catch (e) {
      console.error("verify_otp error:", e);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const hasNumber = !!user.mobileNumber;
  const verified = hasNumber && user.mobileVerified;

  return (
    <>
      <View className="flex-row items-center p-5 border-b border-gray-50 dark:border-slate-800">
        <View className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 items-center justify-center mr-4">
          <Feather name="phone" size={18} color="#22C55E" />
        </View>
        <View className="flex-1">
          <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">
            Mobile
          </Text>

          {hasNumber ? (
            <>
              <View className="flex-row items-center">
                <Text className="text-slate-700 dark:text-slate-200 font-bold text-[15px]">
                  {user.mobileNumber}
                </Text>
                {verified ? (
                  <View className="flex-row items-center ml-2">
                    <MaterialIcons name="verified" size={16} color="#22C55E" />
                    <Text className="text-green-600 dark:text-green-400 font-bold text-xs ml-1">
                      Verified
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row items-center ml-2 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                    <Feather name="alert-circle" size={12} color="#F59E0B" />
                    <Text className="text-amber-600 dark:text-amber-400 font-bold text-xs ml-1">
                      Unverified
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-row items-center mt-2">
                {!verified && (
                  <TouchableOpacity
                    onPress={() => openModal(user.mobileNumber ?? "")}
                    className="bg-primary px-3 py-1.5 rounded-lg mr-3"
                  >
                    <Text className="text-white font-bold text-xs">
                      Verify Now
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => openModal("")}>
                  <Text className="text-primary font-bold text-xs">
                    Change Number
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <TouchableOpacity
              onPress={() => openModal("")}
              className="bg-primary self-start px-3 py-1.5 rounded-lg mt-1"
            >
              <Text className="text-white font-bold text-xs">
                Add Mobile Number
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* OTP flow modal */}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-end bg-black/50"
        >
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6 pb-10">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-black text-slate-800 dark:text-white">
                {step === "phone" ? "Mobile Number" : "Verify OTP"}
              </Text>
              <TouchableOpacity
                onPress={closeModal}
                disabled={sending || verifying}
                className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-800 items-center justify-center"
              >
                <Feather
                  name="x"
                  size={18}
                  color={colorScheme === "dark" ? "#94a3b8" : "#64748b"}
                />
              </TouchableOpacity>
            </View>

            {step === "phone" ? (
              <>
                <Text className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">
                  Enter your mobile number
                </Text>
                <TextInput
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  placeholder="10-digit mobile number"
                  placeholderTextColor={
                    colorScheme === "dark" ? "#475569" : "#94a3b8"
                  }
                  keyboardType="phone-pad"
                  maxLength={13}
                  autoFocus
                  editable={!sending}
                  className="bg-gray-50 dark:bg-slate-800 rounded-xl px-4 py-3.5 text-slate-800 dark:text-white font-bold text-base border border-gray-200 dark:border-slate-700"
                />
                <Text className="text-xs text-slate-400 dark:text-slate-500 mt-2 mb-6">
                  We&apos;ll send a 4-digit OTP to verify this number.
                </Text>

                <TouchableOpacity
                  onPress={handleSendOtp}
                  disabled={sending}
                  className={`rounded-2xl py-4 items-center ${
                    sending ? "bg-gray-200 dark:bg-slate-800" : "bg-primary"
                  }`}
                >
                  {sending ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-white font-black text-base">
                      Send OTP
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">
                  Enter the 4-digit OTP sent to{" "}
                  <Text className="text-slate-800 dark:text-white">
                    {mobileNumber.trim()}
                  </Text>
                </Text>
                <TextInput
                  value={otp}
                  onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, ""))}
                  placeholder="• • • •"
                  placeholderTextColor={
                    colorScheme === "dark" ? "#475569" : "#94a3b8"
                  }
                  keyboardType="number-pad"
                  maxLength={4}
                  autoFocus
                  editable={!verifying}
                  className="bg-gray-50 dark:bg-slate-800 rounded-xl px-4 py-3.5 text-slate-800 dark:text-white font-black text-2xl tracking-[8px] text-center border border-gray-200 dark:border-slate-700"
                />

                <View className="flex-row items-center justify-between mt-3 mb-6">
                  <TouchableOpacity
                    onPress={() => {
                      setStep("phone");
                      setOtp("");
                    }}
                    disabled={verifying}
                  >
                    <Text className="text-slate-500 dark:text-slate-400 font-bold text-xs">
                      Change number
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSendOtp}
                    disabled={cooldown > 0 || sending || verifying}
                  >
                    <Text
                      className={`font-bold text-xs ${
                        cooldown > 0
                          ? "text-slate-400 dark:text-slate-600"
                          : "text-primary"
                      }`}
                    >
                      {cooldown > 0
                        ? `Resend OTP in ${cooldown}s`
                        : "Resend OTP"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={handleVerifyOtp}
                  disabled={verifying}
                  className={`rounded-2xl py-4 items-center ${
                    verifying ? "bg-gray-200 dark:bg-slate-800" : "bg-primary"
                  }`}
                >
                  {verifying ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-white font-black text-base">
                      Verify
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
