import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import { router } from "expo-router";
import Feather from "@react-native-vector-icons/feather";
import MaterialIcons from "@react-native-vector-icons/material-icons";
import { useAddToCart } from "@/hooks/useAddToCart";
import { useAuth } from "@/context/AuthContext";
import Placeholder from "@/constants/placeholder";

interface DigitalDownloadCardProps {
  product: {
    id: number;
    title: string;
    slug: string;
    price: number;
    thumbnailUrl: string | null;
    category: string;
    totalPurchases: number;
    teacherName: string;
    teacherAvatar: string | null;
    teacherIsVerified: boolean;
    isPurchased?: boolean;
  };
}

const DigitalDownloadCard = ({
  product: initialProduct,
}: DigitalDownloadCardProps) => {
  const { user, token } = useAuth();
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

  const displayImage = product.thumbnailUrl || Placeholder.NOTE;
  const displayAuthor = product.teacherName || "TestKart Expert";
  const displayCategory = product.category || "Study Material";

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
            "Failed to acquire product. Please try again.",
        });
      }
    } catch (err) {
      console.error("[DigitalDownloadCard] Enroll error:", err);
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
    <View>
      <TouchableOpacity
        onPress={() => router.push(`/shop?slug=${product.slug}` as any)}
        activeOpacity={0.9}
        className="bg-white dark:bg-slate-800 rounded-[32px] mx-5 mb-5 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none border border-gray-100 dark:border-slate-700/50"
      >
        <View className="p-4">
          {/* Category Badge */}
          <View className="absolute top-6 left-6 z-10 px-4 py-1.5 bg-white/90 dark:bg-slate-900/90 rounded-full border border-gray-100 dark:border-slate-700/50 shadow-sm">
            <Text className="text-primary text-[10px] font-black uppercase tracking-widest">
              {displayCategory}
            </Text>
          </View>

          {/* Image / Thumbnail Container */}
          <View className="w-full h-[240px] bg-slate-50 dark:bg-slate-900 rounded-[24px] overflow-hidden mb-5">
            <Image
              source={{ uri: displayImage }}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>

          <View className="px-1 pb-2">
            <Text
              className="text-xl font-black text-slate-800 dark:text-white mb-4 leading-tight"
              numberOfLines={2}
            >
              {product.title}
            </Text>

            <View className="flex-row items-center mb-6">
              <View className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 mr-3 items-center justify-center overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm">
                <Image
                  source={{
                    uri:
                      product.teacherAvatar ||
                      `https://ui-avatars.com/api/?name=${displayAuthor}&background=random`,
                  }}
                  className="w-full h-full"
                />
              </View>
              <View className="flex-row items-center">
                <Text className="text-slate-600 dark:text-slate-300 font-bold text-sm">
                  {displayAuthor}
                </Text>
                {product.teacherIsVerified && (
                  <MaterialIcons
                    name="verified"
                    size={16}
                    color="#22C55E"
                    className="ml-1"
                  />
                )}
              </View>
            </View>

            <View className="flex-row items-center justify-between pt-5 border-t border-slate-50 dark:border-slate-700/50">
              <TouchableOpacity
                onPress={async () => {
                  if (isFree) {
                    if (product.isPurchased) {
                      router.push("/user/products");
                    } else {
                      handleFreeEnroll();
                    }
                  } else {
                    const result = await addToCart(
                      product.id,
                      "digitalProduct",
                    );
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
                          ? product.isPurchased
                            ? "check-circle"
                            : "book"
                          : "shopping-cart"
                      }
                      size={18}
                      color="white"
                    />
                    <Text className="text-white font-black ml-3 text-sm">
                      {isFree
                        ? product.isPurchased
                          ? "Acquired"
                          : "Enroll Free"
                        : "Buy Now"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <Text
                className={`${isFree ? "text-emerald-500" : "text-slate-800 dark:text-white"} text-2xl font-black`}
              >
                {isFree ? "Free" : `₹${product.price}`}
              </Text>
            </View>
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
                  Success!
                </Text>
                {enrollResult.orderId && (
                  <Text className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-1 text-center">
                    Order ID: {enrollResult.orderId}
                  </Text>
                )}
                <Text className="text-slate-500 dark:text-slate-400 text-center text-sm leading-5 mb-6">
                  This product has been added to your library. You can access it
                  anytime from your dashboard.
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
                  Failed
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

export default DigitalDownloadCard;
