// src/screens/DashboardScreen.js
import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, StatusBar,
} from "react-native";
import { C, fmt } from "../constants/colors";
import { Card, StatusBadge, Spinner, Btn } from "../components/UI";
import { useToast } from "../components/UI";
import { apiFetch } from "../api/apiFetch";
import { useAuth } from "../store/useAuth";
import { useLang } from "../i18n";
import { useFocusEffect } from "@react-navigation/native";

const STATUS_LABELS = {
  pending: "⏳ მოლოდინში", awaiting_payment: "💳 გადახდის მოლოდინი",
  held: "🔒 გაყინული", shipped: "🚚 გაგზავნილი",
  confirmed: "✅ დასრულებული", dispute: "⚖️ დავა",
  cancelled: "❌ გაუქმებული", dispute_resolved_pending: "⏳ დავა გადაწყდა",
  refunded: "↩️ დაბრუნებული",
};

export default function DashboardScreen({ navigation }) {
  const { token, user } = useAuth();
  const { t } = useLang();
  const { showToast } = useToast();

  const [deals, setDeals]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDeals = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await apiFetch("/deals", {}, token);
      setDeals(Array.isArray(data) ? data : []);
    } catch (e) {
      if (!silent) showToast(e.message, "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { loadDeals(); }, [loadDeals]));

  const stats = {
    held: deals.filter(d => ["held","shipped","dispute","dispute_resolved_pending"].includes(d.status))
               .reduce((s, d) => s + +d.amount, 0),
    done: deals.filter(d => d.status === "confirmed").length,
  };

  const renderDeal = ({ item: d }) => {
    const isSeller = d.seller_id === user?.id;
    const label = STATUS_LABELS[d.status] || d.status;
    return (
      <TouchableOpacity onPress={() => navigation.navigate("Deal", { code: d.deal_code })} activeOpacity={0.8}>
        <Card style={styles.dealCard}>
          <View style={styles.dealRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.dealTitle} numberOfLines={1}>{d.title}</Text>
              <Text style={styles.dealCode}>{d.deal_code}</Text>
              <Text style={styles.dealRole}>{isSeller ? "🏪 გამყიდველი" : "🛒 მყიდველი"}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.dealAmount}>{fmt(d.amount)} ₾</Text>
              <StatusBadge status={d.status} label={label} />
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t("dash.title")}</Text>
          <Text style={styles.headerSub}>გამარჯობა, {user?.full_name?.split(" ")[0]}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("CreateDeal")} style={styles.createBtn}>
          <Text style={styles.createBtnText}>+ ახალი</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{fmt(stats.held)} ₾</Text>
          <Text style={styles.statLabel}>🔒 გაყინული</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statVal, { color: C.green }]}>{stats.done}</Text>
          <Text style={styles.statLabel}>✅ დასრულებული</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statVal, { color: C.info }]}>{deals.length}</Text>
          <Text style={styles.statLabel}>📋 სულ</Text>
        </View>
      </View>

      {loading ? <Spinner /> : (
        <FlatList
          data={deals}
          keyExtractor={d => d.id?.toString() || d.deal_code}
          renderItem={renderDeal}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadDeals(true); }} tintColor={C.green} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>{t("dash.empty")}</Text>
              <Btn title="+ ახალი გარიგება" onPress={() => navigation.navigate("CreateDeal")} style={{ marginTop: 16, alignSelf: "center", paddingHorizontal: 24 }} />
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.navy, padding: 20, paddingTop: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { color: C.text, fontSize: 22, fontWeight: "800" },
  headerSub: { color: C.muted, fontSize: 13, marginTop: 2 },
  createBtn: { backgroundColor: C.green, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  createBtnText: { color: C.navy, fontWeight: "700", fontSize: 14 },
  statsRow: { flexDirection: "row", padding: 16, gap: 10 },
  statCard: { flex: 1, backgroundColor: C.navyLight, borderRadius: 12, padding: 12, alignItems: "center", borderWidth: 1, borderColor: C.border },
  statVal: { color: C.text, fontSize: 16, fontWeight: "800" },
  statLabel: { color: C.muted, fontSize: 10, marginTop: 4, textAlign: "center" },
  list: { padding: 16, paddingTop: 4 },
  dealCard: { marginBottom: 8 },
  dealRow: { flexDirection: "row", alignItems: "center" },
  dealTitle: { color: C.text, fontSize: 15, fontWeight: "700", marginBottom: 3 },
  dealCode: { color: C.green, fontSize: 11, fontFamily: "monospace", marginBottom: 3 },
  dealRole: { color: C.muted, fontSize: 11 },
  dealAmount: { color: C.green, fontSize: 17, fontWeight: "800", marginBottom: 6 },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: C.muted, fontSize: 15 },
});
