// src/screens/WalletScreen.js
import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity,
} from "react-native";
import { C, fmt } from "../constants/colors";
import { Card, Btn, Input, Divider, Spinner, Section } from "../components/UI";
import { useToast } from "../components/UI";
import { apiFetch } from "../api/apiFetch";
import { useAuth } from "../store/useAuth";
import { useFocusEffect } from "@react-navigation/native";

export default function WalletScreen() {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [wallet, setWallet]         = useState(null);
  const [transactions, setTxs]      = useState([]);
  const [withdrawals, setWds]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState("main"); // main | withdraw | transfer

  // Withdraw form
  const [wdAmount, setWdAmount]     = useState("");
  const [wdBankId, setWdBankId]     = useState(null);
  const [banks, setBanks]           = useState([]);
  const [wdLoading, setWdLoading]   = useState(false);
  const [wdId, setWdId]             = useState(null);
  const [wdCode, setWdCode]         = useState("");

  // Transfer form
  const [trTo, setTrTo]             = useState("");
  const [trAmount, setTrAmount]     = useState("");
  const [trLoading, setTrLoading]   = useState(false);

  const loadAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [w, tx, wds, bks] = await Promise.all([
        apiFetch("/wallet/balance", {}, token),
        apiFetch("/wallet/transactions?limit=20", {}, token),
        apiFetch("/wallet/withdrawals", {}, token),
        apiFetch("/bank-accounts", {}, token),
      ]);
      setWallet(w);
      setTxs(Array.isArray(tx) ? tx : []);
      setWds(Array.isArray(wds) ? wds : []);
      setBanks(Array.isArray(bks) ? bks : []);
      if (!wdBankId && bks.length > 0) setWdBankId(bks[0].id);
    } catch (e) { if (!silent) showToast(e.message, "error"); }
    finally { setLoading(false); }
  }, [token]);

  useFocusEffect(useCallback(() => { loadAll(); }, [loadAll]));

  async function handleWithdraw() {
    if (!wdAmount || parseFloat(wdAmount) <= 0) { showToast("შეიყვანე თანხა", "error"); return; }
    if (!wdBankId) { showToast("საბანკო ანგარიში არ გაქვს", "error"); return; }
    setWdLoading(true);
    try {
      const r = await apiFetch("/wallet/withdraw", {
        method: "POST",
        body: JSON.stringify({ amount: parseFloat(wdAmount), bank_account_id: wdBankId }),
      }, token);
      setWdId(r.withdrawal_id);
      showToast("კოდი გამოგზავნილია ელ.ფოსტაზე", "success");
    } catch (e) { showToast(e.message, "error"); }
    finally { setWdLoading(false); }
  }

  async function handleVerify() {
    if (!wdCode.trim()) { showToast("შეიყვანე კოდი", "error"); return; }
    setWdLoading(true);
    try {
      await apiFetch(`/wallet/withdrawals/${wdId}/verify`, {
        method: "POST",
        body: JSON.stringify({ code: wdCode.trim() }),
      }, token);
      showToast("✅ მოთხოვნა გაიგზავნა ადმინთან", "success");
      setWdId(null); setWdCode(""); setWdAmount("");
      loadAll(true);
    } catch (e) { showToast(e.message, "error"); }
    finally { setWdLoading(false); }
  }

  async function handleTransfer() {
    if (!trTo.trim() || !trAmount || parseFloat(trAmount) <= 0) {
      showToast("შეავსე ყველა ველი", "error"); return;
    }
    setTrLoading(true);
    try {
      await apiFetch("/wallet/transfer", {
        method: "POST",
        body: JSON.stringify({ to: trTo.trim(), amount: parseFloat(trAmount) }),
      }, token);
      showToast("✅ გადარიცხვა შესრულდა", "success");
      setTrTo(""); setTrAmount("");
      loadAll(true);
    } catch (e) { showToast(e.message, "error"); }
    finally { setTrLoading(false); }
  }

  async function cancelWithdrawal(id) {
    try {
      await apiFetch(`/wallet/withdrawals/${id}`, { method: "DELETE" }, token);
      showToast("✅ გაუქმდა", "success");
      loadAll(true);
    } catch (e) { showToast(e.message, "error"); }
  }

  if (loading) return <View style={styles.container}><Spinner /></View>;

  const avail = parseFloat(wallet?.balance || 0) - parseFloat(wallet?.frozen || 0);

  return (
    <View style={styles.container}>
      {/* Wallet Header */}
      <View style={styles.header}>
        <Text style={styles.walletNum}>💰 {wallet?.wallet_number || "—"}</Text>
        <Text style={styles.balance}>{fmt(wallet?.balance || 0)} ₾</Text>
        <View style={styles.subRow}>
          <Text style={styles.subLabel}>ხელმისაწვდომი: <Text style={{ color: C.green }}>{fmt(avail)} ₾</Text></Text>
          <Text style={styles.subLabel}>  |  გაყინული: <Text style={{ color: C.warning }}>{fmt(wallet?.frozen || 0)} ₾</Text></Text>
        </View>
      </View>

      {/* Tab Buttons */}
      <View style={styles.tabs}>
        {[["main","📋 ისტორია"], ["withdraw","🏦 გატანა"], ["transfer","↔️ გადარიცხვა"]].map(([key, label]) => (
          <TouchableOpacity key={key} onPress={() => setTab(key)}
            style={[styles.tab, tab === key && styles.tabActive]}>
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl onRefresh={() => loadAll(true)} tintColor={C.green} />}
      >
        {/* HISTORY */}
        {tab === "main" && (
          <>
            {withdrawals.filter(w => ["pending","pending_verification"].includes(w.status)).map(w => (
              <Card key={w.id}>
                <View style={styles.row}>
                  <View>
                    <Text style={styles.txType}>⏳ გატანის მოთხოვნა</Text>
                    <Text style={styles.txDate}>{w.bank_name} · {w.iban?.slice(-8)}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.txAmount, { color: C.danger }]}>-{fmt(w.amount)} ₾</Text>
                    <TouchableOpacity onPress={() => cancelWithdrawal(w.id)}>
                      <Text style={styles.cancelLink}>❌ გაუქმება</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            ))}

            {transactions.length === 0 ? (
              <View style={styles.empty}><Text style={styles.emptyText}>ტრანზაქციები არ არის</Text></View>
            ) : transactions.map(tx => {
              const isIn = tx.to_wallet_id === wallet?.id || tx.type === "topup" || tx.type === "escrow_refund" || tx.type === "escrow_release";
              return (
                <Card key={tx.id} style={{ marginBottom: 8 }}>
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txType}>{tx.description || tx.type}</Text>
                      <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString("ka-GE")}</Text>
                    </View>
                    <Text style={[styles.txAmount, { color: isIn ? C.green : C.danger }]}>
                      {isIn ? "+" : "-"}{fmt(tx.amount)} ₾
                    </Text>
                  </View>
                </Card>
              );
            })}
          </>
        )}

        {/* WITHDRAW */}
        {tab === "withdraw" && (
          <Card>
            {!wdId ? (
              <>
                <Text style={styles.sectionTitle}>🏦 თანხის გატანა</Text>
                <Input label={`თანხა (ხელმისაწვდომი: ${fmt(avail)} ₾)`}
                  value={wdAmount} onChangeText={setWdAmount}
                  placeholder="0.00" keyboardType="decimal-pad" />

                {banks.length > 0 ? banks.map(b => (
                  <TouchableOpacity key={b.id} onPress={() => setWdBankId(b.id)}
                    style={[styles.bankItem, wdBankId === b.id && styles.bankItemActive]}>
                    <Text style={styles.bankName}>{b.bank_name}</Text>
                    <Text style={styles.bankIban}>···{b.iban?.slice(-8)}</Text>
                  </TouchableOpacity>
                )) : <Text style={styles.noBank}>საბანკო ანგარიში არ გაქვს</Text>}

                <Btn title="გატანის მოთხოვნა" onPress={handleWithdraw} loading={wdLoading}
                  style={{ marginTop: 16 }} disabled={!wdBankId} />
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>📧 შეიყვანე ემაილის კოდი</Text>
                <Input label="6-ნიშნა კოდი" value={wdCode} onChangeText={setWdCode}
                  placeholder="123456" keyboardType="number-pad" />
                <Btn title="დადასტურება" onPress={handleVerify} loading={wdLoading} />
                <TouchableOpacity onPress={() => setWdId(null)} style={{ marginTop: 12, alignItems: "center" }}>
                  <Text style={styles.cancelLink}>გაუქმება</Text>
                </TouchableOpacity>
              </>
            )}
          </Card>
        )}

        {/* TRANSFER */}
        {tab === "transfer" && (
          <Card>
            <Text style={styles.sectionTitle}>↔️ SafePay გადარიცხვა</Text>
            <Input label="მიმღები (საფულე / ელ.ფოსტა / პირ.ნომ.)"
              value={trTo} onChangeText={setTrTo} placeholder="SP-..." />
            <Input label={`თანხა (ხელმისაწვდომი: ${fmt(avail)} ₾)`}
              value={trAmount} onChangeText={setTrAmount} placeholder="0.00" keyboardType="decimal-pad" />
            <Btn title="გადარიცხვა" onPress={handleTransfer} loading={trLoading} style={{ marginTop: 8 }} />
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.navy, padding: 24, paddingTop: 50, alignItems: "center", borderBottomWidth: 1, borderColor: C.border },
  walletNum: { color: C.muted, fontSize: 12, marginBottom: 8, fontFamily: "monospace" },
  balance: { color: C.text, fontSize: 36, fontWeight: "800", marginBottom: 8 },
  subRow: { flexDirection: "row" },
  subLabel: { color: C.muted, fontSize: 12 },
  tabs: { flexDirection: "row", backgroundColor: C.navyLight, borderBottomWidth: 1, borderColor: C.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderColor: C.green },
  tabText: { color: C.muted, fontSize: 12, fontWeight: "600" },
  tabTextActive: { color: C.green },
  scroll: { padding: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  txType: { color: C.text, fontSize: 13, fontWeight: "600", marginBottom: 2 },
  txDate: { color: C.muted, fontSize: 11 },
  txAmount: { fontSize: 15, fontWeight: "700" },
  empty: { alignItems: "center", paddingTop: 40 },
  emptyText: { color: C.muted },
  sectionTitle: { color: C.text, fontSize: 16, fontWeight: "700", marginBottom: 16 },
  bankItem: { backgroundColor: C.surface, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  bankItemActive: { borderColor: C.green },
  bankName: { color: C.text, fontWeight: "700", fontSize: 13 },
  bankIban: { color: C.muted, fontSize: 12, fontFamily: "monospace" },
  noBank: { color: C.muted, fontSize: 13, textAlign: "center", marginVertical: 20 },
  cancelLink: { color: C.danger, fontSize: 13, fontWeight: "600" },
});
