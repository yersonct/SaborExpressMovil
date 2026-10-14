import { StyleSheet } from "react-native";

export const darkTheme = {
  bgMain: "#0d0e12",
  bgCard: "#15181e",
  bgHeader: "#1a1e24",
  textMain: "#f1f5f9",
  textMuted: "#94a3b8",
  border: "#22252a",
  borderLight: "#262a30",
};

export const lightTheme = {
  bgMain: "#f0f2f5",
  bgCard: "#ffffff",
  bgHeader: "#f8fafc",
  textMain: "#0f172a",
  textMuted: "#475569",
  border: "#e2e8f0",
  borderLight: "#cbd5e1",
};

export const boardStyles = StyleSheet.create({
  board: { flex: 1, flexDirection: "row", padding: 12, gap: 12 },
  column: { flex: 1, borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  columnHeader: {
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 1,
  },
  columnTitle: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  columnBody: { flex: 1, padding: 8, gap: 8 },
  emptyColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.4,
  },
});

export const chefStyles = StyleSheet.create({
  wrapper: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  mesero: { fontSize: 12 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoCirculo: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22c55e",
  },
  brandText: { fontSize: 17, fontWeight: "700" },
  roleBadge: { fontSize: 12, fontWeight: "600", opacity: 0.7 },
  headerControls: { flexDirection: "row", alignItems: "center", gap: 10 },
  themeToggle: {
    flexDirection: "row",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
  },
  themeOption: { paddingHorizontal: 10, paddingVertical: 6 },
  themeOptionActive: { backgroundColor: "rgba(148,163,184,0.2)" },
  listContent: { padding: 12, gap: 12 },

  card: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  mesaBadge: { fontSize: 16, fontWeight: "700" },
  infoValor: { fontSize: 13, fontWeight: "600" },

  estadoBadge: {
    alignSelf: "flex-start",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
    overflow: "hidden",
  },
  tagTiempo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "rgba(59,130,246,0.15)",
    marginBottom: 8,
  },

  menuList: { gap: 10 },
  menuItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemDivider: { height: 1, marginTop: 10 },
  itemNombreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  cantidad: { fontWeight: "700", fontSize: 15 },
  platillo: { fontSize: 15, flexShrink: 1 },
  togoTag: {
    fontSize: 11,
    fontWeight: "600",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  nota: {
    fontSize: 12,
    opacity: 0.7,
    fontStyle: "italic",
    marginTop: 2,
    marginLeft: 21,
  },

  totalesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  btnAccion: {
    marginTop: 10,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#3b82f6",
  },
  btnAccionText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  sidebar: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  metricBox: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
  },
  metricLabel: { fontSize: 11, opacity: 0.7, marginBottom: 4 },
  metricValue: { fontSize: 20, fontWeight: "700" },
});
