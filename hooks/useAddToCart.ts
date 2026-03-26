import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { useCartContext } from "@/context/CartContext";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

type CartItemType = "test" | "course" | "digitalProduct";

export const useAddToCart = () => {
  const { token } = useAuth();
  const { refreshCart } = useCartContext();
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  const addToCart = async (itemId: number, type: CartItemType) => {
    if (!token) {
      router.push("/login" as any);
      return { success: false, message: "Please log in to add items to cart" };
    }

    const idKeyMap: Record<CartItemType, string> = {
      test: "mockTestId",
      course: "courseId",
      digitalProduct: "digitalProductId",
    };

    try {
      setAdding(true);
      const reqBody = { json: { [idKeyMap[type]]: itemId } };

      const response = await fetch(`${BASE_URL}/_api/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reqBody),
      });

      const data = await response.json();

      const payload = data.json || data;

      if (!response.ok || payload.error) {
        return {
          success: false,
          message: payload.error || payload.message || "Failed to add to cart",
        };
      }

      await refreshCart();

      return {
        success: true,
        message: payload.message || "Added to cart",
      };
    } catch (error) {
      console.error("Error adding to cart:", error);
      return { success: false, message: "Something went wrong" };
    } finally {
      setAdding(false);
    }
  };

  return { addToCart, adding };
};

export default useAddToCart;
