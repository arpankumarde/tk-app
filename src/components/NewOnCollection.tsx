import CourseCard from "@/components/CourseCard";
import LiveTestCard from "@/components/LiveTestCard";
import MockTestCard from "@/components/MockTestCard";
import ProductCard from "@/components/ProductCard";
import { useColorScheme } from "nativewind";
import { Text, View } from "react-native";

export type NewOnCollectionType = "test" | "course" | "liveTest" | "product";

const SECTION_TITLES: Record<NewOnCollectionType, string> = {
  test: "New Mock Tests",
  course: "New Courses",
  liveTest: "New Live Tests",
  product: "New Study Materials",
};

interface NewOnCollectionProps {
  type: NewOnCollectionType;
  items: any[];
}

const NewOnCollection = ({ type, items }: NewOnCollectionProps) => {
  const { colorScheme } = useColorScheme();

  if (!items || items.length === 0) return null;

  return (
    <View className="bg-white dark:bg-slate-900 pb-4">
      <View className="px-6 pt-2 pb-4">
        <Text className="text-2xl font-black text-slate-800 dark:text-white">
          {SECTION_TITLES[type]}
        </Text>
      </View>

      {items.map((item, index) => {
        const key = item.id ? `${type}-${item.id}` : index;
        switch (type) {
          case "test":
            return <MockTestCard key={key} test={item} />;
          case "course":
            return (
              <View key={key} className="px-6">
                <CourseCard course={item} />
              </View>
            );
          case "liveTest":
            return (
              <View key={key} className="px-6">
                <LiveTestCard test={item} colorScheme={colorScheme} />
              </View>
            );
          default:
            return (
              <View key={key} className="px-6">
                <ProductCard product={item} className="mb-6" />
              </View>
            );
        }
      })}
    </View>
  );
};

export default NewOnCollection;
