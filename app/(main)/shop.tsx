import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import Header from '../../components/Header';
import BottomTabs from '../../components/BottomTabs';
import ProductCard from '../../components/ProductCard';

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

const SORT_OPTIONS = [
    { label: 'New Arrival', value: 'newest' },
    { label: 'Most Popular', value: 'popular' },
    { label: 'Price High to Low', value: 'price_desc' },
    { label: 'Price Low to High', value: 'price_asc' },
];

const ShopScreen = () => {
    const { colorScheme } = useColorScheme();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [sort, setSort] = useState('newest');
    const [showSortModal, setShowSortModal] = useState(false);
    const [showFilterSidebar, setShowFilterSidebar] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>(['All Categories']);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState('All Languages');

    const categories = [
        'All Categories', 'Study Material', 'Question Bank', 'Notes',
        'eBooks', 'Practice Papers', 'Reference Material', 'Other'
    ];

    const languages = [
        'All Languages', 'Hindi', 'English', 'Tamil', 'Telugu',
        'Marathi', 'Bengali', 'Gujarati', 'Others'
    ];

    const [showLanguageModal, setShowLanguageModal] = useState(false);

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategories(['All Categories']);
        setMinPrice('');
        setMaxPrice('');
        setSelectedLanguage('All Languages');
    };

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const url = `${BASE_URL}/_api/shop/list?sort=${sort}`;
            console.log("Fetching products from:", url);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("API Response Data:", JSON.stringify(data).substring(0, 500));

            // Fix: The log shows the data is inside a "json" field
            const payload = data.json || data;
            const productList = payload.products || payload.data?.products || [];
            const count = payload.totalCount || payload.data?.totalCount || productList.length;

            setProducts(productList);
            setTotalCount(count);

            if (productList.length === 0) {
                console.warn("No products returned from API");
            }
        } catch (error: any) {
            console.error("Error fetching products:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [sort]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const activeSortLabel = SORT_OPTIONS.find(opt => opt.value === sort)?.label;

    return (
        <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-white dark:bg-slate-900">
            <StatusBar
                barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor={colorScheme === 'dark' ? '#0f172a' : '#ffffff'}
            />
            <Header />
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-white dark:bg-slate-900">
                {/* Hero Section */}
                <View className="px-6 py-8 items-center">
                    <Text className="text-4xl font-extrabold text-slate-800 dark:text-white text-center leading-tight">
                        Buy Study Notes{"\n"}Online
                    </Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-center mt-3 text-base leading-6 px-4">
                        Premium study resources, notes, and eBooks for your exam preparation.
                    </Text>
                </View>

                {/* Filters & Sorting */}
                <View className="px-5 mb-8 flex-row items-center">
                    <TouchableOpacity
                        onPress={() => setShowFilterSidebar(true)}
                        className="flex-row items-center border border-orange-200 dark:border-orange-800/80 bg-white dark:bg-slate-800 px-4 py-2.5 rounded-xl mr-3 shadow-sm"
                    >
                        <Feather name="filter" size={16} color="#FF8A50" />
                        <Text className="ml-2 text-primary font-bold text-sm">Filters</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setShowSortModal(true)}
                        className="flex-row items-center border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 rounded-xl flex-1 shadow-sm justify-between"
                    >
                        <Text className="text-slate-600 dark:text-slate-300 font-bold text-sm" numberOfLines={1}>
                            {activeSortLabel}
                        </Text>
                        <Feather name="chevron-down" size={16} color={colorScheme === 'dark' ? '#94a3b8' : '#64748b'} />
                    </TouchableOpacity>
                </View>

                {error && (
                    <View className="mx-6 mb-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl">
                        <Text className="text-red-600 dark:text-red-400 text-center font-medium">Error: {error}</Text>
                        <TouchableOpacity onPress={fetchProducts} className="mt-2">
                            <Text className="text-primary text-center font-bold underline">Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View className="px-6 mb-4">
                    <Text className="text-slate-600 dark:text-slate-400 text-base">
                        Found <Text className="text-slate-900 dark:text-white font-black">{totalCount}</Text> products
                    </Text>
                </View>

                {/* Product List */}
                {loading ? (
                    <View className="flex-1 items-center justify-center py-10">
                        <ActivityIndicator size="large" color="#FF8A50" />
                    </View>
                ) : (
                    <View className="pb-10">
                        {products.length > 0 ? (
                            products.map((product, index) => (
                                <ProductCard key={product.slug || index} product={product} />
                            ))
                        ) : (
                            <View className="items-center justify-center py-20 px-8">
                                <View className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-full items-center justify-center mb-6">
                                    <Feather name="shopping-bag" size={40} color={colorScheme === 'dark' ? '#334155' : '#cbd5e1'} />
                                </View>
                                <Text className="text-xl font-bold text-slate-800 dark:text-white mb-2 text-center">No products found</Text>
                                <Text className="text-slate-500 dark:text-slate-400 text-center">Try adjusting your filters or sorting to find what you're looking for.</Text>
                                <TouchableOpacity onPress={fetchProducts} className="mt-6 px-6 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-full">
                                    <Text className="text-primary font-bold">Refresh</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                <View className="h-10" />
            </ScrollView>
            <BottomTabs />

            {/* Sort Dropdown (Absolute instead of Modal) */}
            {showSortModal && (
                <View className="absolute inset-0 z-[110] justify-center items-center px-10">
                    <Pressable
                        onPress={() => setShowSortModal(false)}
                        className="absolute inset-0 bg-black/20"
                    />
                    <View className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-[280px] p-2 shadow-2xl border border-gray-100 dark:border-slate-700">
                        <View className="p-4 border-b border-gray-50 dark:border-slate-700/50">
                            <Text className="text-base font-black text-slate-800 dark:text-white">Sort by</Text>
                        </View>

                        {SORT_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                onPress={() => {
                                    setSort(option.value);
                                    setShowSortModal(false);
                                }}
                                className={`flex-row items-center justify-between px-4 py-3.5 rounded-2xl ${sort === option.value
                                        ? 'bg-orange-50 dark:bg-orange-900/20'
                                        : ''
                                    }`}
                            >
                                <Text className={`text-sm font-bold ${sort === option.value ? 'text-primary' : 'text-slate-600 dark:text-slate-300'
                                    }`}>
                                    {option.label}
                                </Text>
                                {sort === option.value && (
                                    <Feather name="check" size={14} color="#FF8A50" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* Filter Sidebar (Absolute instead of Modal) */}
            {showFilterSidebar && (
                <View className="absolute inset-0 z-[100] flex-row">
                    <Pressable
                        onPress={() => setShowFilterSidebar(false)}
                        className="flex-1 bg-black/40"
                    />
                    <View className="w-[85%] bg-white dark:bg-slate-900 h-full shadow-2xl">
                        <SafeAreaView edges={['top', 'bottom']} className="flex-1">
                            <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
                                <View className="flex-row items-center">
                                    <Text className="text-2xl font-black text-slate-800 dark:text-white">Filters</Text>
                                    <TouchableOpacity onPress={clearFilters} className="ml-4 px-3 py-1 bg-gray-50 dark:bg-slate-800 rounded-full">
                                        <Text className="text-xs font-bold text-slate-500 dark:text-slate-400">Clear All</Text>
                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity onPress={() => setShowFilterSidebar(false)}>
                                    <Feather name="x" size={24} color={colorScheme === 'dark' ? '#94a3b8' : '#64748b'} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView className="flex-1 px-6 pt-6">
                                {/* Search */}
                                <View className="mb-8">
                                    <Text className="text-base font-bold text-slate-800 dark:text-white mb-3">Search</Text>
                                    <View className="flex-row items-center bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700 px-4 py-1">
                                        <Feather name="search" size={18} color="#94a3b8" />
                                        <TextInput
                                            value={searchQuery}
                                            onChangeText={setSearchQuery}
                                            placeholder="Search products..."
                                            placeholderTextColor={colorScheme === 'dark' ? '#64748b' : '#94a3b8'}
                                            className="flex-1 ml-3 h-12 text-slate-800 dark:text-white"
                                        />
                                    </View>
                                </View>

                                {/* Category */}
                                <View className="mb-8">
                                    <Text className="text-base font-bold text-slate-800 dark:text-white mb-4">Category</Text>
                                    {categories.map((cat) => (
                                        <TouchableOpacity
                                            key={cat}
                                            onPress={() => {
                                                if (cat === 'All Categories') {
                                                    setSelectedCategories(['All Categories']);
                                                } else {
                                                    let newCats = selectedCategories.filter(c => c !== 'All Categories');
                                                    if (newCats.includes(cat)) {
                                                        newCats = newCats.filter(c => c !== cat);
                                                        if (newCats.length === 0) newCats = ['All Categories'];
                                                    } else {
                                                        newCats.push(cat);
                                                    }
                                                    setSelectedCategories(newCats);
                                                }
                                            }}
                                            className="flex-row items-center mb-4"
                                        >
                                            <View className={`w-6 h-6 rounded-md border items-center justify-center ${selectedCategories.includes(cat)
                                                    ? 'bg-orange-500 border-orange-500'
                                                    : 'border-gray-200 dark:border-slate-700'
                                                }`}>
                                                {selectedCategories.includes(cat) && <Feather name="check" size={14} color="white" />}
                                            </View>
                                            <Text className={`ml-4 text-base ${selectedCategories.includes(cat)
                                                    ? 'text-slate-900 dark:text-white font-bold'
                                                    : 'text-slate-500 dark:text-slate-400'
                                                }`}>{cat}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Price Range */}
                                <View className="mb-8">
                                    <Text className="text-base font-bold text-slate-800 dark:text-white mb-4">Price Range (₹)</Text>
                                    <View className="flex-row items-center space-x-4">
                                        <TextInput
                                            value={minPrice}
                                            onChangeText={setMinPrice}
                                            placeholder="Min"
                                            placeholderTextColor="#94a3b8"
                                            keyboardType="numeric"
                                            className="flex-1 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700 px-4 py-4 text-slate-800 dark:text-white"
                                        />
                                        <Text className="text-slate-400 mx-2">-</Text>
                                        <TextInput
                                            value={maxPrice}
                                            onChangeText={setMaxPrice}
                                            placeholder="Max"
                                            placeholderTextColor="#94a3b8"
                                            keyboardType="numeric"
                                            className="flex-1 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700 px-4 py-4 text-slate-800 dark:text-white"
                                        />
                                    </View>
                                </View>

                                {/* Language */}
                                <View className="mb-10">
                                    <Text className="text-base font-bold text-slate-800 dark:text-white mb-4">Language</Text>
                                    <TouchableOpacity
                                        onPress={() => setShowLanguageModal(true)}
                                        className="flex-row items-center justify-between bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700 px-5 py-4"
                                    >
                                        <Text className="text-slate-800 dark:text-white font-medium">{selectedLanguage}</Text>
                                        <Feather name="chevron-down" size={18} color="#94a3b8" />
                                    </TouchableOpacity>
                                </View>

                                <View className="h-10" />
                            </ScrollView>
                        </SafeAreaView>
                    </View>
                </View>
            )}
            {/* Language Selection (Absolute instead of Modal) */}
            {showLanguageModal && (
                <View className="absolute inset-0 z-[120] justify-center items-center px-10">
                    <Pressable
                        onPress={() => setShowLanguageModal(false)}
                        className="absolute inset-0 bg-black/20"
                    />
                    <View className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-[300px] overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-700">
                        <View className="p-5 border-b border-gray-50 dark:border-slate-700/50">
                            <Text className="text-lg font-black text-slate-800 dark:text-white">Select Language</Text>
                        </View>
                        <ScrollView className="max-h-[300px]">
                            {languages.map((lang) => (
                                <TouchableOpacity
                                    key={lang}
                                    onPress={() => {
                                        setSelectedLanguage(lang);
                                        setShowLanguageModal(false);
                                    }}
                                    className={`px-6 py-4 border-b border-gray-50 dark:border-slate-700/30 ${selectedLanguage === lang ? 'bg-orange-50 dark:bg-orange-900/10' : ''
                                        }`}
                                >
                                    <View className="flex-row items-center justify-between">
                                        <Text className={`text-base ${selectedLanguage === lang
                                                ? 'text-primary font-bold'
                                                : 'text-slate-600 dark:text-slate-300'
                                            }`}>{lang}</Text>
                                        {selectedLanguage === lang && <Feather name="check" size={16} color="#FF8A50" />}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
};

export default ShopScreen;
