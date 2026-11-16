import React, { useState } from "react";
import {
  View,
  Text,
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
import { findSavedNote } from "@/utils/savedNotes";
import NoteDownloadSheet from "./NoteDownloadSheet";

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

type DownloadTarget = {
  fileId?: number;
  title: string;
  sizeBytes?: number | null;
};

const PurchasedProductCard = ({ product }: PurchasedProductCardProps) => {
  const { token, user } = useAuth();
  const userId = user?.id;
  const displayCategory = product.category?.trim() || "Notes";
  const hasMultipleFiles = (product.fileCount ?? 0) > 1;
  const allowDownload = !!product.allowDownload;

  const [filesModalVisible, setFilesModalVisible] = useState(false);
  const [files, setFiles] = useState<PurchasedProductFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [downloadTarget, setDownloadTarget] = useState<DownloadTarget | null>(
    null,
  );
  // Read from disk on mount, when the file list loads and when the download
  // sheet closes.
  const checkSaved = (list: PurchasedProductFile[]) => ({
    main: findSavedNote(userId, product.productId) != null,
    fileIds: list
      .filter((file) => findSavedNote(userId, product.productId, file.id))
      .map((file) => file.id),
  });
  const [saved, setSaved] = useState(() => checkSaved([]));
  const isSaved = (fileId?: number) =>
    fileId == null ? saved.main : saved.fileIds.includes(fileId);

  // The reader picks a saved copy up by itself, so the card only navigates.
  const openReader = (fileId?: number, fileTitle?: string) => {
    setFilesModalVisible(false);
    router.push({
      pathname: "/user/reader/[productId]",
      params: {
        productId: String(product.productId),
        ...(fileId != null ? { fileId: String(fileId) } : {}),
        title: fileTitle || product.title,
        ...(allowDownload ? { downloadable: "1" } : {}),
      },
    } as any);
  };

  const openDownload = (target: DownloadTarget) => {
    setFilesModalVisible(false);
    setDownloadTarget(target);
  };

  const closeDownload = () => {
    setDownloadTarget(null);
    setSaved(checkSaved(files));
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
      setSaved(checkSaved(list));

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
        className="bg-white dark:bg-night p-4 rounded-2xl border border-line dark:border-night-line shadow-sm flex-row items-center mb-4"
      >
        <View className="flex-1">
          <Text
            className="text-ink dark:text-white font-extrabold text-lg mb-0.5"
            numberOfLines={1}
          >
            {product.title}
          </Text>
          <Text className="text-ink-soft dark:text-night-soft font-bold text-xs mb-1">
            By: {product.teacherName || "Testkart Expert"}
          </Text>
          <View className="flex-row items-center self-start">
            <View className="bg-sky-tint dark:bg-night-raised px-2.5 py-0.5 rounded-full">
              <Text className="text-sky dark:text-sky-light font-bold text-[10px]">
                {displayCategory}
              </Text>
            </View>
            {hasMultipleFiles && (
              <View className="ml-2 flex-row items-center bg-clay-tint dark:bg-night-raised px-2.5 py-0.5 rounded-full">
                <Feather name="layers" size={10} color="#FF8A50" />
                <Text className="text-primary-deep dark:text-primary font-bold text-[10px] ml-1">
                  {product.fileCount} files
                </Text>
              </View>
            )}
          </View>
        </View>

        {allowDownload && !hasMultipleFiles && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              openDownload({ title: product.title });
            }}
            accessibilityRole="button"
            accessibilityLabel={isSaved() ? "Saved on device" : "Save to device"}
            className="ml-2 h-9 w-9 items-center justify-center rounded-xl border-2 border-primary bg-white dark:bg-night"
          >
            <Feather
              name={isSaved() ? "check" : "download"}
              size={16}
              color="#FF8A50"
            />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            if (hasMultipleFiles) {
              openFilePicker();
            } else {
              openReader();
            }
          }}
          className="ml-2 bg-primary-deep px-4 py-2 rounded-xl flex-row items-center"
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
          <View className="bg-white dark:bg-night rounded-t-3xl max-h-[75%] pb-8">
            <View className="flex-row items-center justify-between px-6 pt-5 pb-4 border-b border-line dark:border-night-line">
              <View className="flex-1 pr-4">
                <Text
                  className="text-lg font-extrabold text-ink dark:text-white"
                  numberOfLines={1}
                >
                  {product.title}
                </Text>
                <Text className="text-ink-soft dark:text-night-soft font-bold text-xs mt-0.5">
                  Select a file to read
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setFilesModalVisible(false)}
                className="w-9 h-9 rounded-full bg-sand dark:bg-night-raised items-center justify-center"
              >
                <Feather name="x" size={18} color="#6A6358" />
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
                  const fileTitle = file.title || `File ${file.orderIndex + 1}`;
                  const fileSaved = allowDownload && isSaved(file.id);
                  return (
                    <TouchableOpacity
                      key={file.id}
                      onPress={() => openReader(file.id, file.title)}
                      className="flex-row items-center bg-sand dark:bg-night-raised p-4 rounded-2xl mb-3"
                    >
                      <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
                        <Feather name="file-text" size={18} color="#FF8A50" />
                      </View>
                      <View className="flex-1 pr-2">
                        <Text
                          className="text-ink dark:text-white font-bold text-sm"
                          numberOfLines={2}
                        >
                          {fileTitle}
                        </Text>
                        {(sizeLabel || file.pageCount) && (
                          <Text className="text-ink-soft dark:text-night-soft text-xs font-medium mt-0.5">
                            {[
                              file.pageCount ? `${file.pageCount} pages` : null,
                              sizeLabel,
                              fileSaved ? "Saved" : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </Text>
                        )}
                      </View>
                      {allowDownload && (
                        <TouchableOpacity
                          onPress={() =>
                            openDownload({
                              fileId: file.id,
                              title: fileTitle,
                              sizeBytes: file.fileSizeBytes,
                            })
                          }
                          accessibilityRole="button"
                          accessibilityLabel={
                            fileSaved ? "Saved on device" : "Save to device"
                          }
                          className="mr-2 h-9 w-9 items-center justify-center rounded-xl border-2 border-primary bg-white dark:bg-night"
                        >
                          <Feather
                            name={fileSaved ? "check" : "download"}
                            size={16}
                            color="#FF8A50"
                          />
                        </TouchableOpacity>
                      )}
                      <Feather name="chevron-right" size={18} color="#FF8A50" />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {downloadTarget && (
        <NoteDownloadSheet
          productId={product.productId}
          fileId={downloadTarget.fileId}
          title={downloadTarget.title}
          sizeBytes={downloadTarget.sizeBytes}
          onRead={() => openReader(downloadTarget.fileId, downloadTarget.title)}
          onClose={closeDownload}
        />
      )}
    </>
  );
};

export default PurchasedProductCard;
