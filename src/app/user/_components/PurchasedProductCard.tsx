import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  ScrollView,
} from "react-native";
import Feather from "@react-native-vector-icons/feather";
import { router } from "expo-router";
import { File, Directory, Paths } from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import * as Sharing from "expo-sharing";
import { useAuth } from "@/context/AuthContext";
import { PurchasedProduct, PurchasedProductFile } from "../types";
import Placeholder from "@/constants/placeholder";
import { getMimeFromName } from "@/utils/mimeTypes";

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
  const [downloading, setDownloading] = useState(false);
  const displayCategory = product.category?.trim() || "Notes";
  const hasMultipleFiles = (product.fileCount ?? 0) > 1;

  const [filesModalVisible, setFilesModalVisible] = useState(false);
  const [files, setFiles] = useState<PurchasedProductFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [activeFileId, setActiveFileId] = useState<number | null>(null);

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
        setFilesModalVisible(false);
        handleDownload(list[0].id);
      }
    } catch (error: any) {
      console.error("Files list error:", error?.message, error);
      setFilesModalVisible(false);
      Alert.alert("Error", "Could not load the file list. Please try again.");
    } finally {
      setFilesLoading(false);
    }
  };

  const handleDownload = async (fileId?: number) => {
    if (!token || downloading) return;

    try {
      setDownloading(true);
      if (fileId != null) setActiveFileId(fileId);

      const response = await fetch(`${BASE_URL}/_api/student/shop/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          json:
            fileId != null
              ? { productId: product.productId, fileId }
              : { productId: product.productId },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Download API error:", response.status, errorText);
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      const payload = data.json || data;
      const { downloadUrl } = payload;

      if (downloadUrl) {
        const destination = new Directory(Paths.cache, "downloads");
        if (!destination.exists) {
          destination.create();
        }

        const urlPath = downloadUrl.split("?")[0];
        const fileName = urlPath.split("/").pop();
        let file: File;

        const cached = fileName ? new File(destination, fileName) : null;
        if (cached?.exists) {
          console.log("Using cached file:", cached.uri);
          file = cached;
        } else {
          console.log("Downloading file from:", downloadUrl);
          file = await File.downloadFileAsync(downloadUrl, destination);
          console.log("File saved to:", file.uri);
        }

        const { mime, uti } = getMimeFromName(fileName ?? "");

        if (Platform.OS === "android") {
          try {
            await IntentLauncher.startActivityAsync(
              "android.intent.action.VIEW",
              {
                data: file.contentUri,
                type: mime,
                flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
              },
            );
          } catch {
            // No viewer registered for this MIME — fall back to the share sheet
            // so the user can pick an app (e.g. Drive, browser) to open it.
            await Sharing.shareAsync(file.uri, { mimeType: mime, UTI: uti });
          }
        } else {
          await Sharing.shareAsync(file.uri, { mimeType: mime, UTI: uti });
        }
      } else {
        Alert.alert("Error", "Download link not available");
      }
    } catch (error: any) {
      console.error("Download error:", error?.message, error);
      Alert.alert("Error", `Could not download the file: ${error?.message}`);
    } finally {
      setDownloading(false);
      setActiveFileId(null);
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
          By: {product.teacherName || "TestKart Expert"}
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
            handleDownload();
          }
        }}
        disabled={downloading}
        className="ml-2 bg-primary px-4 py-2 rounded-xl flex-row items-center"
      >
        {downloading && activeFileId == null ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Feather
              name={hasMultipleFiles ? "folder" : "external-link"}
              size={14}
              color="#fff"
            />
            <Text className="text-white font-bold text-xs ml-1">
              {hasMultipleFiles ? "Files" : "Open"}
            </Text>
          </>
        )}
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
                Select a file to open
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
                const isActive = downloading && activeFileId === file.id;
                return (
                  <TouchableOpacity
                    key={file.id}
                    onPress={() => handleDownload(file.id)}
                    disabled={downloading}
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
                            file.pageCount
                              ? `${file.pageCount} pages`
                              : null,
                            sizeLabel,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </Text>
                      )}
                    </View>
                    {isActive ? (
                      <ActivityIndicator size="small" color="#FF8A50" />
                    ) : (
                      <Feather name="download" size={18} color="#FF8A50" />
                    )}
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
