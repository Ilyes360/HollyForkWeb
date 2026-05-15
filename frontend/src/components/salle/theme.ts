/**
 * Resolves CSS custom-property values at runtime so Konva shapes
 * can use the same design tokens as the rest of the app.
 *
 * Call `getCanvasColors()` inside a component (after mount) to get
 * hex/rgb values derived from the current :root / .dark variables.
 */

export interface CanvasColors {
  tableFill: string
  tableStroke: string
  tableShadow: string
  tableText: string
  tableTextSecondary: string
  wallStroke: string
  gridDot: string
  gridStroke: string
  background: string
  zoneLabelColor: string
  // Decoration colors
  decorationFill: string
  decorationStroke: string
  decorationText: string
  plantFill: string
  plantStroke: string
  // Status colors
  statusAvailable: string
  statusOccupied: string
  statusReserved: string
  statusBlocked: string
}

const LIGHT_COLORS: CanvasColors = {
  tableFill: "#f8fafc",
  tableStroke: "#cbd5e1",
  tableShadow: "rgba(0,0,0,0.06)",
  tableText: "#1e293b",
  tableTextSecondary: "#94a3b8",
  wallStroke: "#475569",
  gridDot: "#d1d5db",
  gridStroke: "#d1d5db",
  background: "#ffffff",
  zoneLabelColor: "#475569",
  decorationFill: "#f1f5f9",
  decorationStroke: "#94a3b8",
  decorationText: "#475569",
  plantFill: "#bbf7d0",
  plantStroke: "#16a34a",
  statusAvailable: "#f1f5f9",
  statusOccupied: "#dcfce7",
  statusReserved: "#fff7ed",
  statusBlocked: "#f1f5f9",
}

const DARK_COLORS: CanvasColors = {
  tableFill: "#1a2332",
  tableStroke: "#334155",
  tableShadow: "rgba(0,0,0,0.25)",
  tableText: "#e2e8f0",
  tableTextSecondary: "#64748b",
  wallStroke: "#64748b",
  gridDot: "#1e293b",
  gridStroke: "#1e293b",
  background: "#0c1322",
  zoneLabelColor: "#64748b",
  decorationFill: "#1e293b",
  decorationStroke: "#475569",
  decorationText: "#94a3b8",
  plantFill: "#166534",
  plantStroke: "#22c55e",
  statusAvailable: "#1e293b",
  statusOccupied: "#052e16",
  statusReserved: "#431407",
  statusBlocked: "#1e293b",
}

export function getCanvasColors(): CanvasColors {
  if (typeof document === "undefined") return LIGHT_COLORS
  const isDark = document.documentElement.classList.contains("dark")
  return isDark ? DARK_COLORS : LIGHT_COLORS
}

export function useCanvasColors(): CanvasColors {
  // Simple sync read — sufficient for canvas redraws on theme change
  return getCanvasColors()
}
