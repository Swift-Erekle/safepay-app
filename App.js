// App.js — SafePay Expo App v2.0 (with Push Notifications)
import { StatusBar } from "expo-status-bar";
import { StyleSheet, BackHandler, Platform, Alert } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useRef, useEffect, useState, useCallback } from "react";
import { Linking } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE = "https://safepay-seven.vercel.app";
const API  = process.env.EXPO_PUBLIC_API_URL || "https://safepay-seven.vercel.app/api"; // backend API URL

// ── Notification handler (foreground) ─────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

// ── Register for Expo push notifications ──────────────────────────
async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.warn("[Push] Simulator — push not available");
    return null;
  }

  // Check/request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("[Push] Permission denied");
    return null;
  }

  // Android channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("safepay", {
      name: "SafePay შეტყობინებები",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#00C853",
      sound: "default",
    });
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log("[Push] Expo token:", token);
    return token;
  } catch (err) {
    console.warn("[Push] Token fetch failed:", err.message);
    return null;
  }
}

// ── Send token to SafePay backend ─────────────────────────────────
async function sendPushTokenToBackend(expoToken, authToken, deviceId) {
  if (!expoToken || !authToken) return;
  try {
    await fetch(`${API}/push/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        type: "expo",
        subscription: expoToken,
        device_id: deviceId,
      }),
    });
    console.log("[Push] ✅ Expo token registered");
  } catch (err) {
    console.warn("[Push] Backend register failed:", err.message);
  }
}

export default function App() {
  const webviewRef   = useRef(null);
  const [startUrl, setStartUrl] = useState(BASE);

  // Push state
  const [pushToken, setPushToken] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [deviceId,  setDeviceId]  = useState(null);

  // ── Init: stable deviceId (persisted) + push registration ────────
  // deviceId must survive app restarts so UPSERT works correctly
  useEffect(() => {
    async function init() {
      // 1. Get or create stable device ID
      let id = await AsyncStorage.getItem("safepay_device_id").catch(() => null);
      if (!id) {
        id = Math.random().toString(36).slice(2) + Date.now().toString(36);
        await AsyncStorage.setItem("safepay_device_id", id).catch(() => {});
      }
      setDeviceId(id);

      // 2. Register push
      const token = await registerForPushNotifications();
      if (token) setPushToken(token);
    }
    init();
  }, []);

  // ── When auth token + pushToken + deviceId ready → register push ──
  useEffect(() => {
    if (pushToken && authToken && deviceId) {
      sendPushTokenToBackend(pushToken, authToken, deviceId);
    }
  }, [pushToken, authToken, deviceId]);

  // ── Notification tap → navigate WebView ──────────────────────────
  useEffect(() => {
    // App open via notification tap
    Notifications.getLastNotificationResponseAsync().then(response => {
      const url = response?.notification?.request?.content?.data?.url;
      if (url) setStartUrl(BASE + url);
    });

    // Notification arrives while app is open
    const tapSub = Notifications.addNotificationResponseReceivedListener(response => {
      const url = response.notification.request.content.data?.url;
      if (url && webviewRef.current) {
        webviewRef.current.injectJavaScript(
          `window.location.href = ${JSON.stringify(BASE + url)}; true;`
        );
      }
    });

    return () => tapSub.remove();
  }, []);

  // ── Deep links ───────────────────────────────────────────────────
  useEffect(() => {
    Linking.getInitialURL().then(url => {
      if (url && url.startsWith(BASE)) setStartUrl(url);
    }).catch(() => {});

    const sub = Linking.addEventListener("url", ({ url }) => {
      if (url && url.startsWith(BASE)) {
        webviewRef.current?.injectJavaScript(
          `window.location.href = ${JSON.stringify(url)}; true;`
        );
      }
    });

    const onBack = () => {
      if (webviewRef.current) { webviewRef.current.goBack(); return true; }
      return false;
    };
    BackHandler.addEventListener("hardwareBackPress", onBack);

    return () => {
      sub.remove();
      BackHandler.removeEventListener("hardwareBackPress", onBack);
    };
  }, []);

  // ── WebView message handler — receives auth token from web app ───
  const onMessage = useCallback((event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "AUTH_TOKEN" && msg.token) {
        setAuthToken(msg.token);
      }
      if (msg.type === "LOGOUT") {
        setAuthToken(null);
      }
    } catch { /* non-JSON messages ignored */ }
  }, []);

  // ── JS injected into WebView — posts auth token to native ────────
  const INJECTED_JS = `
    (function() {
      // Send existing token on load
      try {
        const stored = localStorage.getItem('token');
        if (stored) {
          const t = JSON.parse(stored);
          if (t) window.ReactNativeWebView.postMessage(JSON.stringify({type:'AUTH_TOKEN', token: t}));
        }
      } catch(e) {}

      // Listen for login/logout events
      const origSet = localStorage.setItem.bind(localStorage);
      localStorage.setItem = function(key, value) {
        origSet(key, value);
        if (key === 'token') {
          try {
            const t = JSON.parse(value);
            if (t) window.ReactNativeWebView.postMessage(JSON.stringify({type:'AUTH_TOKEN', token: t}));
          } catch(e) {}
        }
      };
      const origRemove = localStorage.removeItem.bind(localStorage);
      localStorage.removeItem = function(key) {
        origRemove(key);
        if (key === 'token') {
          window.ReactNativeWebView.postMessage(JSON.stringify({type:'LOGOUT'}));
        }
      };
    })();
    true;
  `;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#0A1628" translucent={false} />
      <SafeAreaView style={styles.container} edges={["top","bottom","left","right"]}>
        <WebView
          ref={webviewRef}
          source={{ uri: startUrl }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsBackForwardNavigationGestures={true}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          userAgent="SafePay-App/1.0 (Android)"
          startInLoadingState={true}
          pullToRefreshEnabled={true}
          overScrollMode="always"
          injectedJavaScript={INJECTED_JS}
          onMessage={onMessage}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A1628" },
  webview:   { flex: 1 },
});
