import { View, Text, TouchableOpacity } from "react-native";
import Feather from "@react-native-vector-icons/feather";
import { router } from "expo-router";
import ProductCard from "./ProductCard";

interface DigitalDownloadsSectionProps {
  products: any[];
}

const DigitalDownloadsSection = ({
  products,
}: DigitalDownloadsSectionProps) => {
  if (!products || products.length === 0) return null;

  return (
    <View className="bg-white dark:bg-slate-900">
      <View className="px-6 pt-10 pb-5 items-center bg-white dark:bg-slate-900">
        <Text className="text-4xl font-black text-slate-800 dark:text-white mb-3 text-center">
          Digital Downloads
        </Text>
        <Text className="text-base text-slate-500 dark:text-slate-400 leading-6 text-center">
          Premium notes, eBooks, and practice resources curated for faster exam prep.
        </Text>
      </View>

      <View className="pb-8 px-6">
        {products.map((product, index) => (
          <ProductCard key={product.slug || index} product={product} className="mb-8" />
        ))}
      </View>

      <TouchableOpacity
        className="mx-12 mb-10 bg-orange-100/50 dark:bg-orange-900/20 py-3 rounded-2xl items-center border border-orange-200 dark:border-orange-800/30 shadow-sm"
        onPress={() => router.push("/shop")}
      >
        <View className="flex-row items-center">
          <Text className="text-primary font-black text-lg mr-2">
            Explore Digital Store
          </Text>
          <Feather name="arrow-right" size={20} color="#FF8A50" />
        </View>
      </TouchableOpacity>
    </View>
  );
};

// <DigitalDownloadCard key={product.id || index} product={product} />;

export default DigitalDownloadsSection;
