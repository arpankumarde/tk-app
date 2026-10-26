import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import * as Clipboard from "expo-clipboard";
import Feather from "@react-native-vector-icons/feather";
import { router, type Href } from "expo-router";
import { useColorScheme } from "nativewind";
import SpinWinWheel, { rotationForSlice } from "./SpinWinWheel";
import {
  CATEGORY_LABELS,
  discountLabel,
  friendlySpinError,
  shopRouteFor,
  spinDate,
  useSpinActions,
} from "@/hooks/useSpinWin";
import type { SpinCampaignView, SpinViewState } from "@/types/spinWin";

type Props = {
  onClose: () => void;
  view: SpinCampaignView;
  /** Called after a spin or claim changes what the server holds for this student. */
  onChanged: () => void;
  /** A logged-out visitor tapped a login or sign-up button; the launcher reopens after sign-in. */
  onLoginRequested: () => void;
};

type Screen = "play" | "terms";

/* Six turns over 7s, as on the web; reduced motion still gets a short, slow spin. */
const SPIN_MS = 7000;
const SPIN_TURNS = 6;
const REDUCED_SPIN_MS = 3500;
const REDUCED_SPIN_TURNS = 2;

const DEEP = "#49216B";
const PLUM = "#683A8D";
const GOLD = "#E9B957";
const CREAM = "#FFF9F1";

const CONFETTI_COLORS = ["#E9B957", "#E9DFF7", "#F9DDE9", "#D5F0E4", "#DCEBFA", "#FFF0BE"];

const BENEFIT_NAMES: Record<string, string> = {
  courses: "Courses",
  test_series: "Test Series",
  study_notes: "Notes",
};

/* "Courses, Test Series & Notes", in that order, from the campaign's eligible categories. */
function benefitCategories(categories: string[]): string {
  const names = ["courses", "test_series", "study_notes"]
    .filter((c) => categories.includes(c))
    .map((c) => BENEFIT_NAMES[c]);
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

const categoryList = (categories: string[]) =>
  categories.map((c) => CATEGORY_LABELS[c] ?? c).join(", ");

function ConfettiPiece({ index, height }: { index: number; height: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(
      (index % 7) * 80,
      withTiming(1, { duration: 1800, easing: Easing.bezier(0.2, 0.6, 0.4, 1) }),
    );
  }, [index, progress]);
  const dx = ((index % 5) - 2) * 18;
  const spin = (index % 2 ? 1 : -1) * (180 + index * 23);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateX: dx * progress.value },
      { translateY: height * progress.value },
      { rotate: `${spin * progress.value}deg` },
    ],
  }));
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: -12,
          left: `${(index * 37) % 100}%`,
          width: 8,
          height: 12,
          borderRadius: 2,
          backgroundColor: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
        },
        style,
      ]}
    />
  );
}

function Confetti({ height }: { height: number }) {
  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" }}
    >
      {Array.from({ length: 28 }, (_, i) => (
        <ConfettiPiece key={i} index={i} height={height} />
      ))}
    </View>
  );
}

