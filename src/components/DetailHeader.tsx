import { themeColors } from "@/constants/theme";
import Feather from "@react-native-vector-icons/feather";
import { router, type Href } from "expo-router";
import { useColorScheme } from "nativewind";
import { StatusBar, Text, TouchableOpacity, View } from "react-native";

type Props = {
  title: string;
  onShare?: () => void;
};

const DetailHeader = ({ title, onShare }: Props) => {
  const { colorScheme } = useColorScheme();
  const c = themeColors(colorScheme);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(main)" as Href);
  };

  return (
    <View className="flex-row items-center justify-between px-4 py-2.5 bg-paper dark:bg-night border-b border-line dark:border-night-line">
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={c.page}
      />
      <TouchableOpacity
        onPress={goBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        className="w-10 h-10 rounded-full items-center justify-center bg-sand dark:bg-night-raised"
      >
        <Feather name="chevron-left" size={22} color={c.ink} />
      </TouchableOpacity>
      <Text
        numberOfLines={1}
        className="flex-1 mx-3 text-center text-base font-bold text-ink dark:text-white"
      >
        {title}
      </Text>
      {onShare ? (
        <TouchableOpacity
          onPress={onShare}
          accessibilityRole="button"
          accessibilityLabel="Share"
          className="w-10 h-10 rounded-full items-center justify-center bg-sand dark:bg-night-raised"
        >
          <Feather name="share-2" size={18} color={c.ink} />
        </TouchableOpacity>
      ) : (
        <View className="w-10 h-10" />
      )}
    </View>
  );
};

export default DetailHeader;
