import BundleCrossSell from "@/components/BundleCrossSell";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import StudyNotePreview, {
  type StudyNoteFileSummary,
} from "@/components/StudyNotePreview";
import { useAuth } from "@/context/AuthContext";
import { useAddToCart } from "@/hooks/useAddToCart";
import { useBuildShareUrl } from "@/hooks/useBuildShareUrl";
import Feather from "@react-native-vector-icons/feather";
import Ionicons from "@react-native-vector-icons/ionicons";
import MaterialIcons from "@react-native-vector-icons/material-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Share,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

interface Product {
  category: string;
  description: string;
  fileSizeBytes: number;
  id: number;
  language: string;
  pageCount: number;
  previewPages: number | null;
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
  teacherId?: number;
  teacherIsVerified: boolean;
  teacherVerified: boolean;
  teacherAcademyName: string | null;
  thumbnailUrl: string;
  title: string;
  totalPurchases: number;
  disclaimer: string | null;
  fileCount?: number;
  files?: StudyNoteFileSummary[];
}

interface Review {
  id: number;
  reviewerName: string;
  rating: number;
  reviewText: string | null;
  createdAt: string;
  userId: number;
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
  const [reviews, setReviews] = useState<Review[]>([]);
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
  const buildShareUrl = useBuildShareUrl();

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${BASE_URL}/_api/shop/details?slug=${slug}`,
        );
        const data = await response.json();
        const payload = data.json || data;
        // console.log("Fetched product details:", payload.product);
        setProduct(payload.product);
        setReviews(payload.reviews || []);

        if (payload.product?.category) {
          const listResponse = await fetch(
            `${BASE_URL}/_api/shop/list?limit=5&category=${payload.product.category.replace(/ /g, "+")}`,
          );
          const listData = await listResponse.json();
          const listPayload = listData.json || listData;
          setRelatedProducts(
            listPayload.products?.filter((p: any) => p.slug !== slug) || [],
          );
        }
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
        message: `Check out this study note: ${product?.title}\n${buildShareUrl(`${BASE_URL}/study-notes/${product?.slug}`)}`,
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

  const hasPreview = (product.previewPages ?? 0) > 0;

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 KB";
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(2)} KB`;
  };

  const renderInlineMarkdown = (text: string): React.ReactNode[] => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return (
          <Text key={i} className="font-black text-slate-800 dark:text-white">
            {part.slice(2, -2)}
          </Text>
        );
      }
      return part;
    });
  };

  const renderRichDescription = (raw: string) => {
    const cleaned = raw
      .replace(/<[^>]*>?/gm, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\r\n/g, "\n")
      // Collapse 3+ asterisks (e.g., ****) down to **
      .replace(/\*{3,}/g, "**")
      // Drop empty bold pairs
      .replace(/\*\*\s*\*\*/g, "")
      // Put --- on its own line
      .replace(/-{3,}/g, "\n---\n")
      // Put ### on its own line
      .replace(/###\s*/g, "\n### ")
      // Break before "- " bullets that follow a word and lead with an emoji marker
      .replace(/(\S)\s*-\s+(?=[☀-➿\u{1F300}-\u{1FAFF}])/gu, "$1\n- ")
      // Break before "**Section** — " style headings inline with previous text
      .replace(/(\S)\s*(?=\*\*[A-Z][^*\n]+\*\*\s*[—–-])/g, "$1\n")
      .replace(/\n{2,}/g, "\n");

    const lines = cleaned
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    return lines.map((line, idx) => {
      // Strip orphan ** that have no matching pair on this line
      const pairs: string[] = [];
      let processed = line.replace(/\*\*[^*]+\*\*/g, (m) => {
        pairs.push(m);
        return `\0${pairs.length - 1}\x01`;
      });
      processed = processed.replace(/\*+/g, "");
      processed = processed.replace(/\0(\d+)\x01/g, (_, i) => pairs[Number(i)]);
      processed = processed.trim();
      if (!processed) return null;

      if (/^-{3,}$/.test(processed)) {
        return (
          <View key={idx} className="h-px bg-gray-200 dark:bg-slate-700 my-2" />
        );
      }
      if (processed.startsWith("### ")) {
        return (
          <Text
            key={idx}
            className="text-lg font-black text-slate-800 dark:text-white mt-3 mb-2"
          >
            {renderInlineMarkdown(processed.slice(4))}
          </Text>
        );
      }
      if (/^[-•*]\s+/.test(processed)) {
        const content = processed.replace(/^[-•*]\s+/, "");
        return (
          <View key={idx} className="flex-row mb-2">
            <Text className="text-primary text-base mr-2.5 leading-7">•</Text>
            <Text className="flex-1 text-slate-600 dark:text-slate-300 text-base leading-7">
              {renderInlineMarkdown(content)}
            </Text>
          </View>
        );
      }
      return (
        <Text
          key={idx}
          className="text-slate-600 dark:text-slate-300 text-base leading-7 mb-2"
        >
          {renderInlineMarkdown(processed)}
        </Text>
      );
    });
  };

  const decodeEntities = (text: string) =>
    text
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .trim();

  const renderInlineHtml = (segment: string, keyPrefix: string) => {
    const nodes: React.ReactNode[] = [];
    const regex = /<(strong|b|em|i)>([\s\S]*?)<\/\1>/gi;
    let lastIndex = 0;
    let idx = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(segment))) {
      if (m.index > lastIndex) {
        const plain = decodeEntities(
          segment.slice(lastIndex, m.index).replace(/<[^>]*>/g, ""),
        );
        if (plain) nodes.push(plain);
      }
      const tag = m[1].toLowerCase();
      const inner = decodeEntities(m[2].replace(/<[^>]*>/g, ""));
      if (inner) {
        nodes.push(
          tag === "em" || tag === "i" ? (
            <Text key={`${keyPrefix}-${idx++}`} className="italic">
              {inner}
            </Text>
          ) : (
            <Text
              key={`${keyPrefix}-${idx++}`}
              className="font-black text-slate-800 dark:text-white"
            >
              {inner}
            </Text>
          ),
        );
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < segment.length) {
      const plain = decodeEntities(
        segment.slice(lastIndex).replace(/<[^>]*>/g, ""),
      );
      if (plain) nodes.push(plain);
    }
    return nodes;
  };

  const renderHtmlDescription = (html: string) => {
    const cleaned = html.replace(/\r?\n/g, " ").trim();
    if (!cleaned) return null;

    const blockRegex =
      /<(h2|h3|h4|p)[^>]*>([\s\S]*?)<\/\1>|<(ul|ol)[^>]*>([\s\S]*?)<\/\3>/gi;
    const blocks: { type: string; content: string }[] = [];
    let m: RegExpExecArray | null;
    while ((m = blockRegex.exec(cleaned))) {
      if (m[1]) {
        blocks.push({ type: m[1].toLowerCase(), content: m[2] });
      } else if (m[3]) {
        blocks.push({ type: m[3].toLowerCase(), content: m[4] });
      }
    }
    if (blocks.length === 0) {
      blocks.push({ type: "p", content: cleaned });
    }

    return blocks.map((block, i) => {
      if (block.type === "h2" || block.type === "h3" || block.type === "h4") {
        const sizeClass =
          block.type === "h2"
            ? "text-xl mt-1"
            : block.type === "h3"
              ? "text-lg mt-4"
              : "text-base mt-3";
        return (
          <Text
            key={i}
            className={`${sizeClass} font-black text-slate-800 dark:text-white mb-2`}
          >
            {renderInlineHtml(block.content, `b${i}`)}
          </Text>
        );
      }

      if (block.type === "ul" || block.type === "ol") {
        const items = [
          ...block.content.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi),
        ].map((li) => li[1].replace(/<\/?p>/gi, "").trim());
        return (
          <View key={i} className="mb-2">
            {items.map((item, j) => (
              <View key={j} className="flex-row mb-2">
                <Text className="text-primary text-base mr-2.5 leading-7">
                  •
                </Text>
                <Text className="flex-1 text-slate-600 dark:text-slate-300 text-base leading-7">
                  {renderInlineHtml(item, `b${i}-${j}`)}
                </Text>
              </View>
            ))}
          </View>
        );
      }

      return (
        <Text
          key={i}
          className="text-slate-600 dark:text-slate-300 text-base leading-7 mb-3"
        >
          {renderInlineHtml(block.content, `b${i}`)}
        </Text>
      );
    });
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
          <View className="px-6 pt-4">
            {/* Category Badge */}
            <View className="self-start bg-slate-900/90 dark:bg-white px-5 py-2 rounded-full shadow-lg">
              <Text className="text-white dark:text-slate-900 font-black text-xs uppercase tracking-wider">
                {product.category || "Notes"}
              </Text>
            </View>
          </View>

          <View className="px-6 py-6">
            {/* Title Section */}
            <Text className="text-3xl font-black text-slate-800 dark:text-white leading-tight mb-4">
              {product.title}
            </Text>

            {/* Description */}
            {product.shortDescription || product.description ? (
              <View className="mb-4">
                {renderRichDescription(
                  product.shortDescription || product.description || "",
                )}
              </View>
            ) : (
              <Text className="text-slate-600 dark:text-slate-300 text-base leading-7 mb-4">
                No description available for this product.
              </Text>
            )}

            <View className="h-[1px] bg-gray-50 dark:bg-slate-800 mb-4" />

            {/* About the Author Card */}
            <View className="mb-8">
              <Text className="text-2xl font-black text-slate-800 dark:text-white mb-4">
                About the Author
              </Text>
              <View className="bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 rounded-xl p-5">
                <TouchableOpacity
                  onPress={() =>
                    router.push(`/expert/${product.teacherSlug}` as any)
                  }
                  className="flex-row items-center"
                >
                  <Image
                    source={{
                      uri:
                        product?.teacherAvatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(product.teacherName)}&background=FF8A50&color=fff`,
                    }}
                    className="w-14 h-14 rounded-2xl"
                  />
                  <View className="ml-4 flex-1">
                    <View className="flex-row items-center">
                      <Text className="text-slate-800 dark:text-white font-black text-base">
                        {product.teacherName || "Author"}
                      </Text>
                      {(product.teacherIsVerified ||
                        product.teacherVerified) && (
                        <MaterialIcons
                          name="verified"
                          size={15}
                          color="#22C55E"
                          style={{ marginLeft: 4 }}
                        />
                      )}
                    </View>
                    {product.teacherAcademyName && (
                      <Text className="text-slate-400 text-xs font-medium mt-0.5">
                        {product.teacherAcademyName}
                      </Text>
                    )}
                  </View>
                  <Feather name="chevron-right" size={20} color="#FF8A50" />
                </TouchableOpacity>

                {product.teacherBio && (
                  <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-6 mt-4 pt-4 border-t border-gray-200 dark:border-slate-700/50 px-1">
                    {product.teacherBio}
                  </Text>
                )}
              </View>
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
                      <Feather name="book-open" size={18} color="white" />
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
                      router.push("/user/cart");
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

              <View className="flex-row items-center mb-6">
                {hasPreview && (
                  <TouchableOpacity
                    className="flex-1 h-14 rounded-2xl bg-transparent border border-orange-100 dark:border-orange-400/20 items-center justify-center mr-2 shadow-sm shadow-orange-500/10"
                    onPress={() => setPreviewVisible(true)}
                  >
                    <View className="flex-row items-center">
                      <Feather name="eye" size={18} color="#FF8A50" />
                      <Text className="text-primary font-black text-base ml-2">
                        Preview
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={handleShare}
                  className={`flex-1 h-14 rounded-2xl bg-transparent border border-orange-100 dark:border-orange-400/20 items-center justify-center shadow-sm shadow-orange-500/10 ${hasPreview ? "ml-2" : ""}`}
                >
                  <View className="flex-row items-center">
                    <Feather name="share-2" size={18} color="#FF8A50" />
                    <Text className="text-primary font-black text-base ml-2">
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

                {(product.fileCount ?? 0) > 1 && (
                  <View className="w-1/2 flex-row items-center mt-4">
                    <View className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800/80 items-center justify-center mr-3">
                      <Feather name="layers" size={16} color="#64748b" />
                    </View>
                    <Text className="text-slate-700 dark:text-slate-300 font-bold text-sm">
                      {product.fileCount} Files
                    </Text>
                  </View>
                )}

                {(product.reviewsCount ?? 0) > 0 && (
                  <View className="w-1/2 flex-row items-center mt-4">
                    <View className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800/80 items-center justify-center mr-3">
                      <Ionicons name="star" size={16} color="#F59E0B" />
                    </View>
                    <Text className="text-slate-700 dark:text-slate-300 font-bold text-sm">
                      {product.rating ? product.rating.toFixed(1) : "New"} (
                      {product.reviewsCount} reviews)
                    </Text>
                  </View>
                )}
              </View>

              {hasPreview && (
                <View className="mt-6 bg-green-50/80 dark:bg-green-900/10 p-3.5 rounded-2xl border border-green-100 dark:border-green-800/30 flex-row items-center">
                  <Feather name="check-circle" size={16} color="#10B981" />
                  <Text className="ml-2.5 text-green-700 dark:text-green-400 font-bold text-[13px]">
                    Includes {product.previewPages || 0} preview pages
                  </Text>
                </View>
              )}
            </View>

            {/* Long Description */}
            {product.description ? (
              <View className="mb-8">
                <Text className="text-2xl font-black text-slate-800 dark:text-white mb-4">
                  Description
                </Text>
                {renderHtmlDescription(product.description)}
              </View>
            ) : null}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <View className="mb-8">
                <Text className="text-2xl font-black text-slate-800 dark:text-white mb-4">
                  Tags
                </Text>
                <View className="flex-row flex-wrap">
                  {product.tags.map((tag: string, i: number) => (
                    <View
                      key={i}
                      className="bg-cyan-50 dark:bg-cyan-900/20 px-4 py-2 rounded-full border border-cyan-100 dark:border-cyan-800/30 mr-2 mb-2"
                    >
                      <Text className="text-cyan-600 dark:text-cyan-400 font-bold text-xs">
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <View className="mb-8">
                <Text className="text-2xl font-black text-slate-800 dark:text-white mb-4">
                  Student Reviews
                </Text>

                {/* Rating Summary Card */}
                <View className="bg-white dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/80 rounded-[28px] p-6 mb-4 shadow-lg shadow-slate-200/50 dark:shadow-none">
                  <View className="items-center mb-4">
                    <Text className="text-5xl font-black text-slate-800 dark:text-white">
                      {(product.rating ?? 0).toFixed(1)}
                    </Text>
                    <View className="flex-row items-center mt-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Ionicons
                          key={i}
                          name="star"
                          size={18}
                          color={
                            i < Math.round(product.rating ?? 0)
                              ? "#F59E0B"
                              : "#E2E8F0"
                          }
                        />
                      ))}
                    </View>
                    <Text className="text-slate-400 text-sm font-medium mt-2">
                      {product.reviewsCount}{" "}
                      {product.reviewsCount === 1 ? "review" : "reviews"}
                    </Text>
                  </View>

                  <View className="h-[1px] bg-gray-50 dark:bg-slate-700/50 mb-4" />

                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviews.filter(
                      (r) => Math.round(r.rating) === star,
                    ).length;
                    const pct = reviews.length
                      ? (count / reviews.length) * 100
                      : 0;
                    return (
                      <View key={star} className="flex-row items-center mb-2.5">
                        <View className="flex-row items-center w-8">
                          <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold mr-1">
                            {star}
                          </Text>
                          <Ionicons name="star" size={11} color="#F59E0B" />
                        </View>
                        <View className="flex-1 h-2 bg-gray-100 dark:bg-slate-700 rounded-full mx-3 overflow-hidden">
                          <View
                            className="h-full bg-amber-400 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </View>
                        <Text className="text-slate-400 text-xs font-bold w-4 text-right">
                          {count}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* Individual Reviews */}
                {reviews.map((review) => (
                  <View
                    key={review.id}
                    className="flex-row items-start py-3 border-b border-gray-50 dark:border-slate-800"
                  >
                    <View className="w-11 h-11 rounded-full bg-primary items-center justify-center mr-3">
                      <Text className="text-white font-black text-base">
                        {review.reviewerName?.charAt(0).toUpperCase() || "?"}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-800 dark:text-white font-black text-sm">
                        {review.reviewerName}
                      </Text>
                      <Text className="text-slate-400 text-xs font-medium mt-0.5">
                        {new Date(review.createdAt).toLocaleDateString("en-GB")}
                      </Text>
                      {review.reviewText && (
                        <Text className="text-slate-600 dark:text-slate-300 text-sm leading-6 mt-2">
                          {review.reviewText}
                        </Text>
                      )}
                    </View>
                    <View className="flex-row items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Ionicons
                          key={i}
                          name="star"
                          size={13}
                          color={i < review.rating ? "#F59E0B" : "#E2E8F0"}
                        />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Disclaimer */}
            {product.disclaimer ? (
              <View className="mb-8 rounded-2xl overflow-hidden border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/5">
                <View className="flex-row items-center px-4 py-3 bg-amber-100/60 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20">
                  <View className="w-8 h-8 rounded-full bg-amber-500 items-center justify-center mr-3">
                    <Feather name="alert-triangle" size={16} color="white" />
                  </View>
                  <Text className="text-amber-900 dark:text-amber-300 font-black text-sm uppercase tracking-wider">
                    Disclaimer
                  </Text>
                </View>
                <Text className="px-4 py-4 text-amber-900/80 dark:text-amber-200/80 text-[13px] leading-6 font-medium">
                  {product.disclaimer
                    .replace(/^\s*disclaimer\s*:\s*/i, "")
                    .replace(/<[^>]*>?/gm, "")
                    .trim()}
                </Text>
              </View>
            ) : null}

            <Modal
              visible={previewVisible}
              animationType="slide"
              onRequestClose={() => setPreviewVisible(false)}
            >
              <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
                <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
                  <Text
                    numberOfLines={1}
                    className="flex-1 mr-3 text-base font-bold text-slate-800 dark:text-white"
                  >
                    Preview: {product.title}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setPreviewVisible(false)}
                    accessibilityRole="button"
                    accessibilityLabel="Close preview"
                  >
                    <Feather name="x" size={22} color="#64748b" />
                  </TouchableOpacity>
                </View>
                <StudyNotePreview
                  productId={product.id}
                  previewPages={product.previewPages ?? 0}
                  files={product.files ?? []}
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
                        Your note is now available in your dashboard.
                      </Text>
                      <TouchableOpacity
                        className="bg-green-500 w-full h-14 rounded-2xl items-center justify-center mb-3"
                        onPress={() => {
                          setEnrollResult((prev) => ({
                            ...prev,
                            visible: false,
                          }));
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

            {/* Bundles that include these notes */}
            <BundleCrossSell
              itemType="digital_product"
              itemId={product.id}
              teacherId={product.teacherId}
            />

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
                    <View key={p.id || i} className="w-[320px] mr-5">
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
