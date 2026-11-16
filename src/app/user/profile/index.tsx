import DetailHeader from "@/components/DetailHeader";
import { useAuth } from "@/context/AuthContext";
import Feather from "@react-native-vector-icons/feather";
import * as Application from "expo-application";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MobileVerification from "./_components/MobileVerification";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL ?? "https://testkart.in";
const CLOSE_ACCOUNT_URL = `${BASE_URL}/close-account`;

export default function ProfileEditScreen() {
  const {
    user,
    token,
    loading: authLoading,
    setAuth,
    refreshSession,
  } = useAuth();
  const { colorScheme } = useColorScheme();

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user]);

  // Pull fresh account data from the server whenever the screen is opened.
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  // Keep the editable fields in sync when the user record is refreshed.
  useEffect(() => {
    setDisplayName(user?.displayName || "");
    setBio(user?.bio || "");
  }, [user?.displayName, user?.bio]);

  if (!user) return null;

  const hasChanges =
    displayName !== (user.displayName || "") || bio !== (user.bio || "");

  const handleSave = async () => {
    if (!hasChanges) return;

    if (displayName.trim().length < 2) {
      Alert.alert("Error", "Display name must be at least 2 characters.");
      return;
    }

    if (bio.length > 500) {
      Alert.alert("Error", "Bio must be 500 characters or less.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(`${BASE_URL}/_api/student/profile/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          json: {
            displayName: displayName.trim(),
            bio: bio.trim(),
          },
        }),
      });

      const data = await res.json();
      const payload = data.json || data;

      if (!res.ok) {
        const errorMsg =
          typeof payload.error === "string"
            ? payload.error
            : Array.isArray(payload.error)
              ? payload.error
                  .map((e: { message: string }) => e.message)
                  .join("\n")
              : "Failed to update profile.";
        Alert.alert("Error", errorMsg);
        return;
      }

      if (token) {
        setAuth({ ...user, ...payload }, token);
      }

      Alert.alert("Success", "Profile updated successfully.");
    } catch (error) {
      console.error("Profile update error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCloseAccount = () => {
    const source = Application.applicationId ?? "testkart";
    const params = [
      `utm_source=${encodeURIComponent(source)}`,
      "utm_medium=app",
      "utm_campaign=close_account",
      "utm_content=profile_settings",
    ];
    if (token) params.push(`token=${encodeURIComponent(token)}`);
    const url = `${CLOSE_ACCOUNT_URL}?${params.join("&")}`;

    Alert.alert(
      "Close Account",
      "You'll be taken to the Testkart website to permanently close your account. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "destructive",
          onPress: () => {
            Linking.openURL(url).catch(() => {
              Alert.alert(
                "Error",
                "Couldn't open the browser. Please visit " +
                  CLOSE_ACCOUNT_URL +
                  " manually.",
              );
            });
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-paper dark:bg-night"
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />
      <DetailHeader title="Edit profile" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar Section */}
          <View className="items-center pt-8 pb-6">
            <View className="w-28 h-28 rounded-full bg-primary/10 border-4 border-white dark:border-night-line shadow-xl items-center justify-center overflow-hidden">
              {user.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  className="w-full h-full"
                />
              ) : (
                <Text className="text-5xl font-extrabold text-primary-deep dark:text-primary">
                  {user.displayName?.charAt(0).toUpperCase() || "P"}
                </Text>
              )}
            </View>
            <Text className="text-2xl font-extrabold text-ink dark:text-white mt-4">
              {user.displayName || "User"}
            </Text>
            {user.role && (
              <View className="bg-primary/10 px-4 py-1.5 rounded-full mt-2">
                <Text className="text-primary-deep dark:text-primary font-bold text-xs uppercase tracking-widest">
                  {user.role}
                </Text>
              </View>
            )}
          </View>

          {/* Editable Fields */}
          <View className="px-6">
            <Text className="text-lg font-extrabold text-ink dark:text-white mb-4">
              Edit Profile
            </Text>

            <View className="bg-white dark:bg-night rounded-2xl border border-line dark:border-night-line p-5 mb-6">
              {/* Display Name */}
              <View className="mb-5">
                <Text className="text-sm font-bold text-ink-soft dark:text-night-soft mb-2">
                  Display Name
                </Text>
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Enter your name"
                  placeholderTextColor={
                    colorScheme === "dark" ? "#6A6358" : "#968E82"
                  }
                  className="bg-sand dark:bg-night-raised rounded-xl px-4 py-3.5 text-ink dark:text-white font-bold text-base border border-line dark:border-night-line"
                />
              </View>

              {/* Bio */}
              <View>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm font-bold text-ink-soft dark:text-night-soft">
                    Bio
                  </Text>
                  <Text
                    className={`text-xs font-bold ${
                      bio.length > 500
                        ? "text-red-500"
                        : "text-ink-soft dark:text-night-soft"
                    }`}
                  >
                    {bio.length}/500
                  </Text>
                </View>
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell us about yourself..."
                  placeholderTextColor={
                    colorScheme === "dark" ? "#6A6358" : "#968E82"
                  }
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  className="bg-sand dark:bg-night-raised rounded-xl px-4 py-3.5 text-ink dark:text-white font-bold text-base border border-line dark:border-night-line min-h-[120px]"
                />
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={!hasChanges || saving}
              className={`rounded-2xl py-4 items-center mb-8 ${
                hasChanges && !saving
                  ? "bg-primary-deep"
                  : "bg-line dark:bg-night-raised"
              }`}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  className={`font-extrabold text-base ${
                    hasChanges
                      ? "text-white"
                      : "text-ink-soft dark:text-night-soft"
                  }`}
                >
                  Save Changes
                </Text>
              )}
            </TouchableOpacity>

            {/* Account Info (Read-Only) */}
            <Text className="text-lg font-extrabold text-ink dark:text-white mb-4">
              Account Info
            </Text>

            <View className="bg-white dark:bg-night rounded-2xl border border-line dark:border-night-line overflow-hidden mb-6">
              {user.email && (
                <View className="flex-row items-center p-5 border-b border-line dark:border-night-line">
                  <View className="w-10 h-10 rounded-xl bg-sky-tint dark:bg-night-raised items-center justify-center mr-4">
                    <Feather name="mail" size={18} color="#3F6577" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-ink-soft dark:text-night-soft uppercase tracking-widest mb-0.5">
                      Email
                    </Text>
                    <Text
                      className="text-ink dark:text-night-soft font-bold text-[15px]"
                      numberOfLines={1}
                    >
                      {user.email}
                    </Text>
                    <Text className="text-xs text-ink-soft dark:text-night-soft mt-1">
                      Your email address cannot be changed.
                    </Text>
                  </View>
                </View>
              )}

              <MobileVerification />

              {user.location && (
                <View className="flex-row items-center p-5">
                  <View className="w-10 h-10 rounded-xl bg-sky-tint dark:bg-night-raised items-center justify-center mr-4">
                    <Feather name="map-pin" size={18} color="#3F6577" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-ink-soft dark:text-night-soft uppercase tracking-widest mb-0.5">
                      Location
                    </Text>
                    <Text className="text-ink dark:text-night-soft font-bold text-[15px]">
                      {user.location}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Close Account */}
            <Text className="text-lg font-extrabold text-ink dark:text-white mb-4">
              Danger Zone
            </Text>

            <TouchableOpacity
              onPress={handleCloseAccount}
              className="flex-row items-center bg-red-50 dark:bg-red-950/10 rounded-2xl border border-red-100 dark:border-red-900/20 p-5"
            >
              <View className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/20 items-center justify-center mr-4">
                <Feather name="user-x" size={18} color="#EF4444" />
              </View>
              <View className="flex-1">
                <Text className="text-red-500 font-extrabold text-[15px]">
                  Close Account
                </Text>
                <Text className="text-xs text-ink-soft dark:text-night-soft mt-1">
                  Permanently delete your account and data on the web.
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
