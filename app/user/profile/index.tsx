import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import Header from "@/components/Header";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export default function ProfileEditScreen() {
  const { user, token, setAuth } = useAuth();
  const { colorScheme } = useColorScheme();

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user]);

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

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-white dark:bg-slate-950"
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />
      <Header />

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
            <View className="w-28 h-28 rounded-full bg-primary/10 border-4 border-white dark:border-slate-800 shadow-xl items-center justify-center overflow-hidden">
              {user.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  className="w-full h-full"
                />
              ) : (
                <Text className="text-5xl font-black text-primary">
                  {user.displayName?.charAt(0).toUpperCase() || "P"}
                </Text>
              )}
            </View>
            <Text className="text-2xl font-black text-slate-800 dark:text-white mt-4">
              {user.displayName || "User"}
            </Text>
            {user.role && (
              <View className="bg-primary/10 px-4 py-1.5 rounded-full mt-2">
                <Text className="text-primary font-bold text-xs uppercase tracking-widest">
                  {user.role}
                </Text>
              </View>
            )}
          </View>

          {/* Editable Fields */}
          <View className="px-6">
            <Text className="text-lg font-black text-slate-800 dark:text-white mb-4">
              Edit Profile
            </Text>

            <View className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 mb-6">
              {/* Display Name */}
              <View className="mb-5">
                <Text className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">
                  Display Name
                </Text>
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Enter your name"
                  placeholderTextColor={
                    colorScheme === "dark" ? "#475569" : "#94a3b8"
                  }
                  className="bg-gray-50 dark:bg-slate-800 rounded-xl px-4 py-3.5 text-slate-800 dark:text-white font-bold text-base border border-gray-200 dark:border-slate-700"
                />
              </View>

              {/* Bio */}
              <View>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm font-bold text-slate-500 dark:text-slate-400">
                    Bio
                  </Text>
                  <Text
                    className={`text-xs font-bold ${
                      bio.length > 500
                        ? "text-red-500"
                        : "text-slate-400 dark:text-slate-500"
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
                    colorScheme === "dark" ? "#475569" : "#94a3b8"
                  }
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  className="bg-gray-50 dark:bg-slate-800 rounded-xl px-4 py-3.5 text-slate-800 dark:text-white font-bold text-base border border-gray-200 dark:border-slate-700 min-h-[120px]"
                />
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={!hasChanges || saving}
              className={`rounded-2xl py-4 items-center mb-8 ${
                hasChanges && !saving
                  ? "bg-primary"
                  : "bg-gray-200 dark:bg-slate-800"
              }`}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  className={`font-black text-base ${
                    hasChanges
                      ? "text-white"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  Save Changes
                </Text>
              )}
            </TouchableOpacity>

            {/* Account Info (Read-Only) */}
            <Text className="text-lg font-black text-slate-800 dark:text-white mb-4">
              Account Info
            </Text>

            <View className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden mb-6">
              {user.email && (
                <View className="flex-row items-center p-5 border-b border-gray-50 dark:border-slate-800">
                  <View className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 items-center justify-center mr-4">
                    <Feather name="mail" size={18} color="#3B82F6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">
                      Email
                    </Text>
                    <Text
                      className="text-slate-700 dark:text-slate-200 font-bold text-[15px]"
                      numberOfLines={1}
                    >
                      {user.email}
                    </Text>
                    <Text className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Your email address cannot be changed.
                    </Text>
                  </View>
                </View>
              )}

              {user.mobileNumber && (
                <View className="flex-row items-center p-5 border-b border-gray-50 dark:border-slate-800">
                  <View className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 items-center justify-center mr-4">
                    <Feather name="phone" size={18} color="#22C55E" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">
                      Mobile
                    </Text>
                    <View className="flex-row items-center">
                      <Text className="text-slate-700 dark:text-slate-200 font-bold text-[15px]">
                        {user.mobileNumber}
                      </Text>
                      {user.mobileVerified && (
                        <MaterialIcons
                          name="verified"
                          size={16}
                          color="#22C55E"
                          style={{ marginLeft: 6 }}
                        />
                      )}
                    </View>
                    <Text className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Your mobile number cannot be changed.
                    </Text>
                  </View>
                </View>
              )}

              {user.location && (
                <View className="flex-row items-center p-5">
                  <View className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 items-center justify-center mr-4">
                    <Feather name="map-pin" size={18} color="#8B5CF6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">
                      Location
                    </Text>
                    <Text className="text-slate-700 dark:text-slate-200 font-bold text-[15px]">
                      {user.location}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
