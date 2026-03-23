import { StatusBar } from "expo-status-bar";
import { StyleSheet, BackHandler } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useRef, useEffect, useState } from "react";
import { Linking } from "react-native";

const BASE = "https://safepay-seven.vercel.app";

export default function App() {
  const webviewRef = useRef(null);
  const [startUrl, setStartUrl] = useState(BASE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // ბმულიდან გახსნისას — კონკრეტული URL
    Linking.getInitialURL().then(url => {
      if (url && url.startsWith(BASE)) {
        setStartUrl(url);
      }
      setReady(true);
    }).catch(() => setReady(true));

    // App background-ში იყო, ახალი ბმული მოვიდა
    const sub = Linking.addEventListener("url", ({ url }) => {
      if (url && url.startsWith(BASE)) {
        webviewRef.current?.injectJavaScript(
          `window.location.href = ${JSON.stringify(url)}; true;`
        );
      }
    });

    // Back button
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

  if (!ready) return null;

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
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A1628" },
  webview: { flex: 1 },
});
