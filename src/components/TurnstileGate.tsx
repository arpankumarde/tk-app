import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

const BRIDGE_PATH = "/app-turnstile";

/** Cache-key version. Bump this if a stale 404 is ever served from an edge. */
const BRIDGE_QUERY = "?v=1";

/** How long to wait for a token before deciding verification is unavailable. */
const READY_TIMEOUT_MS = 12000;

const RESET_SCRIPT =
  "window.__tkTurnstileReset && window.__tkTurnstileReset(); true;";

// onHttpError/onError fire for sub-resources too (favicon.ico and friends), so
// only failures on the bridge document itself should fail the gate.
const isBridgeDocument = (url: string | undefined) =>
  typeof url === "string" && url.split("?")[0] === `${BASE_URL}${BRIDGE_PATH}`;

export type TurnstileStatus = "pending" | "verified" | "unavailable";

export interface TurnstileGateHandle {
  /**
   * Resolves with a single-use token for one send, or null when verification
   * is unavailable. Hands over the token already minted when there is one and
   * only runs a new challenge once that token has been spent.
   */
  getToken: () => Promise<string | null>;
}

interface TurnstileGateProps {
  onStatusChange?: (status: TurnstileStatus) => void;
}

type BridgeMessage =
  | { type: "ready" }
  | { type: "token"; token: string }
  | { type: "expired" }
  | { type: "error" }
  | { type: "interactive"; visible: boolean };

type Waiter = {
  promise: Promise<string | null>;
  resolve: (token: string | null) => void;
};

/**
 * Cloudflare Turnstile for React Native. Turnstile ships no native SDK, so the
 * web widget is hosted in a WebView on our own domain and the token read back
 * over postMessage. See docs/turnstile-implementation.md.
 *
 * The WebView sits at 1px and transparent while Turnstile runs silently, and
 * expands to a tappable box only when Cloudflare demands an interactive
 * challenge for a token that is actually wanted. It stays at 1px rather than 0
 * or display:none so the page keeps laying out and running its JavaScript on
 * both platforms.
 *
 * A challenge runs on mount so the first send is ready immediately. Once that
 * token is spent the gate stays quiet until getToken() asks for another, so a
 * user who already passed the check is never shown a checkbox for a send they
 * have not requested.
 */
const TurnstileGate = forwardRef<TurnstileGateHandle, TurnstileGateProps>(
  ({ onStatusChange }, ref) => {
    const webViewRef = useRef<WebView>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const statusRef = useRef<TurnstileStatus>("pending");
    const tokenRef = useRef<string | null>(null);
    const waiterRef = useRef<Waiter | null>(null);
    const wantedRef = useRef(true);
    const loadFailedRef = useRef(false);
    const [interactive, setInteractive] = useState(false);
    const [wanted, setWanted] = useState(true);

    const onStatusChangeRef = useRef(onStatusChange);
    onStatusChangeRef.current = onStatusChange;

    const setStatus = useCallback((status: TurnstileStatus) => {
      statusRef.current = status;
      onStatusChangeRef.current?.(status);
    }, []);

    const markWanted = useCallback((value: boolean) => {
      wantedRef.current = value;
      setWanted(value);
    }, []);

    const settleWaiter = useCallback((token: string | null) => {
      const waiter = waiterRef.current;
      if (!waiter) return false;
      waiterRef.current = null;
      waiter.resolve(token);
      return true;
    }, []);

    const clearTimer = useCallback(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }, []);

    // Verification is best-effort on the client: the server is what actually
    // enforces Turnstile, so a gate that never produces a token must not lock
    // the user out of the screen. Report "unavailable" and let the send go.
    const armTimer = useCallback(() => {
      clearTimer();
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        setStatus("unavailable");
        settleWaiter(null);
      }, READY_TIMEOUT_MS);
    }, [clearTimer, setStatus, settleWaiter]);

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
        getToken: () => {
          if (!BASE_URL) return Promise.resolve(null);

          if (tokenRef.current) {
            const token = tokenRef.current;
            tokenRef.current = null;
            markWanted(false);
            return Promise.resolve(token);
          }

          if (waiterRef.current) return waiterRef.current.promise;

          let resolve!: (token: string | null) => void;
          const promise = new Promise<string | null>((r) => {
            resolve = r;
          });
          waiterRef.current = { promise, resolve };
          markWanted(true);

          // The first token is still being minted, so wait for it.
          if (statusRef.current === "pending") return promise;

          setInteractive(false);
          setStatus("pending");
          armTimer();
          if (loadFailedRef.current) {
            loadFailedRef.current = false;
            webViewRef.current?.reload();
          } else {
            webViewRef.current?.injectJavaScript(RESET_SCRIPT);
          }
          return promise;
        },
      }),
      [armTimer, markWanted, setStatus],
    );

    const handleLoadFailure = useCallback(() => {
      clearTimer();
      loadFailedRef.current = true;
      tokenRef.current = null;
      setStatus("unavailable");
      settleWaiter(null);
    }, [clearTimer, setStatus, settleWaiter]);

    if (!BASE_URL) return null;

    const expanded = interactive && wanted;

    return (
      <View
        style={{
          height: expanded ? 80 : 1,
          opacity: expanded ? 1 : 0,
          overflow: "hidden",
          marginBottom: expanded ? 16 : 0,
        }}
        pointerEvents={expanded ? "auto" : "none"}
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
                  loadFailedRef.current = false;
                  if (settleWaiter(message.token)) {
                    markWanted(false);
                  } else {
                    tokenRef.current = message.token;
                  }
                  setStatus("verified");
                }
                break;
              // Both mean the token we had is gone and Turnstile is refreshing.
              // While a token is wanted, re-arm the timer so a refresh that
              // never lands falls through to "unavailable". Once the last one
              // is spent nothing is waiting, so a background refresh must not
              // put the screen back into "pending".
              case "expired":
              case "error":
                tokenRef.current = null;
                if (wantedRef.current) {
                  setStatus("pending");
                  armTimer();
                }
                break;
              case "interactive":
                setInteractive(Boolean(message.visible));
                // A visible challenge is waiting on the user, not stuck, so it
                // must not time out into a tokenless send the server rejects.
                if (wantedRef.current) {
                  if (message.visible) clearTimer();
                  else if (!tokenRef.current) armTimer();
                }
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
