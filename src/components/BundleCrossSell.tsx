import BundleCard from "@/components/BundleCard";
import type {
  BundleDetails,
  BundleItemType,
  BundleListItem,
} from "@/types/bundle";
import Feather from "@react-native-vector-icons/feather";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

// The list endpoint can't filter by "contains this item", so we resolve a few
// candidates and keep only the bundles that genuinely include it. Capped to
// keep a detail screen from firing a wave of requests.
const MAX_CANDIDATES = 3;

interface BundleCrossSellProps {
  itemType: BundleItemType;
  itemId: number;
  /** Narrows candidates to the item's own teacher when the screen knows it. */
  teacherId?: number | null;
}

const BundleCrossSell = ({
  itemType,
  itemId,
  teacherId,
}: BundleCrossSellProps) => {
  const [matches, setMatches] = useState<BundleListItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadBundles = async () => {
      if (!itemId) return;

      try {
        const query = teacherId
          ? `teacherId=${teacherId}&limit=${MAX_CANDIDATES}`
          : `limit=${MAX_CANDIDATES}&sort=popular`;
        const response = await fetch(`${BASE_URL}/_api/bundles/list?${query}`);
        if (!response.ok) return;

        const data = await response.json();
        const payload = data.json || data;
        const candidates: BundleListItem[] = (payload.bundles || []).slice(
          0,
          MAX_CANDIDATES,
        );
        if (candidates.length === 0 || cancelled) return;

        const details = await Promise.all(
          candidates.map(async (candidate) => {
            try {
              const res = await fetch(
                `${BASE_URL}/_api/bundles/details?slug=${encodeURIComponent(
                  candidate.slug,
                )}`,
              );
              if (!res.ok) return null;
              const body = await res.json();
              return (body.json || body) as BundleDetails;
            } catch (error) {
              console.error("Error resolving bundle contents:", error);
              return null;
            }
          }),
        );

        const relevant = candidates.filter((_, index) =>
          details[index]?.items?.some(
            (item) => item.type === itemType && item.id === itemId,
          ),
        );

        if (!cancelled) setMatches(relevant);
      } catch (error) {
        console.error("Error loading bundle cross-sell:", error);
      }
    };

    loadBundles();
    return () => {
      cancelled = true;
    };
  }, [itemType, itemId, teacherId]);

  if (matches.length === 0) return null;

  return (
    <View className="mb-8">
      <View className="flex-row items-center mb-1">
        <Feather name="package" size={18} color="#FF8A50" />
        <Text className="ml-2 text-2xl font-black text-slate-800 dark:text-white">
          Save with Bundles
        </Text>
      </View>
      <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-4">
        This is included in{" "}
        {matches.length === 1 ? "a bundle" : "these bundles"} — get more for
        less.
      </Text>

      {matches.length === 1 ? (
        <BundleCard bundle={matches[0]} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 14, paddingRight: 8 }}
        >
          {matches.map((bundle) => (
            <BundleCard key={bundle.id} bundle={bundle} variant="rail" />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default BundleCrossSell;
