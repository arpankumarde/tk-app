import {
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface TimeUpDialogProps {
  visible: boolean;
  // True while the submit is in flight and after it has gone through, until the
  // results screen replaces this one.
  busy: boolean;
  error: string | null;
  onRetry: () => void;
  onLeave: () => void;
}

// Blocks the test once its time has run out. It has no onRequestClose, so
// Android back cannot dismiss it: the only ways on are a submit that goes
// through, or leaving without one.
const TimeUpDialog = ({
  visible,
  busy,
  error,
  onRetry,
  onLeave,
}: TimeUpDialogProps) => {
  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View className="flex-1 bg-black/50 px-6 items-center justify-center">
        <View className="w-full max-w-sm bg-white dark:bg-night rounded-[32px] overflow-hidden shadow-2xl border border-line dark:border-night-line">
          <View className="p-6">
            <Text className="text-xl font-extrabold text-ink dark:text-white mb-2">
              Time is up
            </Text>
            {busy ? (
              <View className="flex-row items-center mt-2">
                <ActivityIndicator color="#FF8A50" />
                <Text className="ml-3 text-ink-soft dark:text-night-soft text-sm font-bold">
                  Submitting your answers...
                </Text>
              </View>
            ) : (
              <>
                <Text className="text-ink-soft dark:text-night-soft text-sm font-bold leading-5">
                  Your answers could not be submitted. They are still here, so
                  check your connection and try again.
                </Text>
                {error ? (
                  <Text className="mt-3 text-red-600 dark:text-red-400 text-sm font-bold leading-5">
                    {error}
                  </Text>
                ) : null}
              </>
            )}
          </View>

          {!busy && (
            <View className="px-6 pb-6 flex-row gap-3">
              <TouchableOpacity
                onPress={onLeave}
                className="flex-1 h-12 rounded-xl items-center justify-center border border-red-200 dark:border-red-900"
              >
                <Text className="text-red-600 dark:text-red-400 font-bold">
                  Leave test
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onRetry}
                className="flex-1 h-12 bg-primary-deep rounded-xl items-center justify-center"
              >
                <Text className="text-white font-extrabold">Try again</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default TimeUpDialog;
