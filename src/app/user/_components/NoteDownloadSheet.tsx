import { View, Text, TouchableOpacity, Modal, Alert } from "react-native";
import Feather, { type FeatherIconName } from "@react-native-vector-icons/feather";
import { useColorScheme } from "nativewind";
import { useNoteDownload } from "../_hooks/useNoteDownload";

const formatSize = (bytes: number | null | undefined) => {
  if (!bytes) return null;
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

interface NoteDownloadSheetProps {
  productId: number;
  fileId?: number;
  title: string;
  sizeBytes?: number | null;
  /** Shown as "Read offline" once the note is saved. */
  onRead?: () => void;
  onClose: () => void;
}

const ActionRow = ({
  icon,
  label,
  hint,
  onPress,
  danger,
}: {
  icon: FeatherIconName;
  label: string;
  hint?: string;
  onPress: () => void;
  danger?: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    accessibilityRole="button"
    className="mb-3 flex-row items-center rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
  >
    <View
      className={`mr-3 h-10 w-10 items-center justify-center rounded-xl ${
        danger ? "bg-red-600" : "bg-primary"
      }`}
    >
      <Feather name={icon} size={18} color="#fff" />
    </View>
    <View className="flex-1">
      <Text
        className={`text-sm font-black ${
          danger ? "text-red-700 dark:text-red-400" : "text-slate-800 dark:text-white"
        }`}
      >
        {label}
      </Text>
      {hint && (
        <Text className="mt-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
          {hint}
        </Text>
      )}
    </View>
  </TouchableOpacity>
);

/**
 * Save, open-in and share options for a study note whose teacher allows
 * downloads. Closing the sheet cancels a save that is still running.
 */
export default function NoteDownloadSheet({
  productId,
  fileId,
  title,
  sizeBytes,
  onRead,
  onClose,
}: NoteDownloadSheetProps) {
  const { colorScheme } = useColorScheme();
  const { saved, progress, error, save, cancel, openWith, share, remove } =
    useNoteDownload({ productId, fileId, title, sizeBytes });

  const saving = progress !== null;
  const sizeLabel = formatSize(saved ? saved.size : sizeBytes);
  const percent = Math.round((progress ?? 0) * 100);

  const close = () => {
    cancel();
    onClose();
  };

  const confirmRemove = () => {
    Alert.alert(
      "Remove from device",
      "This note will need internet to open again. You can save it again anytime.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: remove },
      ],
    );
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={close}>
      <View className="flex-1 justify-end bg-black/60">
        <View className="rounded-t-3xl bg-white pb-8 dark:bg-slate-900">
          <View className="flex-row items-center justify-between border-b border-gray-100 px-6 pb-4 pt-5 dark:border-slate-800">
            <View className="flex-1 pr-4">
              <Text
                className="text-lg font-black text-slate-800 dark:text-white"
                numberOfLines={1}
              >
                {title}
              </Text>
              <Text className="mt-0.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                {[saved ? "Saved on this device" : "Not saved yet", sizeLabel]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </View>
            <TouchableOpacity
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel="Close"
              className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
            >
              <Feather
                name="x"
                size={18}
                color={colorScheme === "dark" ? "#fff" : "#1A1A1A"}
              />
            </TouchableOpacity>
          </View>

          <View className="px-4 pt-4">
            {saving ? (
              <View className="rounded-2xl border border-gray-200 p-4 dark:border-slate-700">
                <View className="mb-3 flex-row items-center justify-between">
                  <Text className="text-sm font-black text-slate-800 dark:text-white">
                    Saving to your device...
                  </Text>
                  <Text className="text-sm font-black text-[#903209] dark:text-orange-300">
                    {percent}%
                  </Text>
                </View>
                <View className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <View
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${percent}%` }}
                  />
                </View>
                <Text className="mt-3 text-xs font-medium text-slate-600 dark:text-slate-300">
                  Keep this open until it finishes.
                </Text>
                <TouchableOpacity
                  onPress={cancel}
                  accessibilityRole="button"
                  className="mt-4 items-center rounded-xl border border-gray-300 py-3 dark:border-slate-600"
                >
                  <Text className="text-sm font-black text-slate-700 dark:text-white">
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            ) : saved ? (
              <>
                {onRead && (
                  <ActionRow
                    icon="book-open"
                    label="Read offline"
                    hint="Opens in Testkart, no internet needed"
                    onPress={() => {
                      onClose();
                      onRead();
                    }}
                  />
                )}
                <ActionRow
                  icon="external-link"
                  label="Open in another app"
                  hint="Read it in your PDF app"
                  onPress={openWith}
                />
                <ActionRow
                  icon="share-2"
                  label="Share or save to Files"
                  hint="Send it to Drive, Files or another app"
                  onPress={share}
                />
                <ActionRow
                  icon="trash-2"
                  label="Remove from this device"
                  onPress={confirmRemove}
                  danger
                />
              </>
            ) : (
              <>
                <Text className="mb-4 px-2 text-sm font-medium leading-5 text-slate-700 dark:text-slate-200">
                  Save this note to read it without internet, open it in
                  another PDF app or keep a copy in your files.
                </Text>
                <TouchableOpacity
                  onPress={save}
                  accessibilityRole="button"
                  className="flex-row items-center justify-center rounded-2xl bg-primary py-4"
                >
                  <Feather name="download" size={16} color="#fff" />
                  <Text className="ml-2 text-sm font-black text-white">
                    {sizeLabel ? `Save to device (${sizeLabel})` : "Save to device"}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {error && !saving && (
              <View className="mt-4 flex-row items-start rounded-2xl border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
                <Feather name="alert-circle" size={16} color="#DC2626" />
                <Text className="ml-2 flex-1 text-xs font-bold text-red-700 dark:text-red-300">
                  {error}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
