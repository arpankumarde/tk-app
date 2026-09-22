import { View, Text, TouchableOpacity } from "react-native";
import Feather from "@react-native-vector-icons/feather";
import { useColorScheme } from "nativewind";

interface ReaderHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  /** `x` for a modal, `arrow-left` for a pushed screen. */
  icon?: "arrow-left" | "x";
}

/** Top bar shared by every screen that shows a DocumentViewer full screen. */
export default function ReaderHeader({
  title,
  subtitle,
  onClose,
  icon = "arrow-left",
}: ReaderHeaderProps) {
  const { colorScheme } = useColorScheme();

  return (
    <View className="flex-row items-center border-b border-gray-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
      <TouchableOpacity
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={icon === "x" ? "Close" : "Back"}
        className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
      >
        <Feather
          name={icon}
          size={18}
          color={colorScheme === "dark" ? "#fff" : "#1A1A1A"}
        />
      </TouchableOpacity>
      <View className="ml-3 flex-1">
        <Text
          className="text-base font-black text-slate-800 dark:text-white"
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            className="text-xs font-bold text-[#903209] dark:text-orange-300"
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}
