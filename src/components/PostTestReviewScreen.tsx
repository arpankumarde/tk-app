import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Feather from "@react-native-vector-icons/feather";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useColorScheme } from "nativewind";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "@/context/AuthContext";
import { isAuthError } from "@/utils/authError";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

export const getReviewStorageKey = (mockTestId: number | string) =>
  `reviewed_test_${String(mockTestId)}`;

type Props = {
  visible: boolean;
  mockTestId: number;
  seriesTitle: string;
  initialRating: number | null;
  initialReviewText: string | null;
  onClose: () => void;
};

const readError = (payload: any) => {
  const err = payload?.error;
  if (typeof err === "string") return err;
  if (Array.isArray(err) && err[0]?.message) return err[0].message as string;
  return "Could not save your review. Please try again.";
};

// Full-screen series review shown right after a test: asks for a first rating, or to reconsider one below 4 stars.
const PostTestReviewScreen = ({
  visible,
  mockTestId,
  seriesTitle,
  initialRating,
  initialReviewText,
  onClose,
}: Props) => {
  const { colorScheme } = useColorScheme();
  const { token, invalidateSession } = useAuth();
  const isDark = colorScheme === "dark";
  const isReconsider = !!initialRating && initialRating > 0;

  const [rating, setRating] = useState(initialRating || 0);
  const [reviewText, setReviewText] = useState(initialReviewText || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Each opening starts from the student's saved review.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setRating(initialRating || 0);
      setReviewText(initialReviewText || "");
      setError(null);
      setSubmitted(false);
    }
  }

  const handleSubmit = async () => {
    if (!token || rating === 0 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const trimmed = reviewText.trim();
      const response = await fetch(`${BASE_URL}/_api/reviews/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          json: {
            mockTestId,
            rating,
            ...(trimmed ? { reviewText: trimmed } : {}),
          },
        }),
      });
      const data = await response.json().catch(() => ({}));
      const payload = data?.json || data;
      // This endpoint also answers 403 for review-eligibility rules, so only other statuses can mean a dead session.
      if (response.status !== 403 && isAuthError(response.status, payload)) {
        onClose();
        await invalidateSession();
        return;
      }
      if (!response.ok || !payload?.success) {
        throw new Error(readError(payload));
      }
      await SecureStore.setItemAsync(getReviewStorageKey(mockTestId), "1");
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Could not save your review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <SafeAreaProvider>
        <SafeAreaView className="flex-1 bg-paper dark:bg-night">
          {submitted ? (
            <View className="flex-1 items-center justify-center px-8">
              <View className="w-20 h-20 rounded-full bg-clay-tint dark:bg-night-raised items-center justify-center mb-6">
                <Feather name="check" size={40} color="#C2410C" />
              </View>
              <Text className="w-full text-2xl font-extrabold text-ink dark:text-white text-center">
                Thanks for your feedback
              </Text>
              <Text className="text-ink-soft dark:text-night-soft text-base font-bold text-center mt-3 leading-6">
                Your rating helps other students choose and helps the teacher improve.
              </Text>
              <TouchableOpacity
                onPress={onClose}
                className="mt-10 w-full h-14 rounded-2xl bg-primary-deep items-center justify-center"
              >
                <Text className="text-white font-extrabold text-base">
                  See my results
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <KeyboardAvoidingView
              className="flex-1"
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <View className="flex-row justify-end px-4 pt-2">
                <TouchableOpacity
                  onPress={handleClose}
                  accessibilityLabel="Close"
                  className="w-11 h-11 rounded-full bg-sand dark:bg-night-raised items-center justify-center"
                >
                  <Feather
                    name="x"
                    size={22}
                    color={isDark ? "#E3DACB" : "#3A3731"}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                className="flex-1"
                contentContainerStyle={{
                  flexGrow: 1,
                  justifyContent: "center",
                  paddingHorizontal: 24,
                  paddingBottom: 24,
                }}
                keyboardShouldPersistTaps="handled"
              >
                <View className="items-center">
                  <View className="w-16 h-16 rounded-full bg-clay-tint dark:bg-night-raised items-center justify-center mb-6">
                    <Ionicons name="star" size={30} color="#FF8A50" />
                  </View>
                  <Text className="w-full text-2xl font-extrabold text-ink dark:text-white text-center">
                    {isReconsider ? "Changed your mind?" : "How was this test series?"}
                  </Text>
                  <Text
                    className="text-base font-extrabold text-orange-700 dark:text-orange-300 text-center mt-2"
                    numberOfLines={2}
                  >
                    {seriesTitle}
                  </Text>
                  <Text className="text-ink-soft dark:text-night-soft text-sm font-bold text-center mt-3 leading-5 px-2">
                    {isReconsider
                      ? `You rated this series ${initialRating} out of 5 earlier. If this test changed how you feel about it, update your rating.`
                      : "You just finished a test. Rate the series to help other students and the teacher."}
                  </Text>
                </View>

                <View className="flex-row items-center justify-center mt-10">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => setRating(s)}
                      accessibilityLabel={`Rate ${s} star${s > 1 ? "s" : ""}`}
                      className="mx-1.5"
                    >
                      <Ionicons
                        name={s <= rating ? "star" : "star-outline"}
                        size={44}
                        color="#FF8A50"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <Text className="text-center text-sm font-extrabold text-ink dark:text-night-soft mt-3 h-5">
                  {rating > 0 ? RATING_LABELS[rating] : "Tap a star to rate"}
                </Text>

                <TextInput
                  placeholder="Tell us more about your experience (optional)"
                  placeholderTextColor={isDark ? "#968E82" : "#6A6358"}
                  multiline
                  maxLength={1000}
                  value={reviewText}
                  onChangeText={setReviewText}
                  editable={!submitting}
                  className="mt-8 border border-line dark:border-night-line rounded-2xl p-4 text-ink dark:text-white text-base bg-sand dark:bg-night h-32 font-bold"
                  style={{ textAlignVertical: "top" }}
                />

                {error ? (
                  <Text className="text-red-600 dark:text-red-400 text-sm font-bold text-center mt-4">
                    {error}
                  </Text>
                ) : null}
              </ScrollView>

              <View className="px-6 pb-4 pt-2 gap-y-3">
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={submitting || rating === 0}
                  className={`h-14 rounded-2xl items-center justify-center ${rating === 0 ? "bg-line dark:bg-night-raised" : "bg-primary-deep"}`}
                >
                  {submitting ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text
                      className={`font-extrabold text-base ${rating === 0 ? "text-ink-soft dark:text-night-soft" : "text-white"}`}
                    >
                      {isReconsider ? "Update Review" : "Submit Review"}
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleClose}
                  disabled={submitting}
                  className="h-12 rounded-2xl items-center justify-center border border-line dark:border-night-line"
                >
                  <Text className="text-ink dark:text-night-soft font-extrabold text-sm">
                    {isReconsider ? "Keep my rating" : "Skip for now"}
                  </Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          )}
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
};

export default PostTestReviewScreen;