function PrimaryButton({
  label,
  icon,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  icon?: React.ComponentProps<typeof Feather>["name"];
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={{ backgroundColor: DEEP, borderColor: DEEP }}
      className="flex-row items-center justify-center rounded-full border min-h-[48px] px-5"
    >
      {loading ? (
        <ActivityIndicator color={CREAM} size="small" />
      ) : icon ? (
        <Feather name={icon} size={17} color={CREAM} />
      ) : null}
      <Text style={{ color: CREAM }} className="font-extrabold text-[15px] ml-2">
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="flex-row items-center justify-center rounded-full border-[1.5px] border-[#683A8D] dark:border-[#DCC9F5] min-h-[48px] px-5"
    >
      <Text className="font-extrabold text-[15px] text-[#683A8D] dark:text-[#DCC9F5]">
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function SpinWinModal({ onClose, view, onChanged, onLoginRequested }: Props) {
  const { width, height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === "dark";
  const actions = useSpinActions();
  const [screen, setScreen] = useState<Screen>("play");
  // Mounted fresh on each open, so an earlier spin shows the wheel resting on that reward.
  const [rotation, setRotation] = useState(() => {
    const index = view.viewer.spin?.wheelIndex ?? -1;
    return index >= 0 ? rotationForSlice(index, view.segments.length, 0, 0, 0) : 0;
  });
  const [spinMs, setSpinMs] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [pending, setPending] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [localSpin, setLocalSpin] = useState<SpinViewState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { campaign, segments, viewer } = view;
  const spin = isSpinning ? null : (localSpin ?? viewer.spin);
  const wheelSegments = segments.map((s) => ({ key: s.rewardId, label: s.label, color: s.color }));
  const cardWidth = Math.min(width - 32, 440);
  const wheelSize = Math.min(cardWidth - 72, 280, height * 0.36);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const runClaim = async () => {
    setError(null);
    setClaiming(true);
    try {
      const result = await actions.claim(campaign.slug);
      if (result.spin) setLocalSpin(result.spin);
      if (result.forfeited) {
        setMessage(result.message ?? "This account has already used its spin for this campaign.");
      } else {
        setMessage("Your coupon is saved under My Coupons.");
        setCelebrate(true);
      }
      onChanged();
    } catch (err) {
      setError(friendlySpinError(err));
    } finally {
      setClaiming(false);
    }
  };

  const startSpin = async () => {
    if (isSpinning || pending) return;
    setError(null);
    setMessage(null);
    setCelebrate(false);
    setPending(true);
    try {
      const result = await actions.spin(campaign.slug);
      const index = result.spin.wheelIndex >= 0 ? result.spin.wheelIndex : 0;
      if (result.alreadySpun) {
        setSpinMs(0);
        setRotation(rotationForSlice(index, segments.length, 0, 0, 0));
        setLocalSpin(result.spin);
        setMessage(result.message ?? "You have already spun this campaign. Here is your reward.");
        onChanged();
        return;
      }
      const duration = reducedMotion ? REDUCED_SPIN_MS : SPIN_MS;
      setIsSpinning(true);
      setSpinMs(duration);
      setRotation((from) =>
        rotationForSlice(index, segments.length, from, reducedMotion ? REDUCED_SPIN_TURNS : SPIN_TURNS),
      );
      timer.current = setTimeout(() => {
        setIsSpinning(false);
        setLocalSpin(result.spin);
        setCelebrate(true);
        setMessage(result.message);
        onChanged();
      }, duration + 150);
    } catch (err) {
      setError(friendlySpinError(err));
    } finally {
      setPending(false);
    }
  };

  const copyCode = async (code: string) => {
    try {
      await Clipboard.setStringAsync(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copy failed. Note the code down instead.");
    }
  };

  const goTo = (href: string) => {
    onClose();
    router.push(href as Href);
  };

  const close = () => {
    if (!isSpinning) onClose();
  };

  const guest = !viewer.loggedIn;
  const goToAuth = (href: "/login" | "/signup") => {
    onLoginRequested();
    goTo(href);
  };

  const canSpin = (viewer.canSpin || (guest && viewer.reason === "Log in to spin.")) && !spin;
  const busy = isSpinning || pending;

  const hub = canSpin ? (
    <TouchableOpacity
      onPress={guest ? () => goToAuth("/login") : startSpin}
      disabled={busy}
      activeOpacity={0.85}
      accessibilityLabel={guest ? "Log in to spin the wheel" : "Spin the wheel"}
      style={{
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 3,
        borderColor: GOLD,
        backgroundColor: PLUM,
        alignItems: "center",
        justifyContent: "center",
        elevation: 6,
      }}
    >
      <Text style={{ color: CREAM, fontWeight: "800", fontSize: 14, letterSpacing: 1.4 }}>
        SPIN
      </Text>
    </TouchableOpacity>
  ) : (
    <View
      style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 3,
        borderColor: GOLD,
        backgroundColor: CREAM,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Feather name="gift" size={18} color={DEEP} />
    </View>
  );

  const renderAction = () => {
    if (busy) {
      return (
        <Text className="font-bold text-[15px] text-[#2A1640] dark:text-white">
          Spinning... good luck!
        </Text>
      );
    }
    if (spin) {
      const label = spin.discountType
        ? discountLabel(spin.discountType, spin.discountValue).toUpperCase()
        : spin.rewardName;
      return (
        <View className="gap-2">
          <Text className="font-extrabold text-[15px] text-[#2A1640] dark:text-white">
            {spin.claimStatus === "forfeited" ? "Spin already used" : "Congratulations! You've Won!"}
          </Text>
          <View
            style={{ borderColor: GOLD }}
            className="rounded-xl border-[1.5px] bg-[#E9DFF7] dark:bg-[#3A2A4F] px-4 py-3"
          >
            <Text className="text-xs font-bold text-[#49216B] dark:text-[#EDE3FA]">Reward won</Text>
            <Text className="text-[32px] font-extrabold text-[#49216B] dark:text-[#DCC9F5]">
              {label}
            </Text>
            <Text className="text-[13px] font-semibold text-[#49216B] dark:text-[#EDE3FA]">
              Your Diwali surprise is ready!
            </Text>
          </View>
          {message ? (
            <Text className="rounded-lg px-3 py-2 text-[13px] bg-[#E9DFF7] dark:bg-[#3A2A4F] text-[#49216B] dark:text-[#EDE3FA]">
              {message}
            </Text>
          ) : null}
          {!spin.discountType && spin.claimStatus !== "claimed" ? (
            <Text className="rounded-lg px-3 py-2 text-[13px] bg-[#E9DFF7] dark:bg-[#3A2A4F] text-[#49216B] dark:text-[#EDE3FA]">
              Our team will contact you about this prize after you claim it.
            </Text>
          ) : null}

          {spin.coupon ? (
            <>
              <View className="rounded-xl border-2 border-dashed border-[#683A8D] dark:border-[#DCC9F5] bg-[#F9DDE9] dark:bg-[#3A2A4F] px-3 py-2.5">
                <View className="flex-row items-center justify-between gap-3 mb-1.5">
                  <Text className="text-[11px] font-semibold text-[#5E4B72] dark:text-slate-300">
                    Your coupon code
                  </Text>
                  <TouchableOpacity
                    onPress={() => copyCode(spin.coupon!.code)}
                    className="flex-row items-center rounded-full border-[1.5px] border-[#683A8D] dark:border-[#DCC9F5] bg-white dark:bg-slate-800 px-3 min-h-[36px]"
                  >
                    <Feather name={copied ? "check" : "copy"} size={14} color={dark ? "#DCC9F5" : PLUM} />
                    <Text className="ml-1.5 text-[13px] font-bold text-[#683A8D] dark:text-[#DCC9F5]">
                      {copied ? "Copied" : "Copy Code"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text
                  selectable
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                  className="text-xl font-bold tracking-wider text-[#2A1640] dark:text-white"
                >
                  {spin.coupon.code}
                </Text>
              </View>
              <PrimaryButton
                label="Shop Now"
                icon="shopping-bag"
                onPress={() => goTo(shopRouteFor(spin.eligibleCategories))}
              />
              <SecondaryButton label="My Coupons" onPress={() => goTo("/user/coupons")} />
              <Text className="text-xs leading-[18px] text-[#5E4B72] dark:text-slate-400">
                Apply the code in your cart. Minimum order, maximum discount and expiry for this
                coupon are under My Coupons.
              </Text>
            </>
          ) : spin.requiresLogin && guest ? (
            <PrimaryButton label="Log in to Claim" icon="log-in" onPress={() => goToAuth("/login")} />
          ) : spin.requiresLogin ? (
            <>
              <PrimaryButton
                label={claiming ? "Claiming..." : "Claim My Coupon"}
                onPress={runClaim}
                disabled={claiming}
                loading={claiming}
              />
              <Text className="text-xs text-center text-[#5E4B72] dark:text-slate-400">
                Claim it to see your coupon and its details under My Coupons.
              </Text>
            </>
          ) : spin.claimStatus === "claimed" && !spin.discountType ? (
            <Text className="rounded-lg px-3 py-2 text-[13px] bg-[#E9DFF7] dark:bg-[#3A2A4F] text-[#49216B] dark:text-[#EDE3FA]">
              Claimed. Our team will be in touch.
            </Text>
          ) : null}
        </View>
      );
    }
    if (canSpin) {
      const benefits: {
        icon: React.ComponentProps<typeof Feather>["name"];
        bg: string;
        text: string;
      }[] = [
        { icon: "gift", bg: "#F9DDE9", text: "Guaranteed Reward" },
        {
          icon: "book-open",
          bg: "#D5F0E4",
          text: `Available on ${benefitCategories(campaign.eligibleCategories)}`,
        },
        { icon: "percent", bg: "#FFF0BE", text: `Up to ${campaign.maxDiscountPercent}% OFF` },
      ];
      return (
        <View className="gap-2.5">
          <View className="gap-1.5">
            {benefits.map((b) => (
              <View
                key={b.text}
                className="flex-row items-center rounded-xl border border-[#E6DAF2] dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5"
              >
                <View
                  style={{ backgroundColor: b.bg }}
                  className="w-7 h-7 rounded-full items-center justify-center mr-2"
                >
                  <Feather name={b.icon} size={15} color={DEEP} />
                </View>
                <Text className="flex-1 text-[13px] font-semibold text-[#2A1640] dark:text-white">
                  {b.text}
                </Text>
              </View>
            ))}
          </View>
          {guest ? (
            <>
              <PrimaryButton label="Log in to Spin" icon="log-in" onPress={() => goToAuth("/login")} />
              <SecondaryButton label="New here? Sign Up" onPress={() => goToAuth("/signup")} />
              <Text className="text-xs leading-[18px] text-[#5E4B72] dark:text-slate-400">
                Log in or sign up to spin. One spin per account, and your coupon is saved to it.
              </Text>
            </>
          ) : (
            <>
              <PrimaryButton label="Spin the Wheel" icon="disc" onPress={startSpin} />
              <Text className="text-xs leading-[18px] text-[#5E4B72] dark:text-slate-400">
                One spin. One guaranteed reward. Use your coupon on eligible Testkart products.
              </Text>
            </>
          )}
        </View>
      );
    }
    return (
      <Text className="rounded-lg px-3 py-2 text-[13px] bg-[#E9DFF7] dark:bg-[#3A2A4F] text-[#49216B] dark:text-[#EDE3FA]">
        {viewer.reason ?? "Spin & Win is not available right now."}
      </Text>
    );
  };

  const stageHeight = (wheelSize * 210) / 200 + 56;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
      <View className="flex-1 items-center justify-center bg-black/70 px-4">
        <Pressable
          onPress={close}
          accessibilityLabel="Close Spin and Win"
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View
          style={{ width: cardWidth, maxHeight: height - 48 }}
          className="rounded-3xl overflow-hidden bg-[#FFF9F1] dark:bg-slate-900 border border-[#E6DAF2] dark:border-slate-700"
        >
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            <View
              style={{ backgroundColor: DEEP, height: stageHeight }}
              className="items-center justify-center pt-6"
            >
              <SpinWinWheel
                segments={wheelSegments}
                size={wheelSize}
                rotation={rotation}
                spinMs={spinMs}
                center={hub}
              />
              {celebrate && !reducedMotion ? <Confetti height={stageHeight + 200} /> : null}
            </View>

            <View className="px-5 pt-4 pb-5 gap-3">
              {screen === "terms" ? (
                <View className="gap-2">
                  <TouchableOpacity
                    onPress={() => setScreen("play")}
                    className="flex-row items-center self-start py-1"
                  >
                    <Feather name="arrow-left" size={14} color={dark ? "#CBD5E1" : "#5E4B72"} />
                    <Text className="ml-1 text-[13px] font-semibold text-[#5E4B72] dark:text-slate-300">
                      Back
                    </Text>
                  </TouchableOpacity>
                  <Text className="text-xl font-extrabold text-[#2A1640] dark:text-white">
                    Terms & Conditions
                  </Text>
                  {[
                    `Coupons are valid until ${spinDate(campaign.couponExpiresAt)} and expire automatically when the campaign ends.`,
                    `Valid only on ${categoryList(campaign.eligibleCategories).toLowerCase()}.`,
                    `Every coupon needs a minimum eligible purchase, shown on the coupon under My Coupons. The discount never exceeds ${campaign.maxDiscountPercent}% of the eligible items.`,
                    "One coupon per order. Spin & Win coupons cannot be combined with other promo codes.",
                    "Coupons are linked to your account and cannot be shared or transferred.",
                    "Each coupon can be used once. It is used when payment succeeds; if a payment fails or is cancelled, the coupon stays available until it expires.",
                    "One spin per account for the whole campaign.",
                    "Testkart may withdraw coupons obtained through misuse.",
                  ].map((rule) => (
                    <View key={rule} className="flex-row">
                      <Text style={{ color: GOLD }} className="text-[13px] mr-2">
                        {"•"}
                      </Text>
                      <Text className="flex-1 text-[13px] leading-5 text-[#2A1640] dark:text-slate-200">
                        {rule}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <>
                  <View className="self-start rounded-full px-3 py-0.5 bg-[#E9DFF7] dark:bg-[#3A2A4F]">
                    <Text className="text-xs font-bold text-[#49216B] dark:text-[#EDE3FA]">
                      {campaign.name}
                    </Text>
                  </View>
                  {spin ? null : (
                    <>
                      <Text className="text-[22px] font-extrabold text-[#2A1640] dark:text-white">
                        Diwali Special! Spin & Win
                      </Text>
                      <Text className="text-[13px] leading-5 text-[#5E4B72] dark:text-slate-300">
                        Your preparation deserves a little extra happiness. Spin the wheel and
                        unlock exciting discounts on Testkart!
                      </Text>
                    </>
                  )}
                  {renderAction()}
                  {error ? (
                    <Text className="rounded-lg px-3 py-2 text-[13px] bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300">
                      {error}
                    </Text>
                  ) : null}
                  <View className="flex-row flex-wrap gap-x-6 gap-y-1 pt-3 border-t border-[#E6DAF2] dark:border-slate-700">
                    <TouchableOpacity onPress={() => setScreen("terms")} className="py-1">
                      <Text className="text-[13px] font-bold underline text-[#683A8D] dark:text-[#DCC9F5]">
                        Terms & Conditions
                      </Text>
                    </TouchableOpacity>
                    {spin?.coupon || guest ? null : (
                      <TouchableOpacity onPress={() => goTo("/user/coupons")} className="py-1">
                        <Text className="text-[13px] font-bold underline text-[#683A8D] dark:text-[#DCC9F5]">
                          See My Coupons
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}
            </View>
          </ScrollView>

          <TouchableOpacity
            onPress={close}
            disabled={isSpinning}
            accessibilityLabel="Close"
            style={{ opacity: isSpinning ? 0.5 : 1 }}
            className="absolute top-3 right-3 w-9 h-9 rounded-full items-center justify-center bg-white dark:bg-slate-800 border border-[#E6DAF2] dark:border-slate-700"
          >
            <Feather name="x" size={18} color={dark ? "#FFFFFF" : "#2A1640"} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
