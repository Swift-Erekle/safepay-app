// src/screens/ProfileScreen.js
import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from "react-native";
import { C } from "../constants/colors";
import { Card, Btn, Section, Divider } from "../components/UI";
import { useToast } from "../components/UI";
import { apiFetch } from "../api/apiFetch";
import { useAuth } from "../store/useAuth";
import { useLang } from "../i18n";
import { useFocusEffect } from "@react-navigation/native";

export default function ProfileScreen({ navigation }) {
  const { token, user, logout, updateUser } = useAuth();
  const { t, lang, setLang } = useLang();
  const { showToast } = useToast();

  const [banks, setBanks]     = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [me, bks] = await Promise.all([
        apiFetch("/auth/me", {}, token),
        apiFetch("/bank-accounts", {}, token),
      ]);
      if (me.user) await updateUser(me.user);
      setBanks(Array.isArray(bks) ? bks : []);
    } catch (e) { showToast(e.message, "error"); }
    finally { setLoading(false); }
  }, [token]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  async function handleLogout() {
    try { await apiFetch("/auth/logout", { method: "POST" }, token); } catch {}
    await logout();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.full_name?.[0]?.toUpperCase() || "?"}</Text>
        </View>
        <Text style={styles.name}>{user?.full_name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.badgeRow}>
          {user?.is_verified && <View style={styles.badge}><Text style={styles.badgeText}>✅ ვერიფიცირებული</Text></View>}
          {user?.is_admin   && <View style={[styles.badge, {backgroundColor:"#2D0A2A"}]}><Text style={[styles.badgeText,{color:"#FF6EC7"}]}>👑 ადმინი</Text></View>}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl onRefresh={loadData} tintColor={C.green} />}
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}><Text style={styles.statVal}>{user?.deals_count || 0}</Text><Text style={styles.statLabel}>გარიგება</Text></View>
          <View style={styles.stat}><Text style={[styles.statVal, {color: C.green}]}>{parseFloat(user?.rating || 5).toFixed(1)}</Text><Text style={styles.statLabel}>⭐ რეიტინგი</Text></View>
          <View style={styles.stat}><Text style={[styles.statVal, {color: C.info}]}>{user?.free_deals || 0}</Text><Text style={styles.statLabel}>🎁 უფასო</Text></View>
        </View>

        {/* Language */}
        <Card>
          <Text style={styles.sectionLabel}>🌐 ენა</Text>
          <View style={styles.langRow}>
            {[["ka","🇬🇪 ქართული"], ["en","🇬🇧 English"], ["ru","🇷🇺 Русский"]].map(([key, lbl]) => (
              <TouchableOpacity key={key} onPress={() => setLang(key)}
                style={[styles.langBtn, lang === key && styles.langBtnActive]}>
                <Text style={[styles.langText, lang === key && styles.langTextActive]}>{lbl}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Bank Accounts */}
        <Card>
          <Text style={styles.sectionLabel}>🏦 საბანკო ანგარიშები</Text>
          {banks.length === 0
            ? <Text style={styles.muted}>ანგარიში არ გაქვს</Text>
            : banks.map(b => (
              <View key={b.id} style={styles.bankItem}>
                <View style={[styles.bankBadge, b.bank_name === "TBC" ? styles.tbcBadge : styles.bogBadge]}>
                  <Text style={styles.bankBadgeText}>{b.bank_name}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.iban}>···{b.iban?.slice(-8)}</Text>
                  <Text style={styles.accName}>{b.account_name}</Text>
                </View>
                {b.is_default && <Text style={{ color: C.green, fontSize: 11 }}>ძირითადი</Text>}
              </View>
            ))
          }
        </Card>

        {/* Personal Info */}
        <Card>
          <Text style={styles.sectionLabel}>👤 პირადი ინფო</Text>
          <InfoRow label="ელ.ფოსტა" value={user?.email} />
          <InfoRow label="ტელეფონი" value={user?.phone || "—"} />
          <InfoRow label="პირადი ნომ." value={user?.personal_id || "—"} />
          <InfoRow label="Referral" value={user?.referral_code || "—"} />
        </Card>

        {/* Logout */}
        <Btn title="🚪 გამოსვლა" onPress={handleLogout} color={C.danger} textColor={C.white}
          outline style={{ marginTop: 8, marginBottom: 32 }} />
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 7 }}>
      <Text style={{ color: C.muted, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: C.text, fontSize: 13, maxWidth: "60%", textAlign: "right" }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.navy, padding: 24, paddingTop: 50, alignItems: "center", borderBottomWidth: 1, borderColor: C.border },
  avatar: { width: 72, height: 72, backgroundColor: C.green, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { color: C.navy, fontSize: 30, fontWeight: "800" },
  name: { color: C.text, fontSize: 20, fontWeight: "700" },
  email: { color: C.muted, fontSize: 13, marginTop: 4 },
  badgeRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  badge: { backgroundColor: "#0A2D1A", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: C.green, fontSize: 11, fontWeight: "700" },
  statsRow: { flexDirection: "row", padding: 16, gap: 10 },
  stat: { flex: 1, backgroundColor: C.navyLight, borderRadius: 12, padding: 12, alignItems: "center", borderWidth: 1, borderColor: C.border },
  statVal: { color: C.text, fontSize: 18, fontWeight: "800" },
  statLabel: { color: C.muted, fontSize: 10, marginTop: 4 },
  scroll: { padding: 16, paddingBottom: 40 },
  sectionLabel: { color: C.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  muted: { color: C.muted, fontSize: 13 },
  langRow: { flexDirection: "row", gap: 8 },
  langBtn: { flex: 1, padding: 8, borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: "center", backgroundColor: C.surface },
  langBtnActive: { borderColor: C.green, backgroundColor: "#1DB95415" },
  langText: { color: C.muted, fontSize: 11, fontWeight: "600" },
  langTextActive: { color: C.green },
  bankItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  bankBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  bogBadge: { backgroundColor: "#C62828" },
  tbcBadge: { backgroundColor: "#0066CC" },
  bankBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  iban: { color: C.text, fontFamily: "monospace", fontSize: 13 },
  accName: { color: C.muted, fontSize: 11 },
});
