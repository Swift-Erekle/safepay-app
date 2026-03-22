// src/components/UI.js — ყველა საბაზო კომპონენტი
import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import {
  View, Text, TouchableOpacity, TextInput,
  ActivityIndicator, StyleSheet, Modal, Pressable, Animated,
} from "react-native";
import { C } from "../constants/colors";

export function Btn({ title, onPress, color, textColor, loading, disabled, style, outline }) {
  const bg = outline ? "transparent" : (color || C.green);
  const tc = textColor || (outline ? (color || C.green) : C.navy);
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.btn, { backgroundColor: bg, borderColor: color || C.green, borderWidth: outline ? 1 : 0, opacity: disabled || loading ? 0.6 : 1 }, style]}
      activeOpacity={0.8}
    >
      {loading
        ? <ActivityIndicator color={tc} size="small" />
        : <Text style={[styles.btnText, { color: tc }]}>{title}</Text>
      }
    </TouchableOpacity>
  );
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Input({ label, value, onChangeText, placeholder, secure, keyboardType, style, multiline, editable = true }) {
  return (
    <View style={[styles.inputWrap, style]}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <TextInput
        style={[styles.input, multiline && { height: 80, textAlignVertical: "top" }, !editable && { opacity: 0.6 }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        secureTextEntry={secure}
        keyboardType={keyboardType || "default"}
        multiline={multiline}
        editable={editable}
      />
    </View>
  );
}

export function Spinner({ size = "large" }) {
  return (
    <View style={styles.spinnerWrap}>
      <ActivityIndicator color={C.green} size={size} />
    </View>
  );
}

export function StatusBadge({ status, label }) {
  const map = {
    pending:                  { bg: "#1E3A5F", color: "#6B7280" },
    awaiting_payment:         { bg: "#2D2200", color: "#F59E0B" },
    held:                     { bg: "#0A2D1A", color: "#1DB954" },
    shipped:                  { bg: "#0D2240", color: "#3B82F6" },
    confirmed:                { bg: "#0A2D1A", color: "#1DB954" },
    dispute:                  { bg: "#2D0A0A", color: "#EF4444" },
    cancelled:                { bg: "#1E1E1E", color: "#6B7280" },
    dispute_resolved_pending: { bg: "#2D2200", color: "#F59E0B" },
    refunded:                 { bg: "#0D2240", color: "#3B82F6" },
  };
  const s = map[status] || { bg: "#1E1E1E", color: "#6B7280" };
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.color }]}>{label || status}</Text>
    </View>
  );
}

export function Divider({ style }) {
  return <View style={[styles.divider, style]} />;
}

export function Section({ title, children, style }) {
  return (
    <View style={[styles.section, style]}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

export function Toast({ message, type = "success", onHide }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => onHide?.());
  }, []);
  const bg = type === "error" ? C.danger : type === "warning" ? C.warning : C.green;
  return (
    <Animated.View style={[styles.toast, { backgroundColor: bg, opacity }]}>
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

export const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
  }, []);
  const removeToast = useCallback((id) => {
    setToasts(p => p.filter(t => t.id !== id));
  }, []);
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View style={styles.toastContainer} pointerEvents="none">
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onHide={() => removeToast(t.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

export function ConfirmModal({ visible, title, message, onConfirm, onCancel, confirmText = "დადასტურება", cancelText = "გაუქმება", danger }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.confirmBox}>
          {title ? <Text style={styles.confirmTitle}>{title}</Text> : null}
          {message ? <Text style={styles.confirmMsg}>{message}</Text> : null}
          <View style={styles.confirmBtns}>
            <Btn title={cancelText} onPress={onCancel} outline color={C.muted} style={{ flex: 1 }} />
            <View style={{ width: 10 }} />
            <Btn title={confirmText} onPress={onConfirm} color={danger ? C.danger : C.green} textColor={C.white} style={{ flex: 1 }} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  btn: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  btnText: { fontSize: 15, fontWeight: "700" },
  card: { backgroundColor: C.navyLight, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  inputWrap: { marginBottom: 14 },
  inputLabel: { color: C.muted, fontSize: 12, marginBottom: 6, fontWeight: "600" },
  input: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: C.text, fontSize: 15 },
  spinnerWrap: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 100 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: "flex-start" },
  badgeText: { fontSize: 11, fontWeight: "700" },
  toast: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, marginBottom: 8, maxWidth: 320, alignSelf: "center" },
  toastText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  toastContainer: { position: "absolute", bottom: 90, left: 0, right: 0, alignItems: "center", zIndex: 9999 },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 12 },
  section: { marginBottom: 16 },
  sectionTitle: { color: C.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", padding: 24 },
  confirmBox: { backgroundColor: C.navyLight, borderRadius: 16, padding: 24, width: "100%", maxWidth: 360, borderWidth: 1, borderColor: C.border },
  confirmTitle: { color: C.text, fontSize: 18, fontWeight: "700", marginBottom: 8 },
  confirmMsg: { color: C.muted, fontSize: 14, marginBottom: 20, lineHeight: 20 },
  confirmBtns: { flexDirection: "row" },
});
