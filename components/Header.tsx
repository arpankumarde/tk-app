import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useRouter, Link } from 'expo-router';

const Header = () => {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const router = useRouter();

  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [userProfile, setUserProfile] = React.useState<{ image: string | null } | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoggedIn(true);
      setUserProfile({ image: 'https://avatar.iran.liara.run/public/boy' });
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View className="flex-row items-center justify-between px-5 py-4 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
      <View className="flex-row items-center">
        <Link href={"/" as any} asChild>
          <TouchableOpacity>
            <Image
              source={{
                uri: colorScheme === 'dark'
                  ? 'https://ik.imagekit.io/testkart/brand/testkart-logo-dark_KnLezrS1K.png'
                  : 'https://ik.imagekit.io/testkart/brand/testkart-logo-light_3jHfyYsBp.png'
              }}
              className="w-[130px] h-[40px]"
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
            name={colorScheme === 'dark' ? 'moon' : 'sun'}
            size={24}
            color={colorScheme === 'dark' ? '#FFFFFF' : '#1A1A1A'}
          />
        </TouchableOpacity>

        {isLoggedIn ? (
          <TouchableOpacity
            className="ml-3 pointer-events-auto"
            onPress={() => router.push('/profile' as any)}
          >
            {userProfile?.image ? (
              <View className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary shadow-sm">
                <Image
                  source={{ uri: userProfile.image }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
            ) : (
              <View className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 items-center justify-center border border-gray-200 dark:border-slate-700">
                <Feather
                  name="user"
                  size={24}
                  color={colorScheme === 'dark' ? '#FFFFFF' : '#1A1A1A'}
                />
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <Link href="/login" asChild>
            <TouchableOpacity className="px-5 py-2 rounded-xl border border-gray-200 dark:border-slate-700 active:bg-gray-50 dark:active:bg-slate-800 ml-2">
              <Text className="text-base font-bold text-slate-800 dark:text-white">Log In</Text>
            </TouchableOpacity>
          </Link>
        )}
      </View>
    </View>
  );
};

export default Header;
