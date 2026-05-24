import { useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import Feather from "@react-native-vector-icons/feather";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useBankDetails, BankDetailsInput } from "../../_hooks/useBankDetails";

function maskAccount(num: string) {
  if (!num) return "";
  if (num.length <= 4) return num;
  return `${"•".repeat(Math.max(num.length - 4, 4))}${num.slice(-4)}`;
}

const STATUS_STYLE: Record<
  "pending" | "verified" | "rejected",
  {
    label: string;
    bg: string;
    text: string;
    icon: keyof typeof Feather.glyphMap;
  }
> = {
  pending: {
    label: "Pending Verification",
    bg: "#FEF3C7",
    text: "#B45309",
    icon: "clock",
  },
  verified: {
    label: "Verified",
    bg: "#DCFCE7",
    text: "#15803D",
    icon: "check-circle",
  },
  rejected: {
    label: "Rejected",
    bg: "#FEE2E2",
    text: "#B91C1C",
    icon: "x-circle",
  },
};

function StatusPill({
  status,
}: {
  status: "pending" | "verified" | "rejected";
}) {
  const s = STATUS_STYLE[status];
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: s.bg,
      }}
    >
      <Feather name={s.icon} size={12} color={s.text} />
      <Text
        style={{
          marginLeft: 6,
          fontSize: 11,
          fontWeight: "700",
          textTransform: "uppercase",
          color: s.text,
        }}
      >
        {s.label}
      </Text>
    </View>
  );
}

