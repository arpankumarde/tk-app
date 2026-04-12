import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { File, Directory, Paths } from "expo-file-system";
import { getContentUriAsync } from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import * as Sharing from "expo-sharing";
import { useAuth } from "@/context/AuthContext";
import { PurchasedProduct } from "../types";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

interface PurchasedProductCardProps {
  product: PurchasedProduct;
}

const PurchasedProductCard = ({ product }: PurchasedProductCardProps) => {
  const { token } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const displayCategory = product.category?.trim() || "Notes";

  const handleDownload = async () => {
    if (!token || downloading) return;

    try {
      setDownloading(true);

      // console.log("Download: fetching signed URL for productId:", product.productId);
      const response = await fetch(`${BASE_URL}/_api/student/shop/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ json: { productId: product.productId } }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Download API error:", response.status, errorText);
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      // console.log("Download API response:", JSON.stringify(data));
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

        if (Platform.OS === "android") {
          const contentUri = await getContentUriAsync(file.uri);
          await IntentLauncher.startActivityAsync(
            "android.intent.action.VIEW",
            {
              data: contentUri,
              type: "application/pdf",
              flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
            },
          );
        } else {
          await Sharing.shareAsync(file.uri, {
            mimeType: "application/pdf",
            UTI: "com.adobe.pdf",
          });
        }
      } else {
        Alert.alert("Error", "Download link not available");
      }
    } catch (error: any) {
      console.error("Download error:", error?.message, error);
      Alert.alert("Error", `Could not download the file: ${error?.message}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(main)/product/${product.slug}` as any)}
      className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex-row items-center mb-4"
    >
      <View className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 mr-4 overflow-hidden">
        <Image
          source={{
            uri:
              product.thumbnailUrl ||
              "https://ik.imagekit.io/testkart/placeholders/study-notes.png",
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
        <View className="bg-purple-50 dark:bg-purple-900/20 px-2.5 py-0.5 rounded-full self-start">
          <Text className="text-purple-600 dark:text-purple-400 font-bold text-[10px]">
            {displayCategory}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          handleDownload();
        }}
        disabled={downloading}
        className="ml-2 bg-primary px-4 py-2 rounded-xl flex-row items-center"
      >
        {downloading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Feather name="external-link" size={14} color="#fff" />
            <Text className="text-white font-bold text-xs ml-1">Open</Text>
          </>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default PurchasedProductCard;
