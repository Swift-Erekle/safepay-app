// App.js — SafePay WebView App
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, BackHandler } from "react-native";
import { WebView } from "react-native-webview";
import { useRef, useEffect } from "react";

const SAFEPAY_URL = "https://seven.vercel.app";

export default function App() {
  const webviewRef = useRef(null);

  // Android back button → go back in webview
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
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#0A1628" />
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
        onError={(e) => console.log("WebView error:", e)}
        startInLoadingState={true}
        pullToRefreshEnabled={true}
      />
    </SafeAreaView>
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
