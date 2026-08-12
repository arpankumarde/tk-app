import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

const BRIDGE_PATH = "/app-turnstile";

/** Cache-key version. Bump this if a stale 404 is ever served from an edge. */
const BRIDGE_QUERY = "?v=1";

/** How long to wait for a token before deciding verification is unavailable. */
const READY_TIMEOUT_MS = 12000;

// onHttpError/onError fire for sub-resources too (favicon.ico and friends), so
// only failures on the bridge document itself should fail the gate.
const isBridgeDocument = (url: string | undefined) =>
  typeof url === "string" && url.split("?")[0] === `${BASE_URL}${BRIDGE_PATH}`;

export type TurnstileStatus = "pending" | "verified" | "unavailable";

export interface TurnstileGateHandle {
  /** Mint a fresh single-use token. Call after every send attempt. */
  reset: () => void;
}

interface TurnstileGateProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onStatusChange?: (status: TurnstileStatus) => void;
}

type BridgeMessage =
  | { type: "ready" }
  | { type: "token"; token: string }
  | { type: "expired" }
  | { type: "error" }
  | { type: "interactive"; visible: boolean };

/**
 * Cloudflare Turnstile for React Native. Turnstile ships no native SDK, so the
 * web widget is hosted in a WebView on our own domain and the token read back
 * over postMessage. See docs/turnstile-implementation.md.
 *
 * The WebView sits at 1px and transparent while Turnstile runs silently, and
 * expands to a tappable box only when Cloudflare demands an interactive
 * challenge. It stays at 1px rather than 0 or display:none so the page keeps
 * laying out and running its JavaScript on both platforms.
 */
const TurnstileGate = forwardRef<TurnstileGateHandle, TurnstileGateProps>(
  ({ onVerify, onExpire, onStatusChange }, ref) => {
    const webViewRef = useRef<WebView>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [interactive, setInteractive] = useState(false);

    const onStatusChangeRef = useRef(onStatusChange);
    onStatusChangeRef.current = onStatusChange;

    const setStatus = useCallback((status: TurnstileStatus) => {
      onStatusChangeRef.current?.(status);
    }, []);

    const clearTimer = useCallback(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }, []);

    // Verification is best-effort on the client: the server is what actually
    // enforces Turnstile, so a gate that never produces a token must not lock
    // the user out of the screen. Report "unavailable" and let them try.
    const armTimer = useCallback(() => {
      clearTimer();
      timeoutRef.current = setTimeout(() => setStatus("unavailable"), READY_TIMEOUT_MS);
    }, [clearTimer, setStatus]);

    useEffect(() => {
      if (!BASE_URL) {
        setStatus("unavailable");
        return;
      }
      armTimer();
      return clearTimer;
    }, [armTimer, clearTimer, setStatus]);

    useImperativeHandle(
      ref,
      () => ({
        reset: () => {
          if (!BASE_URL) return;
          setStatus("pending");
          armTimer();
          webViewRef.current?.injectJavaScript(
            "window.__tkTurnstileReset && window.__tkTurnstileReset(); true;",
          );
        },
      }),
      [armTimer, setStatus],
    );

    const handleLoadFailure = useCallback(() => {
      clearTimer();
      setStatus("unavailable");
    }, [clearTimer, setStatus]);

    if (!BASE_URL) return null;

    return (
      <View
        style={{
          height: interactive ? 80 : 1,
          opacity: interactive ? 1 : 0,
          overflow: "hidden",
          marginBottom: interactive ? 16 : 0,
        }}
        pointerEvents={interactive ? "auto" : "none"}
      >
        <WebView
          ref={webViewRef}
          source={{ uri: `${BASE_URL}${BRIDGE_PATH}${BRIDGE_QUERY}` }}
          // Required by Turnstile.
          javaScriptEnabled
          domStorageEnabled
          // Turnstile renders its challenge inside about:srcdoc iframes.
          originWhitelist={["https://*", "http://*", "about:*"]}
          // Turnstile relies on cookies/storage persisting across the session.
          thirdPartyCookiesEnabled
          sharedCookiesEnabled
          cacheEnabled
          incognito={false}
          // Do NOT set `userAgent`. Turnstile fails when the UA changes
          // mid-session, so the system WebView UA must be left alone.
          setSupportMultipleWindows={false}
          scrollEnabled={false}
          style={{ backgroundColor: "transparent" }}
          onMessage={(event) => {
            let message: BridgeMessage;
            try {
              message = JSON.parse(event.nativeEvent.data);
            } catch {
              return;
            }
            switch (message.type) {
              case "token":
                if (typeof message.token === "string" && message.token) {
                  clearTimer();
                  onVerify(message.token);
                  setStatus("verified");
                }
                break;
              // Both mean the token we had is gone and Turnstile is refreshing.
              // Re-arm the timer so a refresh that never lands falls through to
              // "unavailable" instead of waiting forever.
              case "expired":
              case "error":
                onExpire?.();
                setStatus("pending");
                armTimer();
                break;
              case "interactive":
                setInteractive(Boolean(message.visible));
                break;
            }
          }}
          onError={({ nativeEvent }) => {
            // No url means we cannot tell which request failed, so treat it as
            // the document rather than swallowing a genuine load failure.
            if (nativeEvent.url && !isBridgeDocument(nativeEvent.url)) return;
            handleLoadFailure();
          }}
          onHttpError={({ nativeEvent }) => {
            if (!isBridgeDocument(nativeEvent.url)) return;
            handleLoadFailure();
          }}
        />
      </View>
    );
  },
);

TurnstileGate.displayName = "TurnstileGate";

export default TurnstileGate;
