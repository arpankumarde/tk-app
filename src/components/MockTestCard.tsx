import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import Feather from "@react-native-vector-icons/feather";
import MaterialIcons from "@react-native-vector-icons/material-icons";

import { router } from "expo-router";
import { useAddToCart } from "@/hooks/useAddToCart";
import { useAuth } from "@/context/AuthContext";
import { useCartContext } from "@/context/CartContext";
import { useEnrollmentContext } from "@/context/EnrollmentContext";
import Placeholder from "@/constants/placeholder";

interface MockTestCardProps {
  test: {
    id: number;
    title: string;
    slug: string;
    creatorName: string;
    thumbnailUrl: string | null;
    subject?: string | null;
    language?: string | null;
    actualQuestionCount?: string | number;
    durationMinutes?: string | number;
    totalTests?: number;
    freeTestsCount?: number;
    studentsEnrolled?: number;
    price: number;
    discountPrice?: number | null;
    rating?: number | null;
    reviewsCount?: number;
    examName?: string;
    teacherName?: string;
    teacherIsVerified?: boolean;
    isEnrolled?: boolean;
    views?: number;
  };
}

const MockTestCard = ({ test: initialTest }: MockTestCardProps) => {
  const { user, token } = useAuth();
  const { cart } = useCartContext();
  const { enrolledTestIds, markTestEnrolled } = useEnrollmentContext();
  const [test, setTest] = useState(initialTest);
  const isEnrolled = test.isEnrolled || enrolledTestIds.has(test.id);
  const isFree = (test.discountPrice ?? test.price) === 0;
  const { addToCart, adding: addingToCart } = useAddToCart();
  const [enrolling, setEnrolling] = useState(false);
  const [enrollResult, setEnrollResult] = useState<{
    visible: boolean;
    success: boolean;
    orderId?: string | number;
    message?: string;
  }>({ visible: false, success: false });

  const isInCart = cart.items.some(
    (item) => item.resourceId === test.id && item.type === "test",
  );

  const handlePress = () => {
    router.push(`/(main)/tests/${test.slug}` as any);
  };

  const handleFreeEnroll = async () => {
    if (!user || !token) {
      router.push("/login");
      return;
    }
    try {
      setEnrolling(true);
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/_api/tests/enroll-free`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ json: { mockTestId: test.id } }),
        },
      );
      const data = await res.json();
      const payload = data.json || data;

      if (payload.orderId || payload.success) {
        setTest((prev) => ({ ...prev, isEnrolled: true }));
        markTestEnrolled(test.id);
        setEnrollResult({
          visible: true,
          success: true,
          orderId: payload.orderId,
        });
      } else {
        setEnrollResult({
          visible: true,
          success: false,
          message:
            payload.message ||
            payload.error ||
            "Failed to enroll. Please try again.",
        });
      }
    } catch (err) {
      console.error("[MockTestCard] Enroll error:", err);
      setEnrollResult({
        visible: true,
        success: false,
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setEnrolling(false);
    }
  };

  const handleQuickAdd = async () => {
    if (isInCart) {
      router.push("/user/cart");
      return;
    }
    await addToCart(test.id, "test");
  };

  const displayImage = test.thumbnailUrl || Placeholder.TEST;
  const displayAuthor =
    test.teacherName || test.creatorName || "TestKart Expert";

  const actualPrice = test.discountPrice ?? test.price;
  const hasDiscount =
    typeof test.discountPrice === "number" && test.discountPrice < test.price;
  const originalPrice = hasDiscount ? test.price : null;
  const discountPercent =
    hasDiscount && test.price > 0
      ? Math.round(((test.price - actualPrice) / test.price) * 100)
      : null;
  const formatInr = (amount: number) => amount.toLocaleString("en-IN");

  let displaySubject = test.examName || "Mock Test";
  if (test.subject && test.subject !== "[]") {
    displaySubject = test.subject;
  }

  return (
    <View>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden mx-4 mb-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-gray-100 dark:border-slate-700/50"
      >
        <View>
          {/* Thumbnail Header */}
          <View className="relative w-full aspect-video bg-slate-100 dark:bg-slate-900">
            <Image
              source={{ uri: displayImage }}
              className="w-full h-full"
              resizeMode="cover"
            />

            {/* Quick Add Button */}
            {!isFree && (
              <TouchableOpacity
                onPress={handleQuickAdd}
                disabled={addingToCart}
                className={`absolute bottom-2 right-2 w-9 h-9 rounded-xl items-center justify-center shadow-lg border border-white/10 ${isInCart ? "bg-green-500" : "bg-primary"}`}
              >
                {addingToCart ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Feather
                    name={isInCart ? "check" : "plus"}
                    size={18}
                    color="white"
                  />
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Content Section */}
          <View className="p-5">
            {/* Pills Row at Top of Content */}
            <View className="flex-row items-center flex-wrap gap-y-2 mb-4">
              <View className="flex-row items-center flex-wrap flex-1">
                <View className="bg-orange-50 dark:bg-orange-950/20 px-3 py-1.5 rounded-full border border-orange-100/50 dark:border-orange-800/40 mr-2 mb-1">
                  <Text
                    className="text-primary text-[10px] font-black uppercase tracking-widest"
                    numberOfLines={1}
                  >
                    {displaySubject}
                  </Text>
                </View>
                <View className="bg-cyan-50 dark:bg-cyan-950/20 px-3 py-1.5 rounded-full border border-cyan-100/50 dark:border-cyan-800/40 mr-2 mb-1">
                  <Text className="text-cyan-600 dark:text-cyan-400 font-black text-[10px] uppercase tracking-widest">
                    {test.language?.trim() || "ENGLISH"}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center mb-1">
                <Feather name="eye" size={12} color="#94a3b8" />
                <Text className="ml-1.5 text-slate-400 dark:text-slate-500 font-bold text-[10px]">
                  {test.views || 0} { (test.views || 0) <= 1 ? "View" : "Views" }
                </Text>
              </View>
            </View>

            <Text
              className="text-xl font-black text-slate-800 dark:text-white mb-2 leading-7"
              numberOfLines={2}
            >
              {test.title}
            </Text>

            {/* Author & Rating Row */}
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-row items-center flex-1">
                <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                  By:{" "}
                  <Text className="text-slate-600 dark:text-slate-300 font-bold">
                    {displayAuthor}
                  </Text>
                </Text>
                {test.teacherIsVerified && (
                  <MaterialIcons
                    name="verified"
                    size={14}
                    color="#22C55E"
                    style={{ marginLeft: 4 }}
                  />
                )}
              </View>

              <View className="flex-row items-center bg-orange-50 dark:bg-slate-700/40 px-2.5 py-1 rounded-lg border border-orange-100 dark:border-slate-600/60">
                <Feather name="star" size={12} color="#F97316" />
                <Text className="ml-1 text-orange-500 font-black text-xs">
                  {test.rating || "5.0"}
                </Text>
                {test.reviewsCount !== undefined && (
                  <Text className="ml-1 text-slate-400 dark:text-slate-500 font-bold text-[10px]">
                    ({test.reviewsCount})
                  </Text>
                )}
              </View>
            </View>

            <View className="flex-row flex-wrap gap-y-4 mb-6 pb-6 border-b border-gray-50 dark:border-slate-700/50">
              <View className="w-1/2 flex-row items-center">
                <Feather name="file-text" size={14} color="#F97316" />
                <Text className="ml-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                  {test.actualQuestionCount || 0} Questions
                </Text>
              </View>

              <View className="w-1/2 flex-row items-center">
                <Feather name="clock" size={14} color="#F97316" />
                <Text className="ml-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                  {test.durationMinutes || 0} Minutes
                </Text>
              </View>

              <View className="w-1/2 flex-row items-center">
                <Feather name="users" size={14} color="#F97316" />
                <Text className="ml-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                  {test.studentsEnrolled || 0} Enrolled
                </Text>
              </View>

              <View className="w-1/2 flex-row items-center">
                <Feather name="layers" size={14} color="#F97316" />
                <Text className="ml-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                  {test.totalTests || 0} Test{" "}
                  {(test.totalTests || 0) === 1 ? "Item" : "Items"}
                  {(test.freeTestsCount || 0) > 0
                    ? " "
                    : ""}
                  {(test.freeTestsCount || 0) > 0 && (
                    <Text className="text-emerald-500">
                      ({test.freeTestsCount} Free {(test.freeTestsCount || 0) === 1 ? "Test" : "Tests"})
                    </Text>
                  )}
                </Text>
              </View>
            </View>

            {/* Footer: CTA + Price Row */}
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={async () => {
                  if (isFree) {
                    if (isEnrolled) {
                      router.push({ pathname: "/user/tests/[slug]", params: { slug: test.slug } });
                    } else {
                      handleFreeEnroll();
                    }
                  } else {
                    if (isInCart) {
                      router.push("/user/cart");
                      return;
                    }
                    const result = await addToCart(test.id, "test");
                    if (result.success) {
                      router.push("/user/cart");
                    }
                  }
                }}
                disabled={addingToCart || enrolling}
                className={`${isFree ? "bg-emerald-500 shadow-emerald-500/30" : "bg-primary shadow-orange-500/30"} flex-row items-center justify-center px-6 py-3.5 rounded-xl shadow-lg w-48 mr-4`}
              >
                {addingToCart || enrolling ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Feather
                      name={
                        isFree
                          ? isEnrolled
                            ? "play-circle"
                            : "book"
                          : isInCart
                            ? "chevron-right"
                            : "shopping-cart"
                      }
                      size={18}
                      color="white"
                    />
                    <Text className="text-white font-black ml-3 text-sm">
                      {isFree
                        ? isEnrolled
                          ? "Go to Test"
                          : "Enroll Free"
                        : isInCart
                          ? "Go to Cart"
                          : "Buy Now"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <View className="items-end flex-shrink">
                <View className="flex-row items-center">
                  {originalPrice && (
                    <Text className="text-slate-400 line-through text-[10px] mr-2">
                      ₹{formatInr(originalPrice)}
                    </Text>
                  )}
                  {discountPercent !== null && (
                    <Text className="text-emerald-500 font-black text-[10px] mr-2">
                      {discountPercent}% OFF
                    </Text>
                  )}
                  {actualPrice === 0 ? (
                    <Text className="text-2xl font-black text-emerald-500">
                      FREE
                    </Text>
                  ) : (
                    <Text className="text-2xl font-black text-slate-800 dark:text-white">
                      ₹{formatInr(actualPrice)}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Enrollment Result Modal */}
      <Modal
        visible={enrollResult.visible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setEnrollResult((prev) => ({ ...prev, visible: false }))
        }
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-[340px] items-center shadow-2xl">
            {enrollResult.success ? (
              <>
                <View className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center mb-5">
                  <Feather name="check-circle" size={32} color="#10B981" />
                </View>
                <Text className="text-2xl font-black text-slate-800 dark:text-white mb-2 text-center">
                  Enrollment Successful!
                </Text>
                {enrollResult.orderId && (
                  <Text className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-1 text-center">
                    Order ID: {enrollResult.orderId}
                  </Text>
                )}
                <Text className="text-slate-500 dark:text-slate-400 text-center text-sm leading-5 mb-6">
                  You now have full access to this mock test set. Start
                  practicing now!
                </Text>
                <TouchableOpacity
                  className="bg-green-500 w-full h-14 rounded-2xl items-center justify-center mb-3"
                  onPress={() => {
                    setEnrollResult((prev) => ({ ...prev, visible: false }));
                    router.push("/user");
                  }}
                >
                  <Text className="text-white font-black text-base">
                    Go to Dashboard
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="w-full h-12 rounded-2xl items-center justify-center"
                  onPress={() =>
                    setEnrollResult((prev) => ({ ...prev, visible: false }))
                  }
                >
                  <Text className="text-slate-500 dark:text-slate-400 font-bold text-sm">
                    Continue Browsing
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 items-center justify-center mb-5">
                  <Feather name="alert-circle" size={32} color="#EF4444" />
                </View>
                <Text className="text-2xl font-black text-slate-800 dark:text-white mb-2 text-center">
                  Enrollment Failed
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 text-center text-sm leading-5 mb-6">
                  {enrollResult.message}
                </Text>
                <TouchableOpacity
                  className="bg-primary w-full h-14 rounded-2xl items-center justify-center"
                  onPress={() =>
                    setEnrollResult((prev) => ({ ...prev, visible: false }))
                  }
                >
                  <Text className="text-white font-black text-base">
                    Try Again
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default MockTestCard;
