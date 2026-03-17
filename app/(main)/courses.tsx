import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, Modal, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import Header from '../../components/Header';
import CourseCard from '../../components/CourseCard';
import BottomTabs from '../../components/BottomTabs';

const SORT_OPTIONS = [
    { label: 'Newest', value: 'newest' },
    { label: 'Popular', value: 'popular' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
];

const CourseScreen = () => {
    const { colorScheme } = useColorScheme();
    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState<any[]>([]);
    const [sort, setSort] = useState('newest');
    const [showSortModal, setShowSortModal] = useState(false);
    const [showFilterSidebar, setShowFilterSidebar] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>(['All Categories']);
    const [selectedLevel, setSelectedLevel] = useState('All Levels');
    const [selectedLanguage, setSelectedLanguage] = useState('All Languages');
    const [priceType, setPriceType] = useState('all');

    const categoriesList = [
        'All Categories', 'Technology', 'Business', 'Academic', 'Design', 'Marketing', 'Personal Development'
    ];

    const levels = ['All Levels', 'beginner', 'intermediate', 'advanced'];

    const languages = [
        'All Languages', 'Hindi', 'English', 'Tamil', 'Telugu',
        'Marathi', 'Bengali', 'Gujarati', 'Others'
    ];

    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const [showLevelModal, setShowLevelModal] = useState(false);

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategories(['All Categories']);
        setSelectedLevel('All Levels');
        setSelectedLanguage('All Languages');
        setPriceType('all');
    };

    const fetchCourses = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            let url = `${process.env.EXPO_PUBLIC_BASE_URL}/_api/courses/list?sortBy=${sort}`;

            if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
            if (selectedCategories[0] !== 'All Categories') url += `&category=${encodeURIComponent(selectedCategories.join(','))}`;
            if (selectedLevel !== 'All Levels') url += `&level=${selectedLevel}`;
            if (selectedLanguage !== 'All Languages') url += `&language=${selectedLanguage}`;
            if (priceType !== 'all') url += `&priceType=${priceType}`;

            const response = await fetch(url);
            const data = await response.json();

            // Handle SuperJSON/Nested structure
            const payload = data.json || data;
            const coursesData = payload.courses || [];

            setCourses(coursesData);
        } catch (err) {
            console.error('Fetch Courses Error:', err);
            setError('Failed to load courses. Please check your connection.');
        } finally {
            setLoading(false);
        }
    }, [sort, searchQuery, selectedCategories, selectedLevel, selectedLanguage, priceType]);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-900" edges={['top']}>
            <StatusBar
                barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor={colorScheme === 'dark' ? '#0f172a' : '#ffffff'}
            />
            <Header />

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Header Section */}
                <View className="px-6 pt-6 pb-8">
                    <View className="flex-row items-center justify-between mb-2">
                        <View className="bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-full">
                            <Text className="text-primary text-[10px] font-black uppercase tracking-widest">Premium Learning</Text>
                        </View>
                    </View>
                    <Text className="text-4xl font-black text-slate-800 dark:text-white leading-[48px]">
                        Online Courses
                    </Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-lg font-medium mt-2 leading-6">
                        Master new skills with comprehensive courses designed by expert educators.
                    </Text>
                </View>

                {/* Filters & Sorting */}
                <View className="px-5 mb-8 flex-row items-center">
                    <TouchableOpacity
                        onPress={() => setShowFilterSidebar(true)}
                        className="flex-row items-center border border-orange-200 dark:border-orange-800/80 bg-white dark:bg-slate-800 px-4 py-3 rounded-xl mr-3 shadow-sm flex-1 justify-center"
                    >
                        <Feather name="filter" size={16} color="#FF8A50" />
                        <Text className="ml-2 text-primary font-bold text-sm">Filters</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setShowSortModal(true)}
                        className="flex-row items-center bg-gray-50 dark:bg-slate-800/50 px-5 py-3 rounded-xl flex-1 justify-between border border-gray-100 dark:border-slate-700"
                    >
                        <Text className="text-slate-600 dark:text-slate-300 font-bold text-sm">
                            {SORT_OPTIONS.find(o => o.value === sort)?.label}
                        </Text>
                        <Feather name="chevron-down" size={14} color="#FF8A50" />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                {loading ? (
                    <View className="py-20">
                        <ActivityIndicator size="large" color="#FF8A50" />
                    </View>
                ) : (
                    <View className="px-5 pb-10">
                        {courses.length > 0 ? (
                            courses.map((course, index) => (
                                <CourseCard key={course.slug || index} course={course} />
                            ))
                        ) : (
                            <View className="items-center justify-center py-20 px-8">
                                <View className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-full items-center justify-center mb-6">
                                    <Feather name="video" size={40} color={colorScheme === 'dark' ? '#334155' : '#cbd5e1'} />
                                </View>
                                <Text className="text-xl font-bold text-slate-800 dark:text-white mb-2 text-center">No courses found</Text>
                                <Text className="text-slate-500 dark:text-slate-400 text-center">Try adjusting your filters or sorting to find something new.</Text>
                                <TouchableOpacity onPress={fetchCourses} className="mt-6 px-6 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-full">
                                    <Text className="text-primary font-bold">Refresh</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                <View className="h-10" />
            </ScrollView>
            <BottomTabs />

            {/* Sort Dropdown Modal */}
            <Modal
                visible={showSortModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSortModal(false)}
            >
                <Pressable
                    onPress={() => setShowSortModal(false)}
                    className="flex-1 bg-black/20"
                >
                    <View className="flex-1 justify-center items-center px-10">
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
                </Pressable>
            </Modal>

            {/* Filter Sidebar Modal */}
            <Modal
                visible={showFilterSidebar}
                transparent={true}
                animationType="none"
                onRequestClose={() => setShowFilterSidebar(false)}
            >
                <View className="flex-1 flex-row">
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
                                            placeholder="Search courses..."
                                            placeholderTextColor={colorScheme === 'dark' ? '#64748b' : '#94a3b8'}
                                            className="flex-1 ml-3 h-12 text-slate-800 dark:text-white"
                                        />
                                    </View>
                                </View>

                                {/* Price Type */}
                                <View className="mb-8">
                                    <Text className="text-base font-bold text-slate-800 dark:text-white mb-4">Price Type</Text>
                                    <View className="flex-row p-1 bg-gray-100 dark:bg-slate-800 rounded-2xl">
                                        {['all', 'free', 'paid'].map((type) => (
                                            <TouchableOpacity
                                                key={type}
                                                onPress={() => setPriceType(type)}
                                                className={`flex-1 py-3 rounded-xl items-center ${priceType === type ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}
                                            >
                                                <Text className={`text-xs font-black capitalize ${priceType === type ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}>
                                                    {type}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Level */}
                                <View className="mb-8">
                                    <Text className="text-base font-bold text-slate-800 dark:text-white mb-4">Course Level</Text>
                                    <TouchableOpacity
                                        onPress={() => setShowLevelModal(true)}
                                        className="flex-row items-center justify-between bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700 px-5 py-4"
                                    >
                                        <Text className="text-slate-800 dark:text-white font-medium capitalize">{selectedLevel}</Text>
                                        <Feather name="chevron-down" size={18} color="#94a3b8" />
                                    </TouchableOpacity>
                                </View>

                                {/* Language */}
                                <View className="mb-8">
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

                            <View className="p-6 border-t border-gray-100 dark:border-slate-800">
                                <TouchableOpacity
                                    onPress={() => setShowFilterSidebar(false)}
                                    className="bg-primary h-14 rounded-2xl items-center justify-center shadow-lg shadow-orange-500/30"
                                >
                                    <Text className="text-white text-lg font-black">Apply Filters</Text>
                                </TouchableOpacity>
                            </View>
                        </SafeAreaView>
                    </View>
                </View>
            </Modal>

            {/* Language Selection Modal */}
            <Modal
                visible={showLanguageModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowLanguageModal(false)}
            >
                <Pressable
                    onPress={() => setShowLanguageModal(false)}
                    className="flex-1 bg-black/20 justify-center items-center px-10"
                >
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
                </Pressable>
            </Modal>

            {/* Level Selection Modal */}
            <Modal
                visible={showLevelModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowLevelModal(false)}
            >
                <Pressable
                    onPress={() => setShowLevelModal(false)}
                    className="flex-1 bg-black/20 justify-center items-center px-10"
                >
                    <View className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-[300px] overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-700">
                        <View className="p-5 border-b border-gray-50 dark:border-slate-700/50">
                            <Text className="text-lg font-black text-slate-800 dark:text-white">Select Level</Text>
                        </View>
                        <View>
                            {levels.map((lvl) => (
                                <TouchableOpacity
                                    key={lvl}
                                    onPress={() => {
                                        setSelectedLevel(lvl);
                                        setShowLevelModal(false);
                                    }}
                                    className={`px-6 py-4 border-b border-gray-50 dark:border-slate-700/30 ${selectedLevel === lvl ? 'bg-orange-50 dark:bg-orange-900/10' : ''
                                        }`}
                                >
                                    <View className="flex-row items-center justify-between">
                                        <Text className={`text-base capitalize ${selectedLevel === lvl
                                            ? 'text-primary font-bold'
                                            : 'text-slate-600 dark:text-slate-300'
                                            }`}>{lvl}</Text>
                                        {selectedLevel === lvl && <Feather name="check" size={16} color="#FF8A50" />}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
};

export default CourseScreen;
