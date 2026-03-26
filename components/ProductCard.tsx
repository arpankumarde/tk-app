import { View, Text, Image, TouchableOpacity } from "react-native";
import { useColorScheme } from "nativewind";
import { useRouter } from "expo-router";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useAddToCart } from "@/hooks/useAddToCart";

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
  };
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const isFree = (product.price ?? 0) === 0;
  const { addToCart, adding } = useAddToCart();

  const displayImage =
    product?.thumbnailUrl ||
    "https://ik.imagekit.io/testkart/placeholders/study-notes.png";
  const displayAuthor = product?.teacherName || "TestKart Expert";
  const displayCategory = product?.category || "Study Material";
  const displayPrice = product?.price ?? 0;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/product/${product.slug}` as any)}
      className="bg-white dark:bg-slate-800 rounded-3xl mx-5 mb-5 overflow-hidden shadow-sm border border-gray-100 dark:border-slate-700"
    >
      {/* Category Badge */}
      <View className="absolute top-3 left-3 z-10 px-3 py-1.5 bg-slate-900/90 rounded-full shadow-sm">
        <Text className="text-white text-[10px] font-black uppercase tracking-widest">
          {displayCategory}
        </Text>
      </View>

      {/* Product Image with Bottom Border for Definition */}
      <View className="w-full bg-slate-50 dark:bg-slate-900/5 border-b border-slate-100 dark:border-slate-800">
        <Image
          source={{ uri: displayImage }}
          className="w-full aspect-video"
          resizeMode="cover"
        />
      </View>

      <View className="p-5">
        <Text
          className="text-xl font-bold text-slate-800 dark:text-white mb-2 leading-tight"
          numberOfLines={2}
        >
          {product.title}
        </Text>

        <View className="flex-row items-center mb-4">
          <View className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 mr-2 items-center justify-center overflow-hidden">
            <Image
              source={{
                uri:
                  (product as any).teacherAvatar ||
                  `https://ui-avatars.com/api/?name=${displayAuthor}&background=random`,
              }}
              className="w-full h-full"
            />
          </View>
          <Text
            className="text-slate-500 dark:text-slate-400 text-sm flex-1"
            numberOfLines={1}
          >
            {displayAuthor}
          </Text>
          {product.teacherIsVerified && (
            <MaterialIcons name="verified" size={14} color="#22C55E" className="ml-1" />
          )}
        </View>

        <View className="flex-row items-center justify-between pt-4 border-t border-gray-50 dark:border-slate-700">
          <TouchableOpacity
            onPress={async () => {
              if (isFree) {
                router.push(`/product/${product.slug}` as any);
              } else {
                const result = await addToCart(product.id, "digitalProduct");
                if (result.success) {
                  router.push("/(user)/cart" as any);
                }
              }
            }}
            disabled={adding}
            className={`${isFree ? "bg-emerald-500 shadow-emerald-500/30" : "bg-primary shadow-orange-500/30"} flex-row items-center px-6 py-3.5 rounded-xl shadow-lg w-48 mr-4`}
          >
            <Feather
              name={isFree ? "book" : "shopping-cart"}
              size={18}
              color="white"
            />
            <Text className="text-white font-black ml-3 text-sm">
              {isFree ? "Enroll Free" : "Buy Now"}
            </Text>
          </TouchableOpacity>

          <Text
            className={`${isFree ? "text-emerald-500" : "text-slate-800 dark:text-white"} text-xl font-black`}
          >
            {isFree ? "Free" : `₹${product.price}`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ProductCard;
