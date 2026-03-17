import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { useAuth } from "@/context/AuthContext";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export function useGoogleAuth() {
  const { setAuth } = useAuth();

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "testkart",
    path: "callback",
  });

  const signInWithGoogle = async () => {
    // console.log("[useGoogleAuth] redirectUri:", redirectUri);
    try {
      const authorizeUrl = `${BASE_URL}/_api/auth/oauth_authorize?provider=google&role=student&redirectTo=${encodeURIComponent(redirectUri)}`;
      // console.log("[useGoogleAuth] fetching authorize URL:", authorizeUrl);
      const authorizeRes = await fetch(authorizeUrl);
      const authorizeBody = await authorizeRes.json();
      // console.log("[useGoogleAuth] authorize response:", authorizeBody);
      const { redirectUrl } = authorizeBody;

      if (!redirectUrl) {
        throw new Error("No redirect URL from server");
      }

      // console.log(
      //   "[useGoogleAuth] opening browser session with redirectUrl:",
      //   redirectUrl,
      // );
      const result = await WebBrowser.openAuthSessionAsync(
        redirectUrl,
        redirectUri,
      );
      // console.log("[useGoogleAuth] browser session result:", result);

      if (result.type !== "success") {
        console.log(
          "[useGoogleAuth] auth cancelled or failed, type:",
          result.type,
        );
        return;
      }

      const url = new URL(result.url);
      const token = url.searchParams.get("token");

      if (!token) {
        throw new Error("No token received in redirect");
      }

      const sessionRes = await fetch(`${BASE_URL}/_api/auth/session`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const sessionBody = await sessionRes.json();
      // console.debug("[useGoogleAuth] session response:", sessionBody);
      const { user } = sessionBody.json ?? sessionBody;

      if (!user) throw new Error("Failed to get user session");

      // console.debug("[useGoogleAuth] calling setAuth with user:", user);
      setAuth(user, token);
    } catch (err) {
      console.error("[useGoogleAuth] Google sign-in error:", err);
      throw err;
    }
  };

  return { signInWithGoogle };
}
