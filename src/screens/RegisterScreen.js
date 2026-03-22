// src/screens/RegisterScreen.js
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { C } from "../constants/colors";
import { Btn, Input, Card } from "../components/UI";
import { useToast } from "../components/UI";
import { apiFetch } from "../api/apiFetch";
import { useAuth } from "../store/useAuth";
import { useLang } from "../i18n";

export default function RegisterScreen({ navigation }) {
  const { login } = useAuth();
  const { t } = useLang();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    full_name: "", email: "", password: "", phone: "", personal_id: "",
  });
  const [loading, setLoading] = useState(false);

  function set(key, val) { setForm(p => ({ ...p, [key]: val })); }

  async function handleRegister() {
    if (!form.full_name || !form.email || !form.password || !form.phone || !form.personal_id) {
      showToast("შეავსე ყველა ველი", "error"); return;
    }
    if (form.personal_id.length !== 11) {
      showToast("პირადი ნომერი უნდა იყოს 11 ციფრი", "error"); return;
    }
    setLoading(true);
    try {
      const data = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          full_name:   form.full_name.trim(),
          email:       form.email.trim().toLowerCase(),
          password:    form.password,
          phone:       form.phone.trim(),
          personal_id: form.personal_id.trim(),
        }),
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
        <View style={styles.logo}>
          <View style={styles.logoIcon}><Text style={styles.logoEmoji}>🔒</Text></View>
          <Text style={styles.logoText}>SafePay<Text style={{ color: C.green }}>.ge</Text></Text>
        </View>

        <Card>
          <Text style={styles.cardTitle}>{t("register.title")}</Text>
          <Input label={t("register.name")} value={form.full_name} onChangeText={v => set("full_name", v)} placeholder="გიორგი ბერიძე" />
          <Input label={t("register.email")} value={form.email} onChangeText={v => set("email", v)} placeholder="email@example.com" keyboardType="email-address" />
          <Input label={t("register.password")} value={form.password} onChangeText={v => set("password", v)} placeholder="მინ. 8 სიმბოლო" secure />
          <Input label={t("register.phone")} value={form.phone} onChangeText={v => set("phone", v)} placeholder="+995 5XX XXX XXX" keyboardType="phone-pad" />
          <Input label={t("register.id")} value={form.personal_id} onChangeText={v => set("personal_id", v)} placeholder="00000000000" keyboardType="number-pad" />
          <Btn title={t("register.btn")} onPress={handleRegister} loading={loading} style={{ marginTop: 4 }} />
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t("register.have.account")} </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.link}>შესვლა</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  logo: { alignItems: "center", marginBottom: 24 },
  logoIcon: { width: 52, height: 52, backgroundColor: C.green, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  logoEmoji: { fontSize: 24 },
  logoText: { fontSize: 24, fontWeight: "800", color: C.text, fontFamily: "serif" },
  cardTitle: { color: C.text, fontSize: 20, fontWeight: "700", marginBottom: 20 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 20, alignItems: "center" },
  footerText: { color: C.muted, fontSize: 14 },
  link: { color: C.green, fontSize: 14, fontWeight: "600" },
});
