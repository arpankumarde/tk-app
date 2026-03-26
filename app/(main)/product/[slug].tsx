import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  Share,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import PDFPreview from "@/components/PDFPreview";
import { useAuth } from "@/context/AuthContext";
import { useAddToCart } from "@/hooks/useAddToCart";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

interface Product {
  category: string;
  description: string;
  fileSizeBytes: number;
  id: number;
  language: string;
  pageCount: number;
  pdfUrl: string;
  previewPages: number;
  price: number;
  publishedAt: string;
  rating: number | null;
  reviewsCount: number;
  shortDescription: string;
  slug: string;
  tags: string[];
  teacherAvatar: string;
  teacherBio: string | null;
  teacherName: string;
  teacherSlug: string;
  teacherIsVerified: boolean;
  thumbnailUrl: string;
  title: string;
  totalPurchases: number;
}

interface FreeEnrollResponse {
  json: {
    error?: string;
    message?: string;
    orderId?: number;
  };
}

const ProductDetails = () => {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const { colorScheme } = useColorScheme();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollResult, setEnrollResult] = useState<{
    visible: boolean;
    success: boolean;
    orderId?: number;
    message?: string;
  }>({ visible: false, success: false });
  const { token } = useAuth();
  const { addToCart, adding: addingToCart } = useAddToCart();

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${BASE_URL}/_api/shop/details?slug=${slug}`,
        );
        const data = await response.json();
        const payload = data.json || data;
        console.log("Fetched product details:", payload.product);
        setProduct(payload.product);

        const listResponse = await fetch(`${BASE_URL}/_api/shop/list?limit=4`);
        const listData = await listResponse.json();
        const listPayload = listData.json || listData;
        setRelatedProducts(
          listPayload.products?.filter((p: any) => p.slug !== slug) || [],
        );
      } catch (error: any) {
        console.error("Error fetching product details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchProductDetails();
  }, [slug]);

  const handleEnrollFree = async () => {
    if (!product || !token) return;
    try {
      setEnrolling(true);
      const response = await fetch(`${BASE_URL}/_api/shop/enroll-free`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ json: { digitalProductId: product.id } }),
      });
      console.log({ json: { digitalProductId: product.id } });
      const data: FreeEnrollResponse = await response.json();
      console.log(data);
      if (data.json.orderId) {
        setEnrollResult({
          visible: true,
          success: true,
          orderId: data.json.orderId,
        });
      } else {
        setEnrollResult({
          visible: true,
          success: false,
          message:
            data.json.message ||
            data.json.error ||
            "Failed to enroll. Please try again.",
        });
      }
    } catch (error: any) {
      console.error("Enrollment error:", error);
      setEnrollResult({
        visible: true,
        success: false,
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setEnrolling(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this study note: ${product?.title}\n${BASE_URL}/shop/${product?.slug}`,
      });
    } catch (error: any) {
      console.error(error.message);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#FF8A50" />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-900 items-center justify-center px-10">
        <Text className="text-xl font-bold text-slate-800 dark:text-white mb-4">
          Product not found
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary px-8 py-3 rounded-xl"
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 KB";
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(2)} KB`;
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-900">
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />
      <SafeAreaView edges={["top", "left", "right"]} className="flex-1">
        <Header />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Main Image & Category Badge */}
          <View className="px-5 pt-4">
            <View className="relative w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-800">
              <Image
                source={{
                  uri:
                    product?.thumbnailUrl ||
                    "https://ik.imagekit.io/testkart/placeholders/study-notes.png",
                }}
                className="w-full aspect-video"
                resizeMode="cover"
              />
              {/* Category Badge */}
              <View className="absolute top-4 left-4 bg-slate-900/90 px-5 py-2 rounded-full shadow-lg">
                <Text className="text-white font-black text-xs uppercase tracking-wider">
                  {product.category || "Notes"}
                </Text>
              </View>
            </View>
          </View>

          <View className="px-6 py-6">
            {/* Title Section */}
            <Text className="text-3xl font-black text-slate-800 dark:text-white leading-tight mb-5">
              {product.title}
            </Text>

            {/* Author Info & Rating Bar */}
            <View className="flex-row items-center justify-between mb-8">
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 rounded-full border-2 border-white dark:border-slate-800 shadow-sm overflow-hidden mr-3">
                  <Image
                    source={{
                      uri:
                        product.teacherAvatar ||
                        `https://ui-avatars.com/api/?name=${product.teacherName}&background=FF8A50&color=fff`,
                    }}
                    className="w-full h-full"
                  />
                </View>
                <View className="flex-1 mr-4">
                  <Text className="text-slate-500 dark:text-slate-400 text-sm font-bold">
                    By
                  </Text>
                  <View className="flex-row items-center">
                    <Link
                      href={`/expert/${product?.teacherSlug}` as any}
                      className="text-slate-800 dark:text-white font-black text-lg leading-tight -mt-0.5"
                      numberOfLines={1}
                    >
                      {product?.teacherName || "TestKart Expert"}
                    </Link>
                    {product?.teacherIsVerified && (
                      <MaterialIcons
                        name="verified"
                        size={16}
                        color="#22C55E"
                        className="ml-1"
                      />
                    )}
                  </View>
                </View>
              </View>

              <View className="flex-row items-center bg-gray-50 dark:bg-slate-800/50 px-4 py-2.5 rounded-2xl border border-gray-100 dark:border-slate-700">
                <Ionicons name="star" size={18} color="#FF8A50" />
                <Text className="mx-1.5 text-slate-800 dark:text-white font-black">
                  {product.rating ? product.rating.toFixed(1) : "New"}
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold leading-none">
                  ({product.reviewsCount || 0} reviews)
                </Text>
              </View>
            </View>

            <View className="h-[1px] bg-gray-50 dark:bg-slate-800 mb-8" />

            {/* Description */}
            <View className="mb-8">
              <Text className="text-2xl font-black text-slate-800 dark:text-white mb-4">
                Description
              </Text>
              <Text className="text-slate-600 dark:text-slate-300 text-base leading-7">
                {product.shortDescription ||
                  product.description?.replace(/<[^>]*>?/gm, "") ||
                  "No description available for this product."}
              </Text>
            </View>

            {/* Tags */}
            {/* {product.tags && product.tags.length > 0 && (
              <View className="mb-10">
                <Text className="text-2xl font-black text-slate-800 dark:text-white mb-4">
                  Tags
                </Text>
                <View className="flex-row flex-wrap">
                  {product.tags.map((tag: string, i: number) => (
                    <View
                      key={i}
                      className="bg-cyan-50 dark:bg-cyan-900/20 px-5 py-2.5 rounded-2xl border border-cyan-100 dark:border-cyan-800/30 mr-3 mb-3"
                    >
                      <Text className="text-cyan-600 dark:text-cyan-400 font-black text-base uppercase tracking-tight">
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )} */}

            {/* About the Author Card */}
            <View className="mb-8">
              <Text className="text-2xl font-black text-slate-800 dark:text-white mb-4">
                About the Author
              </Text>
              <TouchableOpacity
                onPress={() =>
                  router.push(`/(main)/expert/${product.teacherSlug}`)
                }
                className="flex-row items-center bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 rounded-[24px] p-5"
              >
                <Image
                  source={{
                    uri:
                      product.teacherAvatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(product.teacherName)}&background=FF8A50&color=fff`,
                  }}
                  className="w-14 h-14 rounded-2xl"
                />
                <View className="ml-4 flex-1">
                  <Text className="text-slate-800 dark:text-white font-black text-base">
                    {product.teacherName || "Author"}
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color="#FF8A50" />
              </TouchableOpacity>
            </View>

            {/* Detailed Bottom Section (Dynamic Data) */}
            <View className="bg-white dark:bg-slate-800/50 p-5 rounded-[28px] border border-gray-100 dark:border-slate-700/80 mb-8 shadow-lg shadow-slate-200/50 dark:shadow-none">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-slate-500 dark:text-slate-400 text-base font-bold uppercase tracking-wider">
                  Price
                </Text>
                <Text className="text-3xl font-black text-orange-500">
                  {product.price === 0 ? (
                    <Text className="text-emerald-500">FREE</Text>
                  ) : (
                    `₹ ${product.price}`
                  )}
                </Text>
              </View>

              <View className="h-[1px] bg-gray-50 dark:bg-slate-700/50 mb-5" />

              {product.price === 0 ? (
                <TouchableOpacity
                  className="bg-emerald-500 h-14 rounded-xl flex-row items-center justify-center shadow-md shadow-emerald-500/30 mb-3"
                  onPress={handleEnrollFree}
                  disabled={enrolling}
                >
                  {enrolling ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Feather name="download" size={18} color="white" />
                      <Text className="text-white text-lg font-black ml-2.5">
                        Get Free
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  className="bg-primary h-14 rounded-xl flex-row items-center justify-center shadow-md shadow-orange-500/20 mb-3 disabled:opacity-60"
                  disabled={addingToCart}
                  onPress={async () => {
                    if (!product) return;
                    const result = await addToCart(
                      product.id,
                      "digitalProduct",
                    );
                    if (result.success) {
                      router.push("/(user)/cart" as any);
                    } else {
                      setEnrollResult({
                        visible: true,
                        success: false,
                        message: result.message,
                      });
                    }
                  }}
                >
                  {addingToCart ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Feather name="shopping-cart" size={18} color="white" />
                      <Text className="text-white text-lg font-black ml-2.5">
                        Add to Cart
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <View className="flex-row items-center justify-between mb-6 px-1">
                {product?.pdfUrl && product?.previewPages > 0 && (
                  <TouchableOpacity
                    className="flex-1 h-12 rounded-2xl bg-orange-50/60 dark:bg-orange-400/10 border border-orange-100 dark:border-orange-400/20 items-center justify-center mr-2"
                    onPress={() => setPreviewVisible(true)}
                  >
                    <View className="flex-row items-center">
                      <Feather name="external-link" size={16} color="#FF8A50" />
                      <Text className="text-primary font-black text-sm ml-2">
                        Preview
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={handleShare}
                  className="flex-1 h-12 rounded-2xl bg-orange-50/60 dark:bg-orange-400/10 border border-orange-100 dark:border-orange-400/20 items-center justify-center ml-2"
                >
                  <View className="flex-row items-center">
                    <Feather name="share-2" size={16} color="#FF8A50" />
                    <Text className="text-primary font-black text-sm ml-2">
                      Share
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Additional Product Stats (Dynamic) - 2 Column Grid */}
              <View className="px-1 flex-row flex-wrap">
                <View className="w-1/2 flex-row items-center mb-4">
                  <View className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800/80 items-center justify-center mr-3">
                    <Feather name="file-text" size={16} color="#64748b" />
                  </View>
                  <Text className="text-slate-700 dark:text-slate-300 font-bold text-sm">
                    {product.pageCount || 0} Pages
                  </Text>
                </View>

                <View className="w-1/2 flex-row items-center mb-4">
                  <View className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800/80 items-center justify-center mr-3">
                    <Feather name="file" size={16} color="#64748b" />
                  </View>
                  <Text className="text-slate-700 dark:text-slate-300 font-bold text-sm">
                    {formatFileSize(product.fileSizeBytes)} PDF
                  </Text>
                </View>

                <View className="w-1/2 flex-row items-center">
                  <View className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800/80 items-center justify-center mr-3">
                    <Feather name="globe" size={16} color="#64748b" />
                  </View>
                  <Text className="text-slate-700 dark:text-slate-300 font-bold text-sm">
                    {product.language || "English"}
                  </Text>
                </View>

                <View className="w-1/2 flex-row items-center">
                  <View className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800/80 items-center justify-center mr-3">
                    <Feather name="download" size={16} color="#64748b" />
                  </View>
                  <Text className="text-slate-700 dark:text-slate-300 font-bold text-sm">
                    {product.totalPurchases || 0} Downloads
                  </Text>
                </View>
              </View>

              {product?.pdfUrl && product?.previewPages > 0 && (
                <View className="mt-6 bg-green-50/80 dark:bg-green-900/10 p-3.5 rounded-2xl border border-green-100 dark:border-green-800/30 flex-row items-center">
                  <Feather name="check-circle" size={16} color="#10B981" />
                  <Text className="ml-2.5 text-green-700 dark:text-green-400 font-bold text-[13px]">
                    Includes {product.previewPages || 0} preview pages
                  </Text>
                </View>
              )}
            </View>

            <Modal
              visible={previewVisible}
              animationType="slide"
              onRequestClose={() => setPreviewVisible(false)}
            >
              <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
                <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
                  <Text className="text-base font-bold text-slate-800 dark:text-white">
                    Preview
                  </Text>
                  <TouchableOpacity onPress={() => setPreviewVisible(false)}>
                    <Feather name="x" size={22} color="#64748b" />
                  </TouchableOpacity>
                </View>
                <PDFPreview
                  pdfUrl={product.pdfUrl}
                  maxPages={product.previewPages || 3}
                  style={{ flex: 1 }}
                />
              </SafeAreaView>
            </Modal>

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
                <View className="bg-white dark:bg-slate-800 rounded-[28px] p-8 w-full max-w-sm items-center shadow-2xl">
                  {enrollResult.success ? (
                    <>
                      <View className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center mb-5">
                        <Feather
                          name="check-circle"
                          size={32}
                          color="#10B981"
                        />
                      </View>
                      <Text className="text-2xl font-black text-slate-800 dark:text-white mb-2">
                        Purchase Successful!
                      </Text>
                      <Text className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-1">
                        Order ID #{enrollResult.orderId}
                      </Text>
                      <Text className="text-slate-500 dark:text-slate-400 text-center text-sm leading-5 mb-6">
                        Your note is now available for download from the
                        dashboard.
                      </Text>
                      <TouchableOpacity
                        className="bg-green-500 w-full h-14 rounded-2xl items-center justify-center mb-3"
                        onPress={() => {
                          setEnrollResult((prev) => ({
                            ...prev,
                            visible: false,
                          }));
                          router.push("/(user)" as any);
                        }}
                      >
                        <Text className="text-white font-black text-base">
                          Go to Dashboard
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="w-full h-12 rounded-2xl items-center justify-center"
                        onPress={() =>
                          setEnrollResult((prev) => ({
                            ...prev,
                            visible: false,
                          }))
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
                        <Feather
                          name="alert-circle"
                          size={32}
                          color="#EF4444"
                        />
                      </View>
                      <Text className="text-2xl font-black text-slate-800 dark:text-white mb-2">
                        Enrollment Failed
                      </Text>
                      <Text className="text-slate-500 dark:text-slate-400 text-center text-sm leading-5 mb-6">
                        {enrollResult.message}
                      </Text>
                      <TouchableOpacity
                        className="bg-primary w-full h-14 rounded-2xl items-center justify-center"
                        onPress={() =>
                          setEnrollResult((prev) => ({
                            ...prev,
                            visible: false,
                          }))
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

            {/* Related Products Section */}
            {relatedProducts.length > 0 && (
              <View className="mt-4">
                <View className="h-[1px] bg-gray-100 dark:bg-slate-800 mb-10" />
                <Text className="text-3xl font-black text-slate-800 dark:text-white mb-8">
                  Related Products
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 24 }}
                >
                  {relatedProducts.map((p, i) => (
                    <View key={p.id || i} style={{ width: 320 }}>
                      <ProductCard product={p} />
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default ProductDetails;
