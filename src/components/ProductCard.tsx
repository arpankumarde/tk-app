import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import Feather from "@react-native-vector-icons/feather";
import MaterialIcons from "@react-native-vector-icons/material-icons";

import { useAddToCart } from "@/hooks/useAddToCart";
import { useAuth } from "@/context/AuthContext";
import Placeholder from "@/constants/placeholder";

interface ProductCardProps {
  product: {
    id: number;
    title: string;
    price: number;
    pdfUrl?: string;
    publishedAt: string;
    rating: number | null;
    slug: string;
    teacherAvatar: string;
    teacherIsVerified: boolean;
    teacherName: string;
    teacherSlug: string;
    thumbnailUrl: string;
    totalPurchases: number;
    category: string;
    isPurchased?: boolean;
    views?: number;
    ratingsCount?: number;
  };
  className?: string;
  style?: any;
}

const ProductCard = ({
  product: initialProduct,
  className = "",
  style = {},
}: ProductCardProps) => {
  const { user, token } = useAuth();
  const router = useRouter();
  const [product, setProduct] = useState(initialProduct);
  const isFree = (product.price ?? 0) === 0;
  const { addToCart, adding: addingToCart } = useAddToCart();
  const [enrolling, setEnrolling] = useState(false);
  const [enrollResult, setEnrollResult] = useState<{
    visible: boolean;
    success: boolean;
    orderId?: string | number;
    message?: string;
  }>({ visible: false, success: false });

  const displayImage = product?.thumbnailUrl || Placeholder.NOTE;
  const displayAuthor = product?.teacherName || "TestKart Expert";
  const displayCategory = product?.category || "Study Material";
  const reviewCount = product.ratingsCount ?? 0;
  const hasRating = typeof product.rating === "number" && product.rating > 0;
  const showReviewMeta = reviewCount > 0 || hasRating;
  const ratingDisplay =
    typeof product.rating === "number"
      ? Number.isInteger(product.rating)
        ? String(product.rating)
        : product.rating.toFixed(1)
      : "0";
  const teacherInitials = displayAuthor
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "TE";
  const hasTeacherAvatar = !!product.teacherAvatar?.trim();

  const handleFreeEnroll = async () => {
    if (!user || !token) {
      router.push("/login");
      return;
    }
    try {
      setEnrolling(true);
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/_api/shop/enroll-free`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ json: { digitalProductId: product.id } }),
        },
      );
      const data = await res.json();
      const payload = data.json || data;

      if (payload.orderId || payload.success) {
        setProduct((prev) => ({ ...prev, isPurchased: true }));
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
            "Failed to acquire notes. Please try again.",
        });
      }
    } catch (err) {
      console.error("[ProductCard] Enroll error:", err);
      setEnrollResult({
        visible: true,
        success: false,
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <View style={style}>
      <TouchableOpacity
        onPress={() => router.push(`/product/${product.slug}` as any)}
        activeOpacity={0.9}
        className={`bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-slate-700 ${className}`}
      >
        {/* Category Badge */}
        <View className="absolute top-3 left-3 z-10 px-3 py-1.5 bg-slate-900/90 rounded-full shadow-sm">
          <Text className="text-white text-[10px] font-black uppercase tracking-widest">
            {displayCategory}
          </Text>
        </View>

        {/* Product Image */}
        <View className="w-full bg-slate-50 dark:bg-slate-900/5 border-b border-slate-100 dark:border-slate-800">
          <Image
            source={{ uri: displayImage }}
            className="w-full aspect-video"
            resizeMode="cover"
          />
        </View>

        <View className="p-5 flex-1">
          <View className="flex-1">
            <Text
              className="text-xl font-bold text-slate-800 dark:text-white mb-1.5 leading-tight"
              numberOfLines={2}
            >
              {product.title}
            </Text>

            <View className="flex-row items-center mb-3">
              <View className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 mr-2 items-center justify-center overflow-hidden">
                {hasTeacherAvatar ? (
                  <Image
                    source={{ uri: product.teacherAvatar }}
                    className="w-full h-full"
                  />
                ) : (
                  <Text className="text-slate-600 dark:text-slate-200 text-[10px] font-black">
                    {teacherInitials}
                  </Text>
                )}
              </View>
              <View className="flex-row items-center flex-1 mr-2">
                <Text
                  className="text-slate-500 dark:text-slate-400 text-sm flex-shrink"
                  numberOfLines={1}
                >
                  {displayAuthor}
                </Text>
                {product.teacherIsVerified && (
                  <MaterialIcons
                    name="verified"
                    size={14}
                    color="#22C55E"
                    className="ml-1 flex-shrink-0"
                  />
                )}
              </View>
            </View>

            {/* Product Stats Row */}
            <View className="flex-row items-center flex-wrap mb-4 gap-2">
              <View className="flex-row items-center">
                <Feather name="eye" size={13} color="#94a3b8" />
                <Text className="text-slate-400 dark:text-slate-500 text-[11px] font-bold ml-1.5">
                  {product.views || 0} Views
                </Text>
              </View>
              <View className="flex-row items-center">
                <Feather name="shopping-bag" size={13} color="#94a3b8" />
                <Text className="text-slate-400 dark:text-slate-500 text-[11px] font-bold ml-1.5">
                  {product.totalPurchases || 0} Purchases
                </Text>
              </View>
              {/* Dot Separator & Reviews */}
              {showReviewMeta && (
                <>
                  <View className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-1" />
                  <View className="flex-row items-center">
                    <Feather name="star" size={13} color="#F59E0B" />
                    <Text className="text-amber-600 dark:text-amber-500 text-[11px] font-black ml-1">
                      {reviewCount > 0 ? `${ratingDisplay} (${reviewCount})` : ratingDisplay}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>

          <View className="flex-row items-center justify-between pt-4 border-t border-gray-50 dark:border-slate-700 mt-auto gap-x-2">
            <TouchableOpacity
              onPress={async () => {
                if (isFree) {
                  if (product.isPurchased) {
                    router.push("/user/products");
                  } else {
                    handleFreeEnroll();
                  }
                } else {
                  const result = await addToCart(product.id, "digitalProduct");
                  if (result.success) {
                    router.push("/user/cart");
                  }
                }
              }}
              disabled={addingToCart || enrolling}
              className={`${isFree ? "bg-emerald-500 shadow-emerald-500/30" : "bg-primary shadow-orange-500/30"} w-48 shrink flex-row items-center justify-center px-4 py-3.5 rounded-xl shadow-lg`}
            >
              {addingToCart || enrolling ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Feather
                    name={
                      isFree
                        ? product.isPurchased
                          ? "check-circle"
                          : "book"
                        : "shopping-cart"
                    }
                    size={18}
                    color="white"
                  />
                  <Text className="text-white font-black ml-3 text-sm" numberOfLines={1}>
                    {isFree
                      ? product.isPurchased
                        ? "GO TO LIBRARY"
                        : "Enroll Free"
                      : "Buy Now"}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <Text
              className={`${isFree ? "text-emerald-500" : "text-slate-800 dark:text-white"} text-2xl font-black flex-shrink-0`}
            >
              {isFree ? "FREE" : `₹${product.price}`}
            </Text>
          </View>
        </View>
      </TouchableOpacity>


      {/* Result Modal */}
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
                  Notes Acquired!
                </Text>
                {enrollResult.orderId && (
                  <Text className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-1 text-center">
                    Order ID: {enrollResult.orderId}
                  </Text>
                )}
                <Text className="text-slate-500 dark:text-slate-400 text-center text-sm leading-5 mb-6">
                  These notes have been added to your library. You can access
                  them anytime from your dashboard.
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

export default ProductCard;
