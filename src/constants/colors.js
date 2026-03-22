// src/constants/colors.js — SafePay ფერები (იგივე ვებ ვერსიის C ობიექტი)
export const C = {
  navy:      "#0A1628",
  navyLight: "#0D2240",
  green:     "#1DB954",
  greenDark: "#17a349",
  text:      "#E8F0FE",
  muted:     "#6B7280",
  border:    "#1E3A5F",
  bg:        "#0D1F35",
  surface:   "#0F2540",
  white:     "#FFFFFF",
  danger:    "#EF4444",
  warning:   "#F59E0B",
  info:      "#3B82F6",
  infoLight: "#1E3A5F",
};

export const fmt = (n) => {
  const num = parseFloat(n) || 0;
  return num.toLocaleString("ka-GE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const STATUS_COLORS = {
  pending:                    { bg: "#1E3A5F", text: "#6B7280",  label: "⏳ მოლოდინში" },
  awaiting_payment:           { bg: "#2D2200", text: "#F59E0B",  label: "💳 გადახდის მოლოდინი" },
  held:                       { bg: "#0A2D1A", text: "#1DB954",  label: "🔒 გაყინული" },
  shipped:                    { bg: "#0D2240", text: "#3B82F6",  label: "🚚 გაგზავნილი" },
  confirmed:                  { bg: "#0A2D1A", text: "#1DB954",  label: "✅ დასრულებული" },
  dispute:                    { bg: "#2D0A0A", text: "#EF4444",  label: "⚖️ დავა" },
  cancelled:                  { bg: "#1E1E1E", text: "#6B7280",  label: "❌ გაუქმებული" },
  dispute_resolved_pending:   { bg: "#2D2200", text: "#F59E0B",  label: "⏳ დავა გადაწყდა" },
  refunded:                   { bg: "#0D2240", text: "#3B82F6",  label: "↩️ დაბრუნებული" },
};
