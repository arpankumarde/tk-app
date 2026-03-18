import { View, Text, Image, TouchableOpacity } from "react-native";
import { useColorScheme } from "nativewind";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

interface ProductCardProps {
  product: {
    slug: string;
    title: string;
    author: string;
    image: string;
    price: number;
    category: string;
    soldCount: number;
  };
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { colorScheme } = useColorScheme();
  const router = useRouter();

  // Field mappings based on API logs
  const displayImage =
    product.image ||
    (product as any).thumbnailUrl ||
    "https://placehold.co/600x400/001f3f/white?text=No+Image";
  const displayAuthor =
    product.author || (product as any).teacherName || "TestKart Expert";
  const displayCategory = product.category || "Study Material";
  const displayPrice = product.price ?? 0;
  const displaySales = (product as any).totalPurchases || 0;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/product/${product.slug}` as any)}
      className="bg-white dark:bg-slate-800 rounded-3xl mx-5 mb-5 overflow-hidden shadow-sm border border-gray-100 dark:border-slate-700"
    >
      {/* Category Badge */}
      <View className="absolute top-3 left-3 z-10 px-3 py-1.5 bg-white/90 dark:bg-slate-900/90 rounded-full border border-gray-100 dark:border-slate-700/50 shadow-sm">
        <Text className="text-primary text-[10px] font-black uppercase tracking-widest">
          {displayCategory}
        </Text>
      </View>

      {/* Product Image */}
      <View className="w-full h-[220px] bg-slate-50 dark:bg-slate-900/50">
        <Image
          source={{ uri: displayImage }}
          className="w-full h-full"
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
        </View>

        <View className="flex-row items-center justify-between pt-4 border-t border-gray-50 dark:border-slate-700">
          <View className="flex-row items-center">
            <Feather
              name="shopping-bag"
              size={14}
              color={colorScheme === "dark" ? "#94a3b8" : "#64748b"}
            />
            <Text className="ml-1.5 text-slate-500 dark:text-slate-400 text-xs font-semibold">
              {displaySales} sold
            </Text>
          </View>
          {displayPrice === 0 ? (
            <Text className="text-3xl font-black text-green-500">FREE</Text>
          ) : (
            <Text className="text-3xl font-black text-primary">
              ₹ {displayPrice}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ProductCard;