function Field({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      className={`py-2.5 ${last ? "" : "border-b border-gray-100 dark:border-slate-800"}`}
    >
      <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">
        {label}
      </Text>
      <Text
        className="text-slate-800 dark:text-slate-100 font-bold text-[15px] mt-0.5"
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  keyboardType,
  autoCapitalize,
  multiline,
  minHeight,
  colorScheme,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  editable?: boolean;
  keyboardType?: "default" | "numeric" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  multiline?: boolean;
  minHeight?: number;
  colorScheme?: "light" | "dark";
}) {
  const isDark = colorScheme === "dark";
  return (
    <View style={{ marginBottom: 12 }}>
      <Text className="text-slate-700 dark:text-slate-200 text-xs font-bold mb-1.5">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
        editable={editable}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        style={{
          borderWidth: 1,
          borderColor: isDark ? "#334155" : "#E2E8F0",
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 14,
          color: isDark ? "#F1F5F9" : "#1E293B",
          minHeight,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
  );
}

export default function WalletBank({
  token,
  colorScheme,
}: {
  token: string | null;
  colorScheme?: "light" | "dark";
}) {
  const { bankDetails, loading, saving, saveBankDetails } =
    useBankDetails(token);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<BankDetailsInput>({
    bankAccountHolderName: "",
    bankAccountNumber: "",
    bankIfscCode: "",
    bankName: "",
    upiId: "",
    panNumber: "",
    panCardImageBase64: "",
  });

  const openForm = () => {
    setForm({
      bankAccountHolderName: bankDetails?.bankAccountHolderName ?? "",
      bankAccountNumber: bankDetails?.bankAccountNumber ?? "",
      bankIfscCode: bankDetails?.bankIfscCode ?? "",
      bankName: bankDetails?.bankName ?? "",
      upiId: bankDetails?.upiId ?? "",
      panNumber: bankDetails?.panNumber ?? "",
      panCardImageBase64: bankDetails?.panCardImageBase64 ?? "",
    });
    setFormOpen(true);
  };

  const updateField = (key: keyof BankDetailsInput, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const pickPanImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Permission required",
          "Allow photo library access to pick a PAN image.",
        );
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.6,
        base64: true,
      });
      if (res.canceled) return;
      const asset = res.assets?.[0];
      if (!asset?.base64) {
        Alert.alert("Error", "Could not read selected image.");
        return;
      }
      const mime = asset.mimeType || "image/jpeg";
      const dataUri = `data:${mime};base64,${asset.base64}`;
      const sizeBytes = Math.ceil((asset.base64.length * 3) / 4);
      if (sizeBytes > 5 * 1024 * 1024) {
        Alert.alert("Image too large", "Pick an image under 5MB.");
        return;
      }
      setForm((prev) => ({ ...prev, panCardImageBase64: dataUri }));
    } catch (error) {
      console.error("Pick image error:", error);
      Alert.alert("Error", "Could not pick image. Try again.");
    }
  };

  const submit = async () => {
    const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const UPI_RE = /^[\w.-]+@[\w.-]+$/;

    if (form.bankAccountHolderName.trim().length < 2) {
      Alert.alert(
        "Invalid name",
        "Account holder name must be at least 2 characters.",
      );
      return;
    }
    if (form.bankAccountNumber.trim().length < 5) {
      Alert.alert(
        "Invalid account number",
        "Account number must be at least 5 characters.",
      );
      return;
    }
    if (!IFSC_RE.test(form.bankIfscCode.trim())) {
      Alert.alert("Invalid IFSC", "IFSC must match format like SBIN0001234.");
      return;
    }
    if (form.bankName.trim().length < 2) {
      Alert.alert(
        "Invalid bank name",
        "Bank name must be at least 2 characters.",
      );
      return;
    }
    if (!PAN_RE.test(form.panNumber.trim())) {
      Alert.alert("Invalid PAN", "PAN must match format like ABCDE1234F.");
      return;
    }
    if (form.upiId && form.upiId.trim() && !UPI_RE.test(form.upiId.trim())) {
      Alert.alert("Invalid UPI", "UPI ID must be in format name@provider.");
      return;
    }
    if (!form.panCardImageBase64.trim()) {
      Alert.alert("PAN image required", "Pick a PAN card image to upload.");
      return;
    }
    const sizeBytes = Math.ceil((form.panCardImageBase64.length * 3) / 4);
    if (sizeBytes > 5 * 1024 * 1024) {
      Alert.alert("Image too large", "PAN image must be under 5MB.");
      return;
    }

    const result = await saveBankDetails({
      bankAccountHolderName: form.bankAccountHolderName.trim(),
      bankAccountNumber: form.bankAccountNumber.trim(),
      bankIfscCode: form.bankIfscCode.trim().toUpperCase(),
      bankName: form.bankName.trim(),
      upiId: form.upiId?.trim() || undefined,
      panNumber: form.panNumber.trim().toUpperCase(),
      panCardImageBase64: form.panCardImageBase64.trim(),
    });

    if (result.ok) {
      setFormOpen(false);
      Alert.alert("Submitted", "Bank details saved. Verification is pending.");
    } else {
      Alert.alert("Save failed", result.error);
    }
  };

  return (
    <>
      {loading && !bankDetails ? (
        <View className="py-10 items-center">
          <ActivityIndicator color="#FF8A50" />
        </View>
      ) : bankDetails ? (
        <>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-black text-slate-800 dark:text-white">
              Bank Details
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={openForm}
              className="bg-primary rounded-xl px-4 py-2 flex-row items-center"
            >
              <Feather name="edit-2" size={12} color="#fff" />
              <Text className="text-white font-black text-xs ml-1">Edit</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-5">
            <StatusPill status={bankDetails.verificationStatus} />
            {bankDetails.verificationStatus === "rejected" &&
              bankDetails.rejectionReason && (
                <View className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40">
                  <Text className="text-red-700 dark:text-red-300 text-xs font-bold">
                    Reason: {bankDetails.rejectionReason}
                  </Text>
                </View>
              )}
            <View className="mt-4">
              <Field
                label="Account Holder"
                value={bankDetails.bankAccountHolderName}
              />
              <Field
                label="Account Number"
                value={maskAccount(bankDetails.bankAccountNumber)}
              />
              <Field label="IFSC" value={bankDetails.bankIfscCode} />
              <Field label="Bank" value={bankDetails.bankName} />
              {bankDetails.upiId ? (
                <Field label="UPI ID" value={bankDetails.upiId} />
              ) : null}
              <Field label="PAN" value={bankDetails.panNumber} last />
            </View>
          </View>
        </>
      ) : (
        <View className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 border-dashed items-center">
          <Feather name="credit-card" size={32} color="#CBD5E1" />
          <Text className="text-slate-700 dark:text-slate-200 font-black text-base mt-3">
            No bank account added
          </Text>
          <Text className="text-slate-400 font-bold text-xs mt-1 text-center">
            Add your bank details to withdraw funds
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={openForm}
            className="bg-primary rounded-2xl px-6 py-3 mt-4"
          >
            <Text className="text-white font-black text-sm">
              Add Bank Details
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={formOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !saving && setFormOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{
            flex: 1,
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              backgroundColor: colorScheme === "dark" ? "#0F172A" : "#FFFFFF",
              borderRadius: 24,
              padding: 20,
              maxHeight: "90%",
            }}
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-slate-800 dark:text-white text-xl font-black">
                {bankDetails ? "Update Bank Details" : "Add Bank Details"}
              </Text>
              <TouchableOpacity
                onPress={() => !saving && setFormOpen(false)}
                activeOpacity={0.7}
              >
                <Feather
                  name="x"
                  size={22}
                  color={colorScheme === "dark" ? "#94A3B8" : "#64748B"}
                />
              </TouchableOpacity>
            </View>

            {bankDetails?.verificationStatus === "verified" && (
              <Text className="text-amber-600 dark:text-amber-400 text-xs font-bold mb-3">
                Updating will reset verification to pending.
              </Text>
            )}

            <ScrollView showsVerticalScrollIndicator={false}>
              <FormInput
                label="Account Holder Name"
                value={form.bankAccountHolderName}
                onChangeText={(t) => updateField("bankAccountHolderName", t)}
                placeholder="Full name as per bank"
                editable={!saving}
                colorScheme={colorScheme}
              />
              <FormInput
                label="Account Number"
                value={form.bankAccountNumber}
                onChangeText={(t) => updateField("bankAccountNumber", t)}
                placeholder="Bank account number"
                keyboardType="numeric"
                editable={!saving}
                colorScheme={colorScheme}
              />
              <FormInput
                label="IFSC Code"
                value={form.bankIfscCode}
                onChangeText={(t) =>
                  updateField("bankIfscCode", t.toUpperCase())
                }
                placeholder="e.g. SBIN0001234"
                autoCapitalize="characters"
                editable={!saving}
                colorScheme={colorScheme}
              />
              <FormInput
                label="Bank Name"
                value={form.bankName}
                onChangeText={(t) => updateField("bankName", t)}
                placeholder="e.g. State Bank of India"
                editable={!saving}
                colorScheme={colorScheme}
              />
              <FormInput
                label="UPI ID (optional)"
                value={form.upiId ?? ""}
                onChangeText={(t) => updateField("upiId", t)}
                placeholder="name@provider"
                autoCapitalize="none"
                editable={!saving}
                colorScheme={colorScheme}
              />
              <FormInput
                label="PAN Number"
                value={form.panNumber}
                onChangeText={(t) => updateField("panNumber", t.toUpperCase())}
                placeholder="e.g. ABCDE1234F"
                autoCapitalize="characters"
                editable={!saving}
                colorScheme={colorScheme}
              />
              <View style={{ marginBottom: 12 }}>
                <Text className="text-slate-700 dark:text-slate-200 text-xs font-bold mb-1.5">
                  PAN Card Image
                </Text>
                {form.panCardImageBase64 ? (
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor:
                        colorScheme === "dark" ? "#334155" : "#E2E8F0",
                      borderRadius: 12,
                      padding: 8,
                    }}
                  >
                    <Image
                      source={{
                        uri: form.panCardImageBase64.startsWith("data:")
                          ? form.panCardImageBase64
                          : `data:image/jpeg;base64,${form.panCardImageBase64}`,
                      }}
                      style={{
                        width: "100%",
                        height: 160,
                        borderRadius: 8,
                        backgroundColor: "#F1F5F9",
                      }}
                      contentFit="contain"
                    />
                    <View className="flex-row mt-2">
                      <TouchableOpacity
                        onPress={pickPanImage}
                        disabled={saving}
                        activeOpacity={0.8}
                        className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-xl py-2.5 items-center mr-2 flex-row justify-center"
                      >
                        <Feather
                          name="refresh-cw"
                          size={14}
                          color={colorScheme === "dark" ? "#CBD5E1" : "#475569"}
                        />
                        <Text className="text-slate-700 dark:text-slate-200 font-bold text-xs ml-1.5">
                          Replace
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => updateField("panCardImageBase64", "")}
                        disabled={saving}
                        activeOpacity={0.8}
                        className="flex-1 bg-red-50 dark:bg-red-900/20 rounded-xl py-2.5 items-center flex-row justify-center"
                      >
                        <Feather name="trash-2" size={14} color="#EF4444" />
                        <Text className="text-red-500 font-bold text-xs ml-1.5">
                          Remove
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={pickPanImage}
                    disabled={saving}
                    activeOpacity={0.8}
                    style={{
                      borderWidth: 1,
                      borderStyle: "dashed",
                      borderColor:
                        colorScheme === "dark" ? "#334155" : "#CBD5E1",
                      borderRadius: 12,
                      paddingVertical: 24,
                      alignItems: "center",
                    }}
                  >
                    <Feather
                      name="upload"
                      size={24}
                      color={colorScheme === "dark" ? "#94A3B8" : "#64748B"}
                    />
                    <Text className="text-slate-600 dark:text-slate-300 font-bold text-sm mt-2">
                      Pick PAN Image
                    </Text>
                    <Text className="text-slate-400 text-[11px] mt-0.5">
                      Max 5MB
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={submit}
              disabled={saving}
              activeOpacity={0.8}
              style={{
                backgroundColor: "#FF8A50",
                borderRadius: 16,
                paddingVertical: 14,
                alignItems: "center",
                marginTop: 12,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-black text-base">
                  {bankDetails ? "Update Details" : "Save Details"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
