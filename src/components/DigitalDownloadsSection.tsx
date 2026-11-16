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
    <View className="bg-white dark:bg-night">
      <View className="px-6 pt-10 pb-5 items-center bg-white dark:bg-night">
        <Text className="text-4xl font-extrabold text-ink dark:text-white mb-3 text-center">
          Study Notes
        </Text>
        <Text className="text-base text-ink-soft dark:text-night-soft leading-6 text-center">
          Premium notes, eBooks, and practice resources curated for faster exam prep.
        </Text>
      </View>

      <View className="pb-8 px-6">
        {products.map((product, index) => (
          <ProductCard key={product.slug || index} product={product} />
        ))}
      </View>

      <TouchableOpacity
        className="mx-12 mb-10 bg-clay-tint dark:bg-night-raised py-3 rounded-2xl items-center border border-line dark:border-night-line shadow-sm"
        onPress={() => router.push("/shop")}
      >
        <View className="flex-row items-center">
          <Text className="text-primary-deep dark:text-primary font-extrabold text-lg mr-2">
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
