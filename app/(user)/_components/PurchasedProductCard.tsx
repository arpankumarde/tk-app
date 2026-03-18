import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { PurchasedProduct } from "../types";
import PDFPreview from "@/components/PDFPreview";

interface PurchasedProductCardProps {
  product: PurchasedProduct;
}

const PurchasedProductCard = ({ product }: PurchasedProductCardProps) => {
  const [pdfVisible, setPdfVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => router.push(`/(main)/product/${product.slug}` as any)}
        className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex-row items-center mb-4"
      >
        <View className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 mr-4 overflow-hidden">
          <Image
            source={{
              uri:
                product.thumbnailUrl ||
                "https://ik.imagekit.io/testkart/placeholders/mock-test-placeholder__FmYrad7s.png",
            }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>

        <View className="flex-1">
          <Text
            className="text-slate-800 dark:text-white font-black text-lg mb-0.5"
            numberOfLines={1}
          >
            {product.title}
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 font-bold text-xs mb-1">
            By: {product.teacherName || "TestKart Expert"}
          </Text>
          {product.category ? (
            <View className="bg-purple-50 dark:bg-purple-900/20 px-2.5 py-0.5 rounded-full self-start">
              <Text className="text-purple-600 dark:text-purple-400 font-bold text-[10px]">
                {product.category}
              </Text>
            </View>
          ) : null}
        </View>

        {product.pdfUrl ? (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              setPdfVisible(true);
            }}
            className="ml-2 bg-indigo-500 px-4 py-2 rounded-xl"
          >
            <Text className="text-white font-bold text-xs">View</Text>
          </TouchableOpacity>
        ) : (
          <Feather name="chevron-right" size={20} color="#CBD5E1" className="ml-2" />
        )}
      </TouchableOpacity>

      {product.pdfUrl && (
        <Modal
          visible={pdfVisible}
          animationType="slide"
          onRequestClose={() => setPdfVisible(false)}
        >
          <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
              <Text className="text-base font-bold text-slate-800 dark:text-white">
                {product.title}
              </Text>
              <TouchableOpacity onPress={() => setPdfVisible(false)}>
                <Feather name="x" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>
            <PDFPreview
              pdfUrl={product.pdfUrl}
              maxPages={9999}
              style={{ flex: 1 }}
            />
          </SafeAreaView>
        </Modal>
      )}
    </>
  );
};

export default PurchasedProductCard;
