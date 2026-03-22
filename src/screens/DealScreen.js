// src/screens/DealScreen.js
import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Linking, Alert,
} from "react-native";
import { C, fmt } from "../constants/colors";
import { Card, Btn, StatusBadge, Spinner, Divider, ConfirmModal } from "../components/UI";
import { useToast } from "../components/UI";
import { apiFetch } from "../api/apiFetch";
import { useAuth } from "../store/useAuth";
import { useFocusEffect } from "@react-navigation/native";

const STATUS_LABELS = {
  pending: "⏳ მოლოდინში", awaiting_payment: "💳 გადახდის მოლოდინი",
  held: "🔒 გაყინული", shipped: "🚚 გაგზავნილი",
  confirmed: "✅ დასრულებული", dispute: "⚖️ დავა",
  cancelled: "❌ გაუქმებული", dispute_resolved_pending: "⏳ დავა გადაწყდა",
  refunded: "↩️ დაბრუნებული",
};

export default function DealScreen({ route, navigation }) {
  const { code } = route.params;
  const { token, user } = useAuth();
  const { showToast } = useToast();

  const [deal, setDeal]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirm, setConfirm]   = useState(null); // { action, title, message }

  const loadDeal = useCallback(async () => {
    try {
      const data = await apiFetch(`/deals/${code}`, {}, token);
      setDeal(data);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [code, token]);

  useFocusEffect(useCallback(() => { loadDeal(); }, [loadDeal]));

  async function doAction(action, body = {}) {
    setActionLoading(true);
    setConfirm(null);
    try {
      await apiFetch(`/deals/${code}/${action}`, { method: "POST", body: JSON.stringify(body) }, token);
      showToast("✅ შესრულდა", "success");
      loadDeal();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setActionLoading(false);
    }
  }

  function askAction(action, title, message, body = {}) {
    setConfirm({ action, title, message, body });
  }

  if (loading) return <View style={styles.container}><Spinner /></View>;
  if (!deal) return (
    <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
      <Text style={{ color: C.muted }}>გარიგება ვერ მოიძებნა</Text>
    </View>
  );

  const isSeller = deal.seller_id === user?.id;
  const isBuyer  = deal.buyer_id  === user?.id;
  const label = STATUS_LABELS[deal.status] || deal.status;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl onRefresh={loadDeal} tintColor={C.green} />}
      >
        {/* Deal Header */}
        <Card>
          <View style={styles.row}>
            <Text style={styles.dealTitle} numberOfLines={2}>{deal.title}</Text>
            <StatusBadge status={deal.status} label={label} />
          </View>
          <Text style={styles.code}>{deal.deal_code}</Text>
          {deal.description ? <Text style={styles.desc}>{deal.description}</Text> : null}
        </Card>

        {/* Amounts */}
        <Card>
          <Row label="💰 თანხა" value={`${fmt(deal.amount)} ₾`} bold green />
          <Row label="🏦 საბანკო საკომ." value={`${fmt(deal.bank_commission || 0)} ₾`} />
          <Row label="📊 SafePay საკომ." value={`${fmt(deal.commission || 0)} ₾`} />
          <Divider />
          <Row label="💳 სულ" value={`${fmt(deal.total || deal.amount)} ₾`} bold />
        </Card>

        {/* Participants */}
        <Card>
          <Text style={styles.sectionLabel}>მონაწილეები</Text>
          <Row label="🏪 გამყიდველი" value={deal.seller_name || "—"} />
          <Row label="🛒 მყიდველი" value={deal.buyer_name || "—"} />
          <Row label="⏱ ავტო-დადასტურება" value={`${deal.confirm_days || 3} დღე`} />
        </Card>

        {/* Actions */}
        <View style={styles.actions}>

          {/* SELLER: Pay link share */}
          {isSeller && deal.status === "pending" && (
            <>
              <Btn title="📋 ბმულის კოპირება" color={C.info} textColor={C.white}
                onPress={() => showToast("ბმული კოპირებულია", "success")}
                style={{ marginBottom: 10 }}
              />
              <Btn title="❌ გაუქმება" outline color={C.danger}
                onPress={() => askAction("cancel", "გაუქმება?", "გარიგება გაუქმდება.")}
                loading={actionLoading}
              />
            </>
          )}

          {/* SELLER: Ship */}
          {isSeller && deal.status === "held" && (
            <Btn title="🚚 გაგზავნა" color={C.info} textColor={C.white}
              onPress={() => askAction("ship", "გაგზავნა?", "დაადასტური რომ გარიგება გაიგზავნა.")}
              loading={actionLoading}
            />
          )}

          {/* BUYER: Pay */}
          {isBuyer && deal.status === "pending" && deal.payment_method === "wallet" && (
            <Btn title="💳 გადახდა საფულიდან" color={C.green} textColor={C.navy}
              onPress={() => askAction("pay", "გადახდა?", `${fmt(deal.total || deal.amount)} ₾ გაიყინება საფულიდან.`)}
              loading={actionLoading}
            />
          )}

          {/* BUYER: Confirm */}
          {isBuyer && ["held","shipped"].includes(deal.status) && (
            <Btn title="✅ დადასტურება" color={C.green} textColor={C.navy}
              onPress={() => askAction("confirm", "დადასტურება?", "გარიგება დასრულდება და გამყიდველი მიიღებს თანხას.")}
              loading={actionLoading}
              style={{ marginBottom: 10 }}
            />
          )}

          {/* BUYER: Dispute */}
          {isBuyer && ["held","shipped"].includes(deal.status) && (
            <Btn title="⚖️ დავა" outline color={C.danger}
              onPress={() => askAction("dispute", "დავის გახსნა?", "ადმინი განიხილავს სიტუაციას.")}
              loading={actionLoading}
            />
          )}

        </View>
      </ScrollView>

      <ConfirmModal
        visible={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        onConfirm={() => doAction(confirm.action, confirm.body)}
        onCancel={() => setConfirm(null)}
        danger={confirm?.action === "cancel" || confirm?.action === "dispute"}
      />
    </View>
  );
}

function Row({ label, value, bold, green }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={[rowStyles.value, bold && { fontWeight: "700" }, green && { color: C.green }]}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  label: { color: C.muted, fontSize: 13 },
  value: { color: C.text, fontSize: 13, maxWidth: "60%", textAlign: "right" },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  dealTitle: { color: C.text, fontSize: 18, fontWeight: "700", flex: 1, marginRight: 12 },
  code: { color: C.green, fontSize: 12, fontFamily: "monospace", marginBottom: 8 },
  desc: { color: C.muted, fontSize: 13, marginTop: 4, lineHeight: 18 },
  sectionLabel: { color: C.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  actions: { gap: 10, marginTop: 4 },
});
