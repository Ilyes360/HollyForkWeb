import type { CanvasColors } from "./theme"
import type { DecorationShape, DecorationType } from "./types"

export interface DecorationDetail {
  type: "line" | "circle" | "rect" | "text"
  x?: number
  y?: number
  points?: number[]
  radius?: number
  width?: number
  height?: number
  text?: string
  fontSize?: number
  fill?: string
  stroke?: string
  strokeWidth?: number
  dash?: number[]
  cornerRadius?: number
  align?: string
}

export interface DecorationRenderConfig {
  fill?: string
  stroke?: string
  strokeWidth?: number
  dash?: number[]
  lineCap?: "round" | "butt" | "square"
  cornerRadius?: number
  opacity?: number
  shadowBlur?: number
  shadowOpacity?: number
  details: DecorationDetail[]
}

type ConfigFn = (el: DecorationShape, c: CanvasColors) => DecorationRenderConfig

const base = (c: CanvasColors): DecorationRenderConfig => ({
  fill: c.decorationFill,
  stroke: c.decorationStroke,
  strokeWidth: 1,
  cornerRadius: 2,
  shadowBlur: 4,
  shadowOpacity: 0.08,
  details: [],
})

const renderers: Partial<Record<DecorationType, ConfigFn>> = {
  // ── Structure ──
  "column-round": (_el, c) => ({
    ...base(c),
    details: [
      { type: "line", points: [-6, 0, 6, 0], stroke: c.decorationStroke, strokeWidth: 1 },
      { type: "line", points: [0, -6, 0, 6], stroke: c.decorationStroke, strokeWidth: 1 },
    ],
  }),
  "column-square": (_el, c) => ({
    ...base(c),
    details: [
      { type: "line", points: [-10, -10, 10, 10], stroke: c.decorationStroke, strokeWidth: 0.8 },
      { type: "line", points: [10, -10, -10, 10], stroke: c.decorationStroke, strokeWidth: 0.8 },
    ],
  }),
  "stairs": (el, c) => {
    const w = el.width ?? 100
    const h = el.height ?? 60
    const steps = Math.floor(h / 12)
    const details: DecorationDetail[] = []
    for (let i = 1; i < steps; i++) {
      const y = -h / 2 + (h / steps) * i
      details.push({ type: "line", points: [-w / 2 + 2, y, w / 2 - 2, y], stroke: c.decorationStroke, strokeWidth: 0.8 })
    }
    return { ...base(c), cornerRadius: 1, details }
  },
  "ramp": (el, c) => {
    const w = el.width ?? 120
    const h = el.height ?? 40
    return {
      ...base(c),
      cornerRadius: 1,
      details: [
        { type: "line", points: [-w / 2 + 4, h / 2 - 4, w / 2 - 4, -h / 2 + 4], stroke: c.decorationStroke, strokeWidth: 1 },
        { type: "line", points: [w / 2 - 10, -h / 2 + 2, w / 2 - 4, -h / 2 + 4, w / 2 - 4, -h / 2 + 12], stroke: c.decorationStroke, strokeWidth: 1 },
      ],
    }
  },

  // ── Service furniture ──
  "hostess-stand": (el, c) => {
    const w = el.width ?? 60
    const h = el.height ?? 40
    return {
      ...base(c),
      cornerRadius: 4,
      details: [
        { type: "rect", x: -w * 0.25, y: -h * 0.2, width: w * 0.5, height: h * 0.35, fill: c.decorationStroke, cornerRadius: 2 },
      ],
    }
  },
  "server-station": (el, c) => {
    const w = el.width ?? 80
    const h = el.height ?? 50
    return {
      ...base(c),
      cornerRadius: 4,
      details: [
        { type: "line", points: [-w / 2 + 4, -h / 6, w / 2 - 4, -h / 6], stroke: c.decorationStroke, strokeWidth: 0.8 },
        { type: "line", points: [-w / 2 + 4, h / 6, w / 2 - 4, h / 6], stroke: c.decorationStroke, strokeWidth: 0.8 },
      ],
    }
  },
  "pos-terminal": (el, c) => {
    const w = el.width ?? 40
    const h = el.height ?? 30
    return {
      ...base(c),
      cornerRadius: 3,
      details: [
        { type: "rect", x: -w * 0.35, y: -h * 0.35, width: w * 0.7, height: h * 0.45, stroke: c.decorationStroke, cornerRadius: 1 },
      ],
    }
  },

  // ── Fixed seating ──
  "banquette-straight": (_el, c) => ({
    ...base(c),
    fill: c.decorationFill,
    stroke: c.decorationStroke,
    strokeWidth: 1.5,
    lineCap: "round",
    details: [],
  }),
  "banquette-l": (_el, c) => ({
    ...base(c),
    stroke: c.decorationStroke,
    strokeWidth: 1.5,
    lineCap: "round",
    details: [],
  }),
  "banquette-u": (_el, c) => ({
    ...base(c),
    stroke: c.decorationStroke,
    strokeWidth: 1.5,
    lineCap: "round",
    details: [],
  }),
  "bar-stool": (el, c) => {
    const r = el.radius ?? 15
    return {
      ...base(c),
      details: [
        { type: "circle", x: 0, y: 0, radius: r * 0.6, stroke: c.decorationStroke, strokeWidth: 0.8 },
      ],
    }
  },

  // ── Partitions ──
  "partition-solid": (_el, c) => ({
    ...base(c),
    stroke: c.wallStroke,
    lineCap: "square",
    details: [],
  }),
  "partition-glass": (_el, c) => ({
    ...base(c),
    stroke: "#93c5fd",
    dash: [8, 4],
    lineCap: "square",
    details: [],
  }),
  "partition-lattice": (_el, c) => ({
    ...base(c),
    stroke: c.decorationStroke,
    dash: [4, 4],
    lineCap: "square",
    details: [],
  }),
  "rope-barrier": (el, c) => {
    const pts = el.points ?? [0, 0, 100, 0]
    const x1 = pts[0], y1 = pts[1]
    const x2 = pts[pts.length - 2], y2 = pts[pts.length - 1]
    return {
      ...base(c),
      stroke: c.decorationStroke,
      strokeWidth: 2,
      dash: [6, 4],
      details: [
        { type: "circle", x: x1, y: y1, radius: 4, fill: c.decorationFill, stroke: c.decorationStroke, strokeWidth: 1.5 },
        { type: "circle", x: x2, y: y2, radius: 4, fill: c.decorationFill, stroke: c.decorationStroke, strokeWidth: 1.5 },
      ],
    }
  },

  // ── Counters ──
  "bar-counter-straight": (_el, c) => ({
    ...base(c),
    fill: c.decorationFill,
    stroke: c.decorationStroke,
    strokeWidth: 1.5,
    lineCap: "butt",
    details: [],
  }),
  "bar-counter-l": (_el, c) => ({
    ...base(c),
    stroke: c.decorationStroke,
    strokeWidth: 1.5,
    lineCap: "butt",
    details: [],
  }),
  "bar-counter-curved": (el, c) => ({
    ...base(c),
    cornerRadius: (el.height ?? 60) / 2,
    details: [],
  }),

  // ── Signage ──
  "sign-restroom-m": (el, _c) => ({
    fill: "#3b82f6",
    stroke: "#2563eb",
    strokeWidth: 1,
    cornerRadius: 3,
    details: [
      { type: "text", x: -(el.width ?? 24) / 2, y: -7, text: "H", fontSize: 12, fill: "#ffffff", width: el.width ?? 24, align: "center" },
    ],
  }),
  "sign-restroom-f": (el, _c) => ({
    fill: "#ec4899",
    stroke: "#db2777",
    strokeWidth: 1,
    cornerRadius: 3,
    details: [
      { type: "text", x: -(el.width ?? 24) / 2, y: -7, text: "F", fontSize: 12, fill: "#ffffff", width: el.width ?? 24, align: "center" },
    ],
  }),
  "sign-restroom-pmr": (el, _c) => ({
    fill: "#3b82f6",
    stroke: "#2563eb",
    strokeWidth: 1,
    cornerRadius: 3,
    details: [
      { type: "text", x: -(el.width ?? 24) / 2, y: -7, text: "♿", fontSize: 11, fill: "#ffffff", width: el.width ?? 24, align: "center" },
    ],
  }),
  "sign-emergency-exit": (el, _c) => ({
    fill: "#22c55e",
    stroke: "#16a34a",
    strokeWidth: 1,
    cornerRadius: 2,
    details: [
      { type: "text", x: -(el.width ?? 30) / 2, y: -6, text: "↗", fontSize: 11, fill: "#ffffff", width: el.width ?? 30, align: "center" },
    ],
  }),

  // ── Plants ──
  "plant-pot-s": (_el, c) => ({
    fill: c.plantFill,
    stroke: c.plantStroke,
    strokeWidth: 1.5,
    details: [],
  }),
  "plant-pot-m": (_el, c) => ({
    fill: c.plantFill,
    stroke: c.plantStroke,
    strokeWidth: 1.5,
    details: [],
  }),
  "plant-pot-l": (_el, c) => ({
    fill: c.plantFill,
    stroke: c.plantStroke,
    strokeWidth: 1.5,
    details: [],
  }),
  "planter-rect": (_el, c) => ({
    fill: c.plantFill,
    stroke: c.plantStroke,
    strokeWidth: 1.5,
    cornerRadius: 3,
    details: [],
  }),
  "plant-hanging": (el, c) => ({
    fill: c.plantFill,
    stroke: c.plantStroke,
    strokeWidth: 1.5,
    opacity: 0.7,
    details: [
      { type: "line", points: [0, -(el.radius ?? 15), 0, -(el.radius ?? 15) - 8], stroke: c.plantStroke, strokeWidth: 1 },
    ],
  }),

  // ── Kitchen/service ──
  "service-window": (el, c) => {
    const w = el.width ?? 80
    return {
      ...base(c),
      dash: [6, 3],
      cornerRadius: 1,
      details: [
        { type: "line", points: [-w / 4, 0, -w / 4 + 8, -4], stroke: c.decorationStroke, strokeWidth: 1 },
        { type: "line", points: [w / 4, 0, w / 4 - 8, -4], stroke: c.decorationStroke, strokeWidth: 1 },
      ],
    }
  },
  "buffet": (el, c) => {
    const w = el.width ?? 160
    const h = el.height ?? 60
    return {
      ...base(c),
      cornerRadius: 3,
      details: [
        { type: "line", points: [-w / 6, -h / 2 + 4, -w / 6, h / 2 - 4], stroke: c.decorationStroke, strokeWidth: 0.8 },
        { type: "line", points: [w / 6, -h / 2 + 4, w / 6, h / 2 - 4], stroke: c.decorationStroke, strokeWidth: 0.8 },
      ],
    }
  },
  "coffee-station": (_el, c) => ({
    ...base(c),
    cornerRadius: 3,
    details: [
      { type: "circle", x: 0, y: 0, radius: 6, stroke: c.decorationStroke, strokeWidth: 0.8 },
    ],
  }),
  "dessert-display": (el, c) => {
    const w = el.width ?? 80
    const h = el.height ?? 50
    return {
      ...base(c),
      cornerRadius: 3,
      details: [
        { type: "rect", x: -w * 0.3, y: -h * 0.3, width: w * 0.6, height: h * 0.5, stroke: c.decorationStroke, cornerRadius: (w * 0.6) / 2 },
      ],
    }
  },
  "wine-rack": (el, c) => {
    const details: DecorationDetail[] = []
    const cols = 2
    const rows = 3
    const w = el.width ?? 60
    const h = el.height ?? 100
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        details.push({
          type: "circle",
          x: -w / 4 + col * (w / 2),
          y: -h / 3 + r * (h / 3),
          radius: 5,
          stroke: c.decorationStroke,
          strokeWidth: 0.8,
        })
      }
    }
    return { ...base(c), cornerRadius: 2, details }
  },

  // ── Terrace ──
  "parasol": (el, c) => {
    const r = el.radius ?? 60
    return {
      fill: c.decorationFill,
      stroke: c.decorationStroke,
      strokeWidth: 1,
      opacity: 0.4,
      details: [
        { type: "line", points: [-r, 0, r, 0], stroke: c.decorationStroke, strokeWidth: 0.5 },
        { type: "line", points: [0, -r, 0, r], stroke: c.decorationStroke, strokeWidth: 0.5 },
        { type: "circle", x: 0, y: 0, radius: 3, fill: c.decorationStroke },
      ],
    }
  },
  "patio-heater": (_el, c) => ({
    ...base(c),
    fill: "#f97316",
    stroke: "#ea580c",
    details: [
      { type: "line", points: [-5, 0, 5, 0], stroke: "#ffffff", strokeWidth: 1.5 },
      { type: "line", points: [0, -5, 0, 5], stroke: "#ffffff", strokeWidth: 1.5 },
    ],
  }),
  "windscreen": (_el, c) => ({
    ...base(c),
    stroke: "#93c5fd",
    dash: [10, 5],
    lineCap: "square",
    details: [],
  }),
  "terrace-planter": (_el, c) => ({
    fill: c.plantFill,
    stroke: c.plantStroke,
    strokeWidth: 1.5,
    cornerRadius: 3,
    details: [],
  }),

  // ── Safety ──
  "fire-extinguisher": (el, _c) => ({
    fill: "#ef4444",
    stroke: "#dc2626",
    strokeWidth: 1,
    cornerRadius: 2,
    details: [
      { type: "text", x: -(el.width ?? 16) / 2, y: -5, text: "E", fontSize: 9, fill: "#ffffff", width: el.width ?? 16, align: "center" },
    ],
  }),
  "emergency-exit-sign": (el, _c) => ({
    fill: "#22c55e",
    stroke: "#16a34a",
    strokeWidth: 1,
    cornerRadius: 2,
    details: [
      { type: "text", x: -(el.width ?? 30) / 2, y: -6, text: "↗", fontSize: 11, fill: "#ffffff", width: el.width ?? 30, align: "center" },
    ],
  }),
  "smoke-detector": (_el, c) => ({
    ...base(c),
    details: [
      { type: "circle", x: 0, y: 0, radius: 3, fill: c.decorationStroke },
    ],
  }),

  // ── Comfort ──
  "fireplace": (el, c) => {
    const w = el.width ?? 100
    const h = el.height ?? 40
    return {
      ...base(c),
      cornerRadius: 2,
      details: [
        { type: "rect", x: -w * 0.35, y: -h * 0.1, width: w * 0.7, height: h * 0.45, fill: "#451a03", cornerRadius: w * 0.35 },
      ],
    }
  },
  "coat-rack": (el, c) => {
    const w = el.width ?? 60
    const details: DecorationDetail[] = []
    const hooks = 4
    for (let i = 0; i < hooks; i++) {
      details.push({
        type: "circle",
        x: -w / 2 + w / (hooks + 1) * (i + 1),
        y: -4,
        radius: 3,
        stroke: c.decorationStroke,
        strokeWidth: 0.8,
      })
    }
    return { ...base(c), cornerRadius: 3, details }
  },
  "umbrella-stand": (_el, c) => ({
    ...base(c),
    details: [
      { type: "line", points: [-4, 4, 0, -4], stroke: c.decorationStroke, strokeWidth: 1 },
      { type: "line", points: [4, 4, 0, -4], stroke: c.decorationStroke, strokeWidth: 1 },
    ],
  }),
}

export function getDecorationRenderConfig(
  el: DecorationShape,
  colors: CanvasColors
): DecorationRenderConfig {
  const fn = renderers[el.decorationType]
  if (fn) return fn(el, colors)
  return base(colors)
}
