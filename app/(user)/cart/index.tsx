import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  StatusBar,
  Alert,
  Modal,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import Header from "@/components/Header";
import BottomTabs from "@/components/BottomTabs";
import { useAuth } from "@/context/AuthContext";
import { useCartContext, CartItem } from "@/context/CartContext";

const Cart = () => {
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const { token, user, setAuth } = useAuth();
  const {
    cart,
    loading,
    removeItem,
    applyPromoCode,
    clearPromo,
    appliedPromoCode,
    eligibleItemIds,
    initiatePayment,
    verifyPayment,
  } = useCartContext();

  const [promoExpanded, setPromoExpanded] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState<{
    text: string;
    success: boolean;
  } | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [payuData, setPayuData] = useState<Awaited<
    ReturnType<typeof initiatePayment>
  > | null>(null);
  const [webViewVisible, setWebViewVisible] = useState(false);

  const handleRemoveItem = async (itemId: number) => {
    setRemovingId(itemId);
    setPromoMessage(null);
    await removeItem(itemId);
    setRemovingId(null);
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoMessage(null);
    const result = await applyPromoCode(promoCode.trim());
    setPromoMessage({ text: result.message, success: result.success });
    setPromoLoading(false);
    if (result.success) setPromoExpanded(false);
  };

  const handleClearPromo = () => {
    clearPromo();
    setPromoCode("");
    setPromoMessage(null);
  };

  const handleProceedToPayment = async () => {
    setOrderLoading(true);
    const result = await initiatePayment();
    setOrderLoading(false);

    if (!result.success) {
      Alert.alert(
        "Payment Failed",
        (result as any).error || "Failed to initiate payment",
      );
      return;
    }

    setPayuData(result);
    setWebViewVisible(true);
  };

  const handleDeepLinkResult = async (params: {
    status: string | null;
    orderId: string | null;
    txnid: string | null;
    token: string | null;
  }) => {
    setWebViewVisible(false);
    setPayuData(null);

    if (params.status === "success") {
      // Update auth with the fresh token from payment callback
      if (params.token && user) {
        await setAuth(user, params.token);
      }
      Alert.alert("Payment Successful", "Your order has been placed!", [
        { text: "OK", onPress: () => router.replace("/(user)" as any) },
      ]);
    } else if (params.status === "cancelled") {
      Alert.alert(
        "Payment Cancelled",
        "Your payment was cancelled. Your cart is still saved.",
      );
    } else {
      Alert.alert(
        "Payment Failed",
        "Your payment could not be completed. Please try again.",
      );
    }
  };

  const handleWebViewClose = async (txnid: string) => {
    setWebViewVisible(false);
    setPayuData(null);

    // Fallback: user manually closed the WebView, verify via API
    const result = await verifyPayment({ txnid });
    console.log("Verify payment result:", result);

    if (result.orderStatus === "completed") {
      Alert.alert(
        "Payment Successful",
        result.message || "Your order has been placed!",
        [{ text: "OK", onPress: () => router.replace("/(user)" as any) }],
      );
    } else if (result.orderStatus === "pending") {
      Alert.alert(
        "Payment Pending",
        "Your payment is being processed. We'll notify you once confirmed.",
      );
    } else if (result.orderStatus === "failed") {
      Alert.alert(
        "Payment Failed",
        result.message || "Your payment could not be completed.",
      );
    } else {
      Alert.alert(
        "Payment Status Unknown",
        "Please check your orders for status.",
      );
    }
  };

  const itemDiscount = cart.discount - cart.promoDiscount;
  const discountPercent =
    cart.subtotal > 0 ? Math.round((itemDiscount / cart.subtotal) * 100) : 0;

  if (loading) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-900">
        <StatusBar
          barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        />
        <SafeAreaView edges={["top", "left", "right"]} className="flex-1">
          <Header />
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#FF8A50" />
          </View>
        </SafeAreaView>
        <BottomTabs />
      </View>
    );
  }

  if (cart.items.length === 0) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-900">
        <StatusBar
          barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        />
        <SafeAreaView edges={["top", "left", "right"]} className="flex-1">
          <Header />
          <View className="flex-1 items-center justify-center px-8">
            <View className="w-20 h-20 rounded-full bg-orange-50 dark:bg-orange-900/20 items-center justify-center mb-6">
              <Feather name="shopping-cart" size={36} color="#FF8A50" />
            </View>
            <Text className="text-2xl font-black text-slate-800 dark:text-white mb-2">
              Your cart is empty
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 text-center text-base mb-8">
              Browse our courses, tests, and study materials to get started.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(main)/shop" as any)}
              className="bg-primary px-8 py-4 rounded-2xl"
            >
              <Text className="text-white font-black text-base">
                Browse Shop
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        <BottomTabs />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-900">
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />
      <SafeAreaView edges={["top", "left", "right"]} className="flex-1">
        <Header />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View className="px-5 pt-5">
            {/* Title */}
            <View className="flex-row items-baseline mb-5">
              <Text className="text-2xl font-black text-slate-800 dark:text-white">
                Shopping Cart
              </Text>
              <Text className="text-base text-slate-500 dark:text-slate-400 ml-2 font-bold">
                ({cart.itemCount} {cart.itemCount === 1 ? "item" : "items"})
              </Text>
            </View>

            {/* Cart Items */}
            <View className="mb-5">
              {cart.items.map((item) => (
                <CartItemCard
                  key={`${item.type}-${item.id}`}
                  item={item}
                  onRemove={() => handleRemoveItem(item.id)}
                  removing={removingId === item.id}
                  colorScheme={colorScheme}
                  promoEligible={eligibleItemIds.includes(item.resourceId)}
                />
              ))}
            </View>

            {/* Order Summary */}
            <View className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700">
              <Text className="text-xl font-black text-slate-800 dark:text-white mb-5">
                Order Summary
              </Text>

              {/* Subtotal */}
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-base text-slate-600 dark:text-slate-300 font-bold">
                  Subtotal
                </Text>
                <Text className="text-base text-slate-800 dark:text-white font-black">
                  ₹{cart.subtotal.toFixed(2)}
                </Text>
              </View>

              {/* Item Discount */}
              {itemDiscount > 0 && (
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Text className="text-base text-green-600 dark:text-green-400 font-bold">
                      Discount
                    </Text>
                    <View className="ml-2 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-md">
                      <Text className="text-xs font-black text-green-700 dark:text-green-400">
                        {discountPercent}% OFF
                      </Text>
                    </View>
                  </View>
                  <Text className="text-base text-green-600 dark:text-green-400 font-black">
                    -₹{itemDiscount.toFixed(2)}
                  </Text>
                </View>
              )}

              {/* Promo Discount */}
              {appliedPromoCode && cart.promoDiscount > 0 && (
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-base text-green-600 dark:text-green-400 font-bold">
                    Promo Code ({appliedPromoCode})
                  </Text>
                  <Text className="text-base text-green-600 dark:text-green-400 font-black">
                    -₹{cart.promoDiscount.toFixed(2)}
                  </Text>
                </View>
              )}

              {/* Divider */}
              <View className="h-[1px] bg-gray-100 dark:bg-slate-700 my-4" />

              {/* Total */}
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-lg font-black text-slate-800 dark:text-white">
                  Total Amount
                </Text>
                <Text className="text-2xl font-black text-slate-800 dark:text-white">
                  ₹{cart.total.toFixed(2)}
                </Text>
              </View>
              <Text className="text-sm text-slate-400 dark:text-slate-500 text-right mb-5">
                Inclusive of all taxes
              </Text>

              {/* Promo Code */}
              {appliedPromoCode ? (
                <View className="mb-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Feather name="check-circle" size={18} color="#16a34a" />
                    <Text className="ml-2 text-base font-black text-slate-800 dark:text-white">
                      {appliedPromoCode}
                    </Text>
                    <Text className="ml-2 text-base text-green-600 dark:text-green-400 font-bold">
                      - ₹{cart.promoDiscount.toFixed(2)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleClearPromo}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="x" size={20} color="#64748b" />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    className="flex-row items-center justify-between mb-3"
                    onPress={() => setPromoExpanded(!promoExpanded)}
                  >
                    <View className="flex-row items-center">
                      <Feather name="tag" size={18} color="#FF8A50" />
                      <Text className="ml-2 text-primary font-black text-base">
                        Have a Promo Code?
                      </Text>
                    </View>
                    <Feather
                      name={promoExpanded ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#FF8A50"
                    />
                  </TouchableOpacity>

                  {promoExpanded && (
                    <View className="mb-4">
                      <View className="flex-row items-center">
                        <TextInput
                          className="flex-1 h-12 border border-gray-200 dark:border-slate-600 rounded-xl px-4 text-slate-800 dark:text-white bg-gray-50 dark:bg-slate-700 font-bold"
                          placeholder="Enter Promo Code"
                          placeholderTextColor={
                            colorScheme === "dark" ? "#64748b" : "#9ca3af"
                          }
                          value={promoCode}
                          onChangeText={setPromoCode}
                          autoCapitalize="characters"
                        />
                        <TouchableOpacity
                          className="ml-3 bg-primary h-12 px-6 rounded-xl items-center justify-center"
                          onPress={handleApplyPromo}
                          disabled={promoLoading}
                        >
                          {promoLoading ? (
                            <ActivityIndicator size="small" color="white" />
                          ) : (
                            <Text className="text-white font-black text-base">
                              Apply
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                      {promoMessage && (
                        <Text
                          className={`mt-2 text-sm font-bold ${promoMessage.success ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}
                        >
                          {promoMessage.text}
                        </Text>
                      )}
                    </View>
                  )}
                </>
              )}

              {/* Proceed to Payment */}
              <TouchableOpacity
                className="bg-primary h-14 rounded-2xl flex-row items-center justify-center mt-2 shadow-md shadow-orange-500/20"
                onPress={handleProceedToPayment}
                disabled={orderLoading}
              >
                {orderLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Feather name="lock" size={18} color="white" />
                    <Text className="text-white font-black text-lg ml-2">
                      Proceed to Payment
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Secure Transaction */}
              <View className="flex-row items-center justify-center mt-4">
                <Feather name="shield" size={14} color="#94a3b8" />
                <Text className="ml-1.5 text-sm text-slate-400 dark:text-slate-500 font-bold">
                  Secure Transaction
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
      <BottomTabs />

      {/* PayU Payment WebView */}
      {payuData && payuData.success && (
        <Modal
          visible={webViewVisible}
          animationType="slide"
          onRequestClose={() => handleWebViewClose((payuData as any).txnid)}
        >
          <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
            <View className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-slate-700">
              <TouchableOpacity
                onPress={() => handleWebViewClose((payuData as any).txnid)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather
                  name="x"
                  size={24}
                  color={colorScheme === "dark" ? "#fff" : "#1e293b"}
                />
              </TouchableOpacity>
              <Text className="ml-4 text-base font-black text-slate-800 dark:text-white">
                Complete Payment
              </Text>
            </View>
            <WebView
              source={{
                html: buildPayuForm(payuData as any),
              }}
              onShouldStartLoadWithRequest={(request) => {
                const { url } = request;
                // Intercept deep link redirect from payment callback
                if (url.startsWith("testkart://")) {
                  const queryString = url.split("?")[1] || "";
                  const params = new URLSearchParams(queryString);
                  handleDeepLinkResult({
                    status: params.get("status"),
                    orderId: params.get("order_id"),
                    txnid: params.get("txnid"),
                    token: params.get("token"),
                  });
                  return false;
                }
                // Handle UPI app intents
                if (
                  url.startsWith("upi://") ||
                  url.startsWith("tez://") ||
                  url.startsWith("phonepe://") ||
                  url.startsWith("paytmmp://") ||
                  url.startsWith("intent://")
                ) {
                  Linking.openURL(url).catch(() => {
                    Alert.alert(
                      "App Not Found",
                      "No UPI app found to handle this payment.",
                    );
                  });
                  return false;
                }
                return true;
              }}
              originWhitelist={[
                "https://*",
                "http://*",
                "upi://*",
                "tez://*",
                "phonepe://*",
                "paytmmp://*",
                "intent://*",
                "testkart://*",
              ]}
              startInLoadingState
              renderLoading={() => (
                <View className="flex-1 items-center justify-center">
                  <ActivityIndicator size="large" color="#FF8A50" />
                </View>
              )}
            />
          </SafeAreaView>
        </Modal>
      )}
    </View>
  );
};

const buildPayuForm = (data: {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  hash: string;
  payuUrl: string;
  udf1?: string;
}) => `
<!DOCTYPE html>
<html>
<body onload="document.forms[0].submit()">
  <form method="POST" action="${data.payuUrl}">
    <input type="hidden" name="key" value="${data.key}" />
    <input type="hidden" name="txnid" value="${data.txnid}" />
    <input type="hidden" name="amount" value="${data.amount}" />
    <input type="hidden" name="productinfo" value="${data.productinfo}" />
    <input type="hidden" name="firstname" value="${data.firstname}" />
    <input type="hidden" name="email" value="${data.email}" />
    <input type="hidden" name="phone" value="${data.phone}" />
    <input type="hidden" name="surl" value="${data.surl}" />
    <input type="hidden" name="furl" value="${data.furl}" />
    <input type="hidden" name="hash" value="${data.hash}" />
    ${data.udf1 ? `<input type="hidden" name="udf1" value="${data.udf1}" />` : ""}
  </form>
</body>
</html>
`;

const CartItemCard = ({
  item,
  onRemove,
  removing,
  colorScheme,
  promoEligible,
}: {
  item: CartItem;
  onRemove: () => void;
  removing: boolean;
  colorScheme: string | undefined;
  promoEligible: boolean;
}) => {
  const hasDiscount = item.originalPrice > item.price;

  return (
    <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 mb-3 border border-gray-100 dark:border-slate-700 flex-row items-center">
      {/* Thumbnail */}
      <Image
        source={{
          uri:
            item.thumbnailUrl && item.thumbnailUrl !== ""
              ? item.thumbnailUrl
              : item.type === "course"
                ? "https://ik.imagekit.io/testkart/placeholders/Online%20Course.jpg"
                : item.type === "test"
                  ? "https://ik.imagekit.io/testkart/placeholders/Mock%20Test.jpg"
                  : "https://ik.imagekit.io/testkart/placeholders/study-notes.png",
        }}
        className="w-[72px] h-[72px] rounded-xl"
        resizeMode="cover"
      />

      {/* Info */}
      <View className="flex-1 ml-4 mr-2">
        <Text
          className="text-base font-black text-slate-800 dark:text-white leading-tight"
          numberOfLines={2}
        >
          {item.title}
        </Text>
        {item.teacherName ? (
          <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-bold">
            by {item.teacherName}
          </Text>
        ) : null}
        {item.type === "digitalProduct" && (
          <View className="mt-1.5 self-start rounded bg-gray-100 dark:bg-slate-700 px-2 py-0.5">
            <Text className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Digital Download
            </Text>
          </View>
        )}
        {promoEligible && (
          <View className="mt-1.5 flex-row items-center self-start rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-2 py-0.5">
            <Feather name="tag" size={12} color="#16a34a" />
            <Text className="ml-1 text-xs font-black text-green-600 dark:text-green-400">
              Offer Applied
            </Text>
          </View>
        )}
      </View>

      {/* Price & Delete */}
      <View className="items-end">
        {removing ? (
          <ActivityIndicator
            size="small"
            color={colorScheme === "dark" ? "#94a3b8" : "#64748b"}
          />
        ) : (
          <TouchableOpacity
            onPress={onRemove}
            className="p-1.5 mb-2"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather
              name="trash-2"
              size={18}
              color={colorScheme === "dark" ? "#94a3b8" : "#64748b"}
            />
          </TouchableOpacity>
        )}
        {hasDiscount && (
          <Text className="text-sm text-slate-400 dark:text-slate-500 line-through">
            ₹{item.originalPrice.toFixed(2)}
          </Text>
        )}
        <Text className="text-lg font-black text-slate-800 dark:text-white">
          ₹{item.price.toFixed(2)}
        </Text>
      </View>
    </View>
  );
};

export default Cart;
