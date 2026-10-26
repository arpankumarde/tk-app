import React, { useEffect, useRef, useState } from "react";
import { Text, TouchableOpacity } from "react-native";
import Feather from "@react-native-vector-icons/feather";
import { usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useActiveSpinCampaign } from "@/hooks/useSpinWin";
import SpinWinModal from "./SpinWinModal";

/* The bottom-tab screens. Checkout, payment, test and reader screens never show the wheel. */
const TAB_PATHS = ["/", "/courses", "/tests", "/live", "/shop", "/user"];

/*
 * Mounted once at the root, for students and logged-out visitors (the backend returns no campaign
 * to teachers and admins). Visitors see the same wheel but sign in before spinning, so every spin
 * is made on an account; the web's guest spins live in a browser cookie the app does not keep.
 * The pill and the automatic popup appear only while the viewer may still spin; the popup opens on
 * its own once per app launch, like once per browser session on the web, and once more when a
 * visitor comes back signed in from its login button.
 */
export default function SpinWinLauncher() {
  const { user, token, loading } = useAuth();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const enabled = !loading && (!token || user?.role === "student");
  const { view, refetch } = useActiveSpinCampaign(enabled);
  const [open, setOpen] = useState(false);
  const autoOpened = useRef<Set<string>>(new Set());
  const reopenAfterLogin = useRef(false);

  const onTab = TAB_PATHS.includes(pathname);
  const live = !!view && view.campaign.phase === "active";
  // A campaign that needs login reports "Log in to spin." to visitors instead of canSpin.
  const available =
    !!view &&
    (view.viewer.canSpin || (!view.viewer.loggedIn && view.viewer.reason === "Log in to spin."));

  useEffect(() => {
    if (!view || !live || !onTab || open || !view.viewer.loggedIn || !reopenAfterLogin.current) {
      return;
    }
    reopenAfterLogin.current = false;
    const id = setTimeout(() => setOpen(true), 300);
    return () => clearTimeout(id);
  }, [view, live, onTab, open]);

  useEffect(() => {
    if (!view || !live || !onTab || open || !view.campaign.popupEnabled || !available) {
      return;
    }
    const slug = view.campaign.slug;
    if (autoOpened.current.has(slug)) return;
    const id = setTimeout(() => {
      autoOpened.current.add(slug);
      setOpen(true);
    }, view.campaign.popupDelaySeconds * 1000);
    return () => clearTimeout(id);
  }, [view, live, onTab, open, available]);

  if (!view || !live) return null;

  return (
    <>
      {!open && onTab && available ? (
        <TouchableOpacity
          onPress={() => setOpen(true)}
          activeOpacity={0.85}
          accessibilityLabel="Open Spin and Win"
          style={{
            position: "absolute",
            right: 12,
            bottom: Math.max(insets.bottom, 12) + 72,
            backgroundColor: "#49216B",
            borderColor: "#E9B957",
            elevation: 6,
            shadowColor: "#000",
            shadowOpacity: 0.25,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
          }}
          className="flex-row items-center rounded-full border-2 px-4 min-h-[44px]"
        >
          <Feather name="gift" size={18} color="#FFF9F1" />
          <Text style={{ color: "#FFF9F1" }} className="ml-2 font-extrabold text-sm">
            Spin & Win
          </Text>
        </TouchableOpacity>
      ) : null}
      {open ? (
        <SpinWinModal
          onClose={() => setOpen(false)}
          view={view}
          onChanged={refetch}
          onLoginRequested={() => {
            reopenAfterLogin.current = true;
          }}
        />
      ) : null}
    </>
  );
}
