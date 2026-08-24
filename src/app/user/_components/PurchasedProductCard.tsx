import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import Feather from "@react-native-vector-icons/feather";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { PurchasedProduct, PurchasedProductFile } from "../types";
import Placeholder from "@/constants/placeholder";

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return null;
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
};

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

interface PurchasedProductCardProps {
  product: PurchasedProduct;
}

const PurchasedProductCard = ({ product }: PurchasedProductCardProps) => {
  const { token } = useAuth();
  const displayCategory = product.category?.trim() || "Notes";
  const hasMultipleFiles = (product.fileCount ?? 0) > 1;

  const [filesModalVisible, setFilesModalVisible] = useState(false);
  const [files, setFiles] = useState<PurchasedProductFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);

  // The reader owns the download, so the card only navigates. Nothing here
  // writes to disk and nothing is handed to another app.
  const openReader = (fileId?: number, fileTitle?: string) => {
    setFilesModalVisible(false);
    router.push({
      pathname: "/user/reader/[productId]",
      params: {
        productId: String(product.productId),
        ...(fileId != null ? { fileId: String(fileId) } : {}),
        title: fileTitle || product.title,
      },
    } as any);
  };

  const openFilePicker = async () => {
    if (!token) return;
    setFilesModalVisible(true);
    if (files.length > 0 || filesLoading) return;

    try {
      setFilesLoading(true);
      const response = await fetch(
        `${BASE_URL}/_api/student/shop/files?productId=${product.productId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!response.ok) throw new Error(`API returned ${response.status}`);

      const data = await response.json();
      const payload = data.json || data;
      const list: PurchasedProductFile[] = payload.files || [];
      list.sort((a, b) => a.orderIndex - b.orderIndex);
      setFiles(list);

      // If the product actually only has one file, skip the picker entirely.
      if (list.length === 1) {
        openReader(list[0].id, list[0].title);
      }
    } catch (error: any) {
      console.error("Files list error:", error?.message, error);
      setFilesModalVisible(false);
      Alert.alert("Error", "Could not load the file list. Please try again.");
    } finally {
      setFilesLoading(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => router.push(`/(main)/product/${product.slug}` as any)}
        className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex-row items-center mb-4"
      >
        <View className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 mr-4 overflow-hidden">
          <Image
            source={{
              uri: product.thumbnailUrl || Placeholder.NOTE,
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
            By: {product.teacherName || "Testkart Expert"}
          </Text>
          <View className="flex-row items-center self-start">
            <View className="bg-purple-50 dark:bg-purple-900/20 px-2.5 py-0.5 rounded-full">
              <Text className="text-purple-600 dark:text-purple-400 font-bold text-[10px]">
                {displayCategory}
              </Text>
            </View>
            {hasMultipleFiles && (
              <View className="ml-2 flex-row items-center bg-orange-50 dark:bg-orange-900/20 px-2.5 py-0.5 rounded-full">
                <Feather name="layers" size={10} color="#FF8A50" />
                <Text className="text-primary font-bold text-[10px] ml-1">
                  {product.fileCount} files
                </Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            if (hasMultipleFiles) {
              openFilePicker();
            } else {
              openReader();
            }
          }}
          className="ml-2 bg-primary px-4 py-2 rounded-xl flex-row items-center"
        >
          <Feather
            name={hasMultipleFiles ? "folder" : "book-open"}
            size={14}
            color="#fff"
          />
          <Text className="text-white font-bold text-xs ml-1">
            {hasMultipleFiles ? "Files" : "Read"}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Multi-file picker */}
      <Modal
        visible={filesModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilesModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl max-h-[75%] pb-8">
            <View className="flex-row items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-slate-800">
              <View className="flex-1 pr-4">
                <Text
                  className="text-lg font-black text-slate-800 dark:text-white"
                  numberOfLines={1}
                >
                  {product.title}
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 font-bold text-xs mt-0.5">
                  Select a file to read
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setFilesModalVisible(false)}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
              >
                <Feather name="x" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            {filesLoading ? (
              <View className="py-16 items-center justify-center">
                <ActivityIndicator color="#FF8A50" size="large" />
              </View>
            ) : (
              <ScrollView className="px-4 pt-3">
                {files.map((file) => {
                  const sizeLabel = formatFileSize(file.fileSizeBytes);
                  return (
                    <TouchableOpacity
                      key={file.id}
                      onPress={() => openReader(file.id, file.title)}
                      className="flex-row items-center bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl mb-3"
                    >
                      <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
                        <Feather name="file-text" size={18} color="#FF8A50" />
                      </View>
                      <View className="flex-1 pr-2">
                        <Text
                          className="text-slate-800 dark:text-white font-bold text-sm"
                          numberOfLines={2}
                        >
                          {file.title || `File ${file.orderIndex + 1}`}
                        </Text>
                        {(sizeLabel || file.pageCount) && (
                          <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-0.5">
                            {[
                              file.pageCount ? `${file.pageCount} pages` : null,
                              sizeLabel,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </Text>
                        )}
                      </View>
                      <Feather name="chevron-right" size={18} color="#FF8A50" />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

export default PurchasedProductCard;
