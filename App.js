// App.js — SafePay WebView App
import { StatusBar } from "expo-status-bar";
import { StyleSheet, BackHandler } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useRef, useEffect } from "react";

const SAFEPAY_URL = "https://safepay-seven.vercel.app";

export default function App() {
  const webviewRef = useRef(null);

  useEffect(() => {
    const onBack = () => {
      if (webviewRef.current) {
        webviewRef.current.goBack();
        return true;
      }
      return false;
    };
    BackHandler.addEventListener("hardwareBackPress", onBack);
    return () => BackHandler.removeEventListener("hardwareBackPress", onBack);
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#0A1628" translucent={false} />
      <SafeAreaView style={styles.container} edges={["top", "bottom", "left", "right"]}>
        <WebView
          ref={webviewRef}
          source={{ uri: SAFEPAY_URL }}
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
  container: {
    flex: 1,
    backgroundColor: "#0A1628",
  },
  webview: {
    flex: 1,
  },
});
