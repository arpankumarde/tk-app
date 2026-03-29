import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";

type User = {
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
  role: string;
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
};

const AuthContext = createContext<AuthContextType | null>(null);
const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const savedToken = await SecureStore.getItemAsync("auth_token");
        const savedUser = await SecureStore.getItemAsync("auth_user");
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch (e) {
        console.error("Failed to load auth", e);
      } finally {
        setLoading(false);
      }
    };
    loadAuth();
  }, []);

  const setAuth = async (user: User, token: string) => {
    if (user.avatarUrl?.includes("/svg?")) {
      user = { ...user, avatarUrl: user.avatarUrl.replace("/svg?", "/png?") };
    }
    setUser(user);
    setToken(token);
    await SecureStore.setItemAsync("auth_token", token);
    await SecureStore.setItemAsync("auth_user", JSON.stringify(user));
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await SecureStore.deleteItemAsync("auth_token");
    await SecureStore.deleteItemAsync("auth_user");
    await fetch(`${BASE_URL}/_api/auth/logout`, { method: "POST", credentials: "omit" });
    await WebBrowser.coolDownAsync();
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
