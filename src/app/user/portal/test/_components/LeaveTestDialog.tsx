import {
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface LeaveTestDialogProps {
  visible: boolean;
  isLive: boolean;
  answeredCount: number;
  canPause: boolean;
  pausing: boolean;
  onStay: () => void;
  onLeave: () => void;
  onPause: () => void;
}

// A mock test can be paused: answers and the time left are saved, and the test
// resumes from its instructions page. A live test cannot: its answers reach the
// server only on submit and a live test paper refuses a second start.
const leaveMessage = (
  isLive: boolean,
  canPause: boolean,
  answeredCount: number,
) => {
  if (canPause) {
    return "Your answers and the time left are saved. The clock stops while the test is paused, and you can resume it from the test page whenever you are ready.";
  }

  const marked =
    answeredCount === 1
      ? "the 1 answer you have marked"
      : `the ${answeredCount} answers you have marked`;

  if (isLive) {
    return answeredCount > 0
      ? `Your answers are saved only when you submit. A live test allows one attempt and cannot be reopened in this app, so if you leave now ${marked} will not be counted.`
      : "A live test allows one attempt and cannot be reopened in this app. If you leave now, you will not be able to answer it here.";
  }

  return answeredCount > 0
    ? `Your answers are saved only when you submit. If you leave now, ${marked} will be lost and you will have to start the test again.`
    : "If you leave now, this attempt is dropped and you will have to start the test again.";
};

const LeaveTestDialog = ({
  visible,
  isLive,
  answeredCount,
  canPause,
  pausing,
  onStay,
  onLeave,
  onPause,
}: LeaveTestDialogProps) => {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={pausing ? undefined : onStay}
    >
      <View className="flex-1 bg-black/50 px-6 items-center justify-center">
        <View className="w-full max-w-sm bg-white dark:bg-night rounded-[32px] overflow-hidden shadow-2xl border border-line dark:border-night-line">
          <View className="p-6">
            <Text className="text-xl font-extrabold text-ink dark:text-white mb-2">
              {canPause ? "Pause the test?" : "Leave the test?"}
            </Text>
            <Text className="text-ink-soft dark:text-night-soft text-sm font-bold leading-5">
              {leaveMessage(isLive, canPause, answeredCount)}
            </Text>
          </View>

          <View className="px-6 pb-6 flex-row gap-3">
            {canPause ? (
              <TouchableOpacity
                onPress={onPause}
                disabled={pausing}
                className="flex-1 h-12 rounded-xl items-center justify-center border border-line dark:border-night-line"
              >
                {pausing ? (
                  <ActivityIndicator color="#FF8A50" />
                ) : (
                  <Text className="text-ink dark:text-night-soft font-bold">
                    Pause and leave
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={onLeave}
                className="flex-1 h-12 rounded-xl items-center justify-center border border-red-200 dark:border-red-900"
              >
                <Text className="text-red-600 dark:text-red-400 font-bold">
                  Leave test
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={onStay}
              disabled={pausing}
              className="flex-1 h-12 bg-primary-deep rounded-xl items-center justify-center"
            >
              <Text className="text-white font-extrabold">Continue test</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default LeaveTestDialog;
