// src/screens/LoginScreen.js
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { C } from "../constants/colors";
import { Btn, Input, Card } from "../components/UI";
import { useToast } from "../components/UI";
import { apiFetch } from "../api/apiFetch";
import { useAuth } from "../store/useAuth";
import { useLang } from "../i18n";

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { t } = useLang();
  const { showToast } = useToast();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode]         = useState("");
  const [loading, setLoading]   = useState(false);
  const [need2FA, setNeed2FA]   = useState(false);
  const [userId, setUserId]     = useState(null);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      showToast("შეავსე ყველა ველი", "error"); return;
    }
    setLoading(true);
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      if (data.requires_2fa) {
        setNeed2FA(true);
        setUserId(data.user_id);
        showToast("კოდი გამოგზავნილია ელ.ფოსტაზე", "success");
      } else {
        await login(data.user, data.token);
      }
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handle2FA() {
    if (!code.trim()) { showToast("შეიყვანე კოდი", "error"); return; }
    setLoading(true);
    try {
      const data = await apiFetch("/auth/admin-verify", {
        method: "POST",
        body: JSON.stringify({ user_id: userId, code: code.trim() }),
      });
      await login(data.user, data.token);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logo}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoEmoji}>🔒</Text>
          </View>
          <Text style={styles.logoText}>
            SafePay<Text style={{ color: C.green }}>.ge</Text>
          </Text>
          <Text style={styles.logoSub}>უსაფრთხო ესქრო სერვისი</Text>
        </View>

        <Card>
          <Text style={styles.cardTitle}>{t("login.title")}</Text>

          {!need2FA ? (
            <>
              <Input label={t("login.email")} value={email} onChangeText={setEmail}
                placeholder="email@example.com" keyboardType="email-address" />
              <Input label={t("login.password")} value={password} onChangeText={setPassword}
                placeholder="••••••••" secure />

              <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")} style={{ marginBottom: 16, alignSelf: "flex-end" }}>
                <Text style={styles.link}>პაროლი დაგავიწყდა?</Text>
              </TouchableOpacity>

              <Btn title={t("login.btn")} onPress={handleLogin} loading={loading} />
            </>
          ) : (
            <>
              <Text style={styles.info2fa}>📧 შეიყვანე ელ.ფოსტაზე მოსული 6-ნიშნა კოდი</Text>
              <Input label="კოდი" value={code} onChangeText={setCode}
                placeholder="123456" keyboardType="number-pad" />
              <Btn title="შესვლა" onPress={handle2FA} loading={loading} />
            </>
          )}
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t("login.no.account")} </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={styles.link}>რეგისტრაცია</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  logo: { alignItems: "center", marginBottom: 32 },
  logoIcon: {
    width: 60, height: 60, backgroundColor: C.green,
    borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  logoEmoji: { fontSize: 28 },
  logoText: { fontSize: 28, fontWeight: "800", color: C.text, fontFamily: "serif" },
  logoSub: { color: C.muted, fontSize: 13, marginTop: 4 },
  cardTitle: { color: C.text, fontSize: 20, fontWeight: "700", marginBottom: 20 },
  info2fa: { color: C.muted, fontSize: 13, marginBottom: 16, lineHeight: 20 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 20, alignItems: "center" },
  footerText: { color: C.muted, fontSize: 14 },
  link: { color: C.green, fontSize: 14, fontWeight: "600" },
});
