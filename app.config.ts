import Fonts from "expo-font/plugin";
import Image from "expo-image/plugin";
import Router from "expo-router/plugin";
import secureStore from "expo-secure-store/plugin";
import Sharing from "expo-sharing/plugin";
import splashScreen from "expo-splash-screen/plugin";
import Video from "expo-video/plugin";
import webBrowser from "expo-web-browser/plugin";
import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Testkart",
  slug: "testkart",
  version: "4.7.1",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "testkart",
  userInterfaceStyle: "automatic",
  ios: {},
  android: {
    package: "com.testkart.mocktest.courses.studynotes",
    versionCode: 53,
    adaptiveIcon: {
      backgroundColor: "#FF8A50",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          { scheme: "https", host: "testkart.in" },
          { path: "/" },
          { path: "/course" },
          { pathPrefix: "/course/" },
          { path: "/mock-test" },
          { pathPrefix: "/mock-test/" },
          { path: "/study-notes" },
          { pathPrefix: "/study-notes/" },
          { path: "/bundles" },
          { pathPrefix: "/bundles/" },
          { path: "/expert" },
          { pathPrefix: "/expert/" },
          { pathPrefix: "/student/" },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    Router(),
    splashScreen({
      backgroundColor: "#ffffff",
      image: "./assets/images/splash-icon.png",
      imageWidth: 200,
      resizeMode: "contain",
      dark: {
        backgroundColor: "#000000",
      },
    }),
    webBrowser(),
    Sharing(),
    Video(),
    secureStore(),
    Fonts(),
    Image(),
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
