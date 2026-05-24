import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import Feather from "@react-native-vector-icons/feather";
import { useColorScheme } from "nativewind";
import { useRouter, Link } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useCartContext } from "@/context/CartContext";

const Header = () => {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const { user } = useAuth();
  const { itemCount } = useCartContext();
  const router = useRouter();

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (user) {
      setIsLoggedIn(true);
    }
  }, [user]);

  return (
    <View className="flex-row items-center justify-between px-5 py-4 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
      <View className="flex-row items-center">
        <Link href={"/" as any} asChild>
          <TouchableOpacity>
            <Image
              source={{
                uri:
                  colorScheme === "dark"
                    ? "https://ik.imagekit.io/testkart/brand/testkart-new-white.png"
                    : "https://ik.imagekit.io/testkart/brand/testkart-new-black.png",
              }}
              className="w-[140px] h-[40px]"
              resizeMode="contain"
            />
          </TouchableOpacity>
        </Link>
      </View>
      <View className="flex-row items-center">
        <TouchableOpacity
          className="p-2 rounded-full active:bg-gray-100 dark:active:bg-slate-800"
          onPress={toggleColorScheme}
        >
          <Feather
            name={colorScheme === "dark" ? "moon" : "sun"}
            size={24}
            color={colorScheme === "dark" ? "#FFFFFF" : "#1A1A1A"}
          />
        </TouchableOpacity>

        {isLoggedIn ? (
          <>
            <TouchableOpacity
              className="ml-2 p-2 rounded-full active:bg-gray-100 dark:active:bg-slate-800 relative"
              onPress={() => router.push("/user/cart")}
            >
              <Feather
                name="shopping-cart"
                size={22}
                color={colorScheme === "dark" ? "#FFFFFF" : "#1A1A1A"}
              />
              {itemCount > 0 && (
                <View className="absolute top-1 right-1 bg-red-500 min-w-4 h-4 rounded-full items-center justify-center px-1 border-2 border-white dark:border-slate-900 shadow-sm">
                  <Text className="text-white text-[9px] font-black leading-none">
                    {itemCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              className="ml-3 pointer-events-auto"
              onPress={() => router.push("/user")}
            >
              {user?.avatarUrl ? (
                <View className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary shadow-sm">
                  <Image
                    source={{ uri: user.avatarUrl }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>
              ) : (
                <View className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 items-center justify-center border border-gray-200 dark:border-slate-700">
                  <Feather
                    name="user"
                    size={24}
                    color={colorScheme === "dark" ? "#FFFFFF" : "#1A1A1A"}
                  />
                </View>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <Link href="/login" asChild>
            <TouchableOpacity className="px-5 py-2 rounded-xl border border-gray-200 dark:border-slate-700 active:bg-gray-50 dark:active:bg-slate-800 ml-2">
              <Text className="text-base font-bold text-slate-800 dark:text-white">
                Log In
              </Text>
            </TouchableOpacity>
          </Link>
        )}
      </View>
    </View>
  );
};

export default Header;
