// src/screens/CreateDealScreen.js
import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform,
} from "react-native";
import { C, fmt } from "../constants/colors";
import { Card, Btn, Input, Divider } from "../components/UI";
import { useToast } from "../components/UI";
import { apiFetch } from "../api/apiFetch";
import { useAuth } from "../store/useAuth";

export default function CreateDealScreen({ navigation }) {
  const { token, user } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    title: "", amount: "", description: "", confirm_days: "3",
  });
  const [banks, setBanks]       = useState([]);
  const [selBank, setSelBank]   = useState(null);
  const [dealType, setDealType] = useState("card"); // card | wallet
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    apiFetch("/bank-accounts", {}, token).then(b => {
      setBanks(Array.isArray(b) ? b : []);
      const def = b.find(x => x.is_default) || b[0];
      if (def) setSelBank(def.id);
    }).catch(() => {});
  }, [token]);

  function set(key, val) { setForm(p => ({ ...p, [key]: val })); }

  const amount    = parseFloat(form.amount) || 0;
  const spFee     = dealType === "card" ? Math.round(amount * 0.025 * 100) / 100 : 0;
  const bankFee   = dealType === "card" ? Math.round((amount + spFee) * 0.02 * 100) / 100 : 0;
  const total     = amount + spFee + bankFee;

  async function handleCreate() {
    if (!form.title.trim()) { showToast("სათაური სავალდებულოა", "error"); return; }
    if (!amount || amount <= 0) { showToast("შეიყვანე სწორი თანხა", "error"); return; }
    if (dealType === "card" && !selBank) { showToast("საბანკო ანგარიში სავალდებულოა", "error"); return; }

    setLoading(true);
    try {
      const data = await apiFetch("/deals", {
        method: "POST",
        body: JSON.stringify({
          title:               form.title.trim(),
          amount,
          description:         form.description.trim(),
          confirm_days:        parseInt(form.confirm_days) || 3,
          deal_type:           dealType,
          seller_bank_account_id: dealType === "card" ? selBank : null,
          preferred_provider:  "bog",
        }),
      }, token);
      showToast("✅ გარიგება შეიქმნა!", "success");
      navigation.replace("Deal", { code: data.deal_code });
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Deal Type */}
        <Card>
          <Text style={styles.label}>გადახდის ტიპი</Text>
          <View style={styles.typeRow}>
            {[["card","💳 ბარათი"], ["wallet","💰 SafePay საფულე"]].map(([key, lbl]) => (
              <TouchableOpacity key={key} onPress={() => setDealType(key)}
                style={[styles.typeBtn, dealType === key && styles.typeBtnActive]}>
                <Text style={[styles.typeText, dealType === key && styles.typeTextActive]}>{lbl}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {dealType === "wallet" && (
            <Text style={styles.info}>✅ SafePay საკომ. 0% — საფულიდან გადახდა</Text>
          )}
        </Card>

        {/* Form */}
        <Card>
          <Input label="სათაური *" value={form.title} onChangeText={v => set("title", v)}
            placeholder="მაგ: iPhone 15 Pro" />
          <Input label="თანხა (₾) *" value={form.amount} onChangeText={v => set("amount", v)}
            placeholder="0.00" keyboardType="decimal-pad" />
          <Input label="აღწერა" value={form.description} onChangeText={v => set("description", v)}
            placeholder="დეტალები..." multiline />
          <Input label="ავტო-დადასტურება (დღე)" value={form.confirm_days}
            onChangeText={v => set("confirm_days", v)} keyboardType="number-pad" placeholder="3" />
        </Card>

        {/* Bank (card only) */}
        {dealType === "card" && banks.length > 0 && (
          <Card>
            <Text style={styles.label}>🏦 საბანკო ანგარიში (სადაც ჩაირიცხება)</Text>
            {banks.map(b => (
              <TouchableOpacity key={b.id} onPress={() => setSelBank(b.id)}
                style={[styles.bankItem, selBank === b.id && styles.bankItemActive]}>
                <View style={styles.bankBadge}>
                  <Text style={styles.bankBadgeText}>{b.bank_name}</Text>
                </View>
                <Text style={styles.bankIban}>···{b.iban?.slice(-8)}</Text>
                {selBank === b.id && <Text style={{ color: C.green }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {/* Price Breakdown */}
        {amount > 0 && (
          <Card>
            <Text style={styles.label}>💰 ფასი</Text>
            <Row label="ნივთის ღირებულება" value={`${fmt(amount)} ₾`} />
            {dealType === "card" && <>
              <Row label="SafePay (2.5%)" value={`+ ${fmt(spFee)} ₾`} />
              <Row label="ბანკის საკომ. (2%)" value={`+ ${fmt(bankFee)} ₾`} />
            </>}
            <Divider />
            <Row label="სულ" value={`${fmt(total)} ₾`} bold />
          </Card>
        )}

        <Btn title="✅ გარიგების შექმნა" onPress={handleCreate} loading={loading}
          style={{ marginBottom: 24 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Row({ label, value, bold }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 }}>
      <Text style={{ color: C.muted, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: C.text, fontSize: 13, fontWeight: bold ? "700" : "400" }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  label: { color: C.muted, fontSize: 12, fontWeight: "600", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  typeRow: { flexDirection: "row", gap: 10 },
  typeBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: "center", backgroundColor: C.surface },
  typeBtnActive: { borderColor: C.green, backgroundColor: "#1DB95415" },
  typeText: { color: C.muted, fontSize: 13, fontWeight: "600" },
  typeTextActive: { color: C.green },
  info: { color: C.green, fontSize: 12, marginTop: 10 },
  bankItem: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: C.border, marginBottom: 8, backgroundColor: C.surface },
  bankItemActive: { borderColor: C.green },
  bankBadge: { backgroundColor: C.danger, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  bankBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  bankIban: { color: C.muted, flex: 1, fontFamily: "monospace", fontSize: 12 },
});
