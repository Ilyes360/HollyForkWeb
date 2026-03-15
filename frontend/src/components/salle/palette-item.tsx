import { useRef, useCallback } from "react"
import type { FloorElementPreset } from "./types"
import { TABLE_TYPE_LABELS } from "./constants"

interface PaletteItemProps {
  preset: FloorElementPreset
  label: string
}

function getPreview(preset: FloorElementPreset) {
  if (preset.kind === "table") {
    const { type, width, height } = preset
    if (type === "round") {
      const r = Math.min(width, 40) / 2
      return (
        <svg width={40} height={40} viewBox="0 0 40 40">
          <circle cx={20} cy={20} r={r} className="fill-muted stroke-border" strokeWidth={1.5} />
        </svg>
      )
    }
    const w = Math.min(width, 40)
    const h = Math.min(height, 40)
    return (
      <svg width={40} height={40} viewBox="0 0 40 40">
        <rect
          x={(40 - w) / 2}
          y={(40 - h) / 2}
          width={w}
          height={h}
          rx={type === "bar" ? 2 : 4}
          className="fill-muted stroke-border"
          strokeWidth={1.5}
        />
      </svg>
    )
  }
  if (preset.kind === "wall") {
    return (
      <svg width={40} height={40} viewBox="0 0 40 40">
        <line x1={4} y1={20} x2={36} y2={20} className="stroke-muted-foreground" strokeWidth={4} strokeLinecap="round" />
      </svg>
    )
  }
  if (preset.kind === "decoration") {
    if (preset.shapeType === "circle" && preset.radius != null) {
      const r = Math.min(preset.radius, 18)
      return (
        <svg width={40} height={40} viewBox="0 0 40 40">
          <circle cx={20} cy={20} r={r} className="fill-muted stroke-border" strokeWidth={1.5} />
        </svg>
      )
    }
    if (preset.shapeType === "rect" && preset.width != null && preset.height != null) {
      const scale = Math.min(36 / preset.width, 36 / preset.height, 1)
      const w = preset.width * scale
      const h = preset.height * scale
      return (
        <svg width={40} height={40} viewBox="0 0 40 40">
          <rect x={(40 - w) / 2} y={(40 - h) / 2} width={w} height={h} rx={2}
            className="fill-muted stroke-border" strokeWidth={1.5} />
        </svg>
      )
    }
    if (preset.shapeType === "line" && preset.points) {
      const pts = preset.points
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (let i = 0; i < pts.length; i += 2) {
        minX = Math.min(minX, pts[i])
        minY = Math.min(minY, pts[i + 1])
        maxX = Math.max(maxX, pts[i])
        maxY = Math.max(maxY, pts[i + 1])
      }
      const pw = maxX - minX || 1
      const ph = maxY - minY || 1
      const scale = Math.min(32 / pw, 32 / ph, 1)
      const ox = (40 - pw * scale) / 2
      const oy = (40 - ph * scale) / 2
      const pointStr = []
      for (let i = 0; i < pts.length; i += 2) {
        pointStr.push(`${ox + (pts[i] - minX) * scale},${oy + (pts[i + 1] - minY) * scale}`)
      }
      return (
        <svg width={40} height={40} viewBox="0 0 40 40">
          <polyline points={pointStr.join(" ")} className="stroke-muted-foreground" fill="none"
            strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    }
  }
  return (
    <svg width={40} height={40} viewBox="0 0 40 40">
      <rect x={4} y={4} width={32} height={32} rx={2} className="fill-primary/10 stroke-primary" strokeWidth={1.5} strokeDasharray="4 2" />
    </svg>
  )
}

function getDescription(preset: FloorElementPreset) {
  if (preset.kind === "table") {
    return `${TABLE_TYPE_LABELS[preset.type]} — ${preset.seats} places`
  }
  if (preset.kind === "wall") return "Mur droit"
  if (preset.kind === "decoration") {
    if (preset.shapeType === "circle" && preset.radius != null) return `Ø${preset.radius * 2}`
    if (preset.shapeType === "rect" && preset.width != null && preset.height != null) return `${preset.width}×${preset.height}`
    if (preset.shapeType === "line" && preset.points) {
      let len = 0
      for (let i = 2; i < preset.points.length; i += 2) {
        const dx = preset.points[i] - preset.points[i - 2]
        const dy = preset.points[i + 1] - preset.points[i - 1]
        len += Math.sqrt(dx * dx + dy * dy)
      }
      return `${Math.round(len)} cm`
    }
    return ""
  }
  return "Zone rectangulaire"
}

/** Create an offscreen canvas with the shape drawn at real size for drag image */
function createDragImage(preset: FloorElementPreset): { element: HTMLCanvasElement; offsetX: number; offsetY: number } {
  if (preset.kind === "decoration") {
    return createDecorationDragImage(preset)
  }
  if (preset.kind !== "table") {
    const c = document.createElement("canvas")
    c.width = 4
    c.height = 4
    return { element: c, offsetX: 2, offsetY: 2 }
  }

  const { type, width, height } = preset
  const pad = 4
  const w = width + pad * 2
  const h = height + pad * 2
  const canvas = document.createElement("canvas")
  const dpr = window.devicePixelRatio || 1
  canvas.width = w * dpr
  canvas.height = h * dpr
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`

  const ctx = canvas.getContext("2d")
  if (!ctx) return { element: canvas, offsetX: w / 2, offsetY: h / 2 }

  ctx.scale(dpr, dpr)

  // Style
  const isDark = document.documentElement.classList.contains("dark")
  ctx.fillStyle = isDark ? "#1a2332" : "#f8fafc"
  ctx.strokeStyle = isDark ? "#334155" : "#cbd5e1"
  ctx.lineWidth = 1.5

  // Shadow
  ctx.shadowColor = isDark ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.08)"
  ctx.shadowBlur = 6
  ctx.shadowOffsetY = 2

  if (type === "round") {
    const r = width / 2
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  } else {
    const rx = type === "bar" ? 4 : 8
    const x = pad
    const y = pad
    ctx.beginPath()
    ctx.moveTo(x + rx, y)
    ctx.lineTo(x + width - rx, y)
    ctx.arcTo(x + width, y, x + width, y + rx, rx)
    ctx.lineTo(x + width, y + height - rx)
    ctx.arcTo(x + width, y + height, x + width - rx, y + height, rx)
    ctx.lineTo(x + rx, y + height)
    ctx.arcTo(x, y + height, x, y + height - rx, rx)
    ctx.lineTo(x, y + rx)
    ctx.arcTo(x, y, x + rx, y, rx)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }

  return { element: canvas, offsetX: w / 2, offsetY: h / 2 }
}

function createDecorationDragImage(preset: FloorElementPreset & { kind: "decoration" }): { element: HTMLCanvasElement; offsetX: number; offsetY: number } {
  const isDark = document.documentElement.classList.contains("dark")
  const fill = isDark ? "#1e293b" : "#f1f5f9"
  const stroke = isDark ? "#475569" : "#94a3b8"
  const dpr = window.devicePixelRatio || 1
  const pad = 4

  if (preset.shapeType === "circle" && preset.radius != null) {
    const r = preset.radius
    const size = (r * 2 + pad * 2)
    const canvas = document.createElement("canvas")
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.scale(dpr, dpr)
      ctx.fillStyle = fill
      ctx.strokeStyle = stroke
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
    return { element: canvas, offsetX: size / 2, offsetY: size / 2 }
  }

  if (preset.shapeType === "rect" && preset.width != null && preset.height != null) {
    const w = preset.width + pad * 2
    const h = preset.height + pad * 2
    const canvas = document.createElement("canvas")
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.scale(dpr, dpr)
      ctx.fillStyle = fill
      ctx.strokeStyle = stroke
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.roundRect(pad, pad, preset.width, preset.height, 2)
      ctx.fill()
      ctx.stroke()
    }
    return { element: canvas, offsetX: w / 2, offsetY: h / 2 }
  }

  if (preset.shapeType === "line" && preset.points) {
    const pts = preset.points
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (let i = 0; i < pts.length; i += 2) {
      minX = Math.min(minX, pts[i])
      minY = Math.min(minY, pts[i + 1])
      maxX = Math.max(maxX, pts[i])
      maxY = Math.max(maxY, pts[i + 1])
    }
    const w = maxX - minX + pad * 2 + (preset.thickness ?? 4)
    const h = maxY - minY + pad * 2 + (preset.thickness ?? 4)
    const canvas = document.createElement("canvas")
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.scale(dpr, dpr)
      ctx.strokeStyle = stroke
      ctx.lineWidth = preset.thickness ?? 4
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.beginPath()
      const offX = pad + (preset.thickness ?? 4) / 2 - minX
      const offY = pad + (preset.thickness ?? 4) / 2 - minY
      ctx.moveTo(pts[0] + offX, pts[1] + offY)
      for (let i = 2; i < pts.length; i += 2) {
        ctx.lineTo(pts[i] + offX, pts[i + 1] + offY)
      }
      ctx.stroke()
    }
    return { element: canvas, offsetX: w / 2, offsetY: h / 2 }
  }

  const c = document.createElement("canvas")
  c.width = 4
  c.height = 4
  return { element: c, offsetX: 2, offsetY: 2 }
}

export function PaletteItem({ preset, label }: PaletteItemProps) {
  const dragImageRef = useRef<{ element: HTMLCanvasElement; offsetX: number; offsetY: number } | null>(null)

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData("application/salle-element", JSON.stringify(preset))
    e.dataTransfer.effectAllowed = "copy"

    // Create and set custom drag image (shape only)
    const img = createDragImage(preset)
    dragImageRef.current = img
    // Must append to DOM briefly for setDragImage to work in some browsers
    img.element.style.position = "fixed"
    img.element.style.top = "-9999px"
    img.element.style.left = "-9999px"
    document.body.appendChild(img.element)
    e.dataTransfer.setDragImage(img.element, img.offsetX, img.offsetY)

    // Clean up after a tick
    requestAnimationFrame(() => {
      if (img.element.parentNode) {
        document.body.removeChild(img.element)
      }
    })
  }, [preset])

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="flex cursor-grab items-center gap-3 rounded-md border bg-background p-2 transition-colors hover:bg-accent active:cursor-grabbing"
    >
      <div className="flex size-10 shrink-0 items-center justify-center">
        {getPreview(preset)}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium">{label}</p>
        <p className="text-[10px] text-muted-foreground">{getDescription(preset)}</p>
      </div>
    </div>
  )
}
