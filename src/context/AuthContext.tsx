import { isAuthError } from "@/utils/authError";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AppState } from "react-native";

export type User = {
  academyName: string | null;
  avatarFileId: string | null;
  avatarUrl: string;
  awardsCertificates: any[];
  bio: string | null;
  displayName: string;
  email: string;
  expertiseAreas: string[];
  id: number;
  instituteType: string | null;
  languages: string[];
  location: string | null;
  mobileNumber: string | null;
  mobileVerified: boolean;
  onboardingCompleted: boolean;
  publicEmail: string | null;
  publicPhone: string | null;
  responseTime: string | null;
  role: "student" | "teacher" | "admin";
  socialLinks: Record<string, string>;
  tagline: string | null;
  websiteUrl: string | null;
  yearsOfExperience: number | null;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  // Clears stored auth and redirects to login. Call when an authed API signals
  // "not authenticated".
  invalidateSession: () => Promise<void>;
  // Re-fetches the session and updates the stored user with fresh server data.
  // Returns the refreshed user, or null if it could not be refreshed.
  refreshSession: () => Promise<User | null>;
};

const AuthContext = createContext<AuthContextType | null>(null);
const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;
const SESSION_CHECK_URL = `${BASE_URL}/_api/auth/session`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const clearStoredAuth = useCallback(async () => {
    setUser(null);
    setToken(null);
    await SecureStore.deleteItemAsync("auth_token");
    await SecureStore.deleteItemAsync("auth_user");
  }, []);

  const invalidateSession = useCallback(async () => {
    await clearStoredAuth();
    router.replace("/login");
  }, [clearStoredAuth]);

  const validateSession = useCallback(
    async (authToken: string) => {
      try {
        const res = await fetch(SESSION_CHECK_URL, {
          headers: { Authorization: `Bearer ${authToken}` },
          credentials: "omit",
        });

        let payload: any;
        try {
          const data = await res.json();
          payload = data?.json ?? data;
        } catch {
          payload = undefined;
        }

        const sessionRejected = res.ok && payload != null && !payload.user;
        if (isAuthError(res.status, payload) || sessionRejected) {
          await invalidateSession();
        }
      } catch (e) {
        console.warn("Session validation skipped (network error):", e);
      }
    },
    [invalidateSession],
  );

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const savedToken = await SecureStore.getItemAsync("auth_token");
        const savedUser = await SecureStore.getItemAsync("auth_user");
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          validateSession(savedToken);
        }
      } catch (e) {
        console.error("Failed to load auth", e);
      } finally {
        setLoading(false);
      }
    };
    loadAuth();
  }, [validateSession]);

  // Re-validate when the app returns to the foreground.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && token) {
        validateSession(token);
      }
    });
    return () => sub.remove();
  }, [token, validateSession]);

  const setAuth = async (user: User, token: string) => {
    if (user.avatarUrl?.includes("/svg?")) {
      user = { ...user, avatarUrl: user.avatarUrl.replace("/svg?", "/png?") };
    }
    setUser(user);
    setToken(token);
    await SecureStore.setItemAsync("auth_token", token);
    await SecureStore.setItemAsync("auth_user", JSON.stringify(user));
  };

  const refreshSession = useCallback(async (): Promise<User | null> => {
    const authToken = await SecureStore.getItemAsync("auth_token");
    if (!authToken) return null;
    try {
      const res = await fetch(SESSION_CHECK_URL, {
        headers: { Authorization: `Bearer ${authToken}` },
        credentials: "omit",
      });

      let payload: any;
      try {
        const data = await res.json();
        payload = data?.json ?? data;
      } catch {
        payload = undefined;
      }

      if (
        isAuthError(res.status, payload) ||
        (res.ok && payload && !payload.user)
      ) {
        await invalidateSession();
        return null;
      }
      if (res.ok && payload?.user) {
        await setAuth(payload.user, authToken);
        return payload.user as User;
      }
    } catch (e) {
      console.warn("Session refresh skipped (network error):", e);
    }
    return null;
  }, [invalidateSession]);

  const logout = useCallback(async () => {
    await clearStoredAuth();
    await fetch(`${BASE_URL}/_api/auth/logout`, {
      method: "POST",
      credentials: "omit",
    });
    await WebBrowser.coolDownAsync();
  }, [clearStoredAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        setAuth,
        logout,
        invalidateSession,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
