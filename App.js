// App.js — SafePay Mobile App
import React from "react";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./src/store/useAuth";
import { LangProvider } from "./src/i18n";
import { ToastProvider } from "./src/components/UI";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <AuthProvider>
      <LangProvider>
        <ToastProvider>
          <StatusBar style="light" backgroundColor="#0A1628" />
          <AppNavigator />
        </ToastProvider>
      </LangProvider>
    </AuthProvider>
  );
}
