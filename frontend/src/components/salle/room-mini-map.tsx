import type { FloorElement } from "./types"

function computeBounds(elements: FloorElement[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const el of elements) {
    if (el.kind === "table") {
      minX = Math.min(minX, el.x - el.width / 2)
      minY = Math.min(minY, el.y - el.height / 2)
      maxX = Math.max(maxX, el.x + el.width / 2)
      maxY = Math.max(maxY, el.y + el.height / 2)
    } else if (el.kind === "wall") {
      for (let i = 0; i < el.points.length; i += 2) {
        minX = Math.min(minX, el.x + el.points[i])
        minY = Math.min(minY, el.y + el.points[i + 1])
        maxX = Math.max(maxX, el.x + el.points[i])
        maxY = Math.max(maxY, el.y + el.points[i + 1])
      }
    } else if (el.kind === "zone") {
      for (let i = 0; i < el.points.length; i += 2) {
        minX = Math.min(minX, el.x + el.points[i])
        minY = Math.min(minY, el.y + el.points[i + 1])
        maxX = Math.max(maxX, el.x + el.points[i])
        maxY = Math.max(maxY, el.y + el.points[i + 1])
      }
    } else if (el.kind === "decoration") {
      if (el.shapeType === "circle" && el.radius != null) {
        minX = Math.min(minX, el.x - el.radius)
        minY = Math.min(minY, el.y - el.radius)
        maxX = Math.max(maxX, el.x + el.radius)
        maxY = Math.max(maxY, el.y + el.radius)
      } else if (el.shapeType === "rect" && el.width != null && el.height != null) {
        minX = Math.min(minX, el.x - el.width / 2)
        minY = Math.min(minY, el.y - el.height / 2)
        maxX = Math.max(maxX, el.x + el.width / 2)
        maxY = Math.max(maxY, el.y + el.height / 2)
      }
    }
  }
  if (minX === Infinity) return null
  return { minX, minY, maxX, maxY }
}

interface RoomMiniMapProps {
  elements: FloorElement[]
}

export function RoomMiniMap({ elements }: RoomMiniMapProps) {
  const bounds = computeBounds(elements)
  if (!bounds) return null

  const pad = 16
  const vbX = bounds.minX - pad
  const vbY = bounds.minY - pad
  const vbW = bounds.maxX - bounds.minX + pad * 2
  const vbH = bounds.maxY - bounds.minY + pad * 2

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted/30">
      <svg
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {elements.map((el) => {
          if (el.kind === "zone") {
            const pts = []
            for (let i = 0; i < el.points.length; i += 2) {
              pts.push(`${el.x + el.points[i]},${el.y + el.points[i + 1]}`)
            }
            return (
              <polygon
                key={el.id}
                points={pts.join(" ")}
                fill={el.color}
                fillOpacity={0.12}
                stroke={el.color}
                strokeWidth={1}
                strokeOpacity={0.3}
              />
            )
          }

          if (el.kind === "wall") {
            const [x1, y1, x2, y2] = el.points
            return (
              <line
                key={el.id}
                x1={el.x + x1}
                y1={el.y + y1}
                x2={el.x + x2}
                y2={el.y + y2}
                className="stroke-muted-foreground/40"
                strokeWidth={Math.max(el.thickness * 0.6, 2)}
                strokeLinecap="round"
              />
            )
          }

          if (el.kind === "table") {
            const isRound = el.type === "round"
            return (
              <g key={el.id}>
                {isRound ? (
                  <circle
                    cx={el.x}
                    cy={el.y}
                    r={el.width / 2}
                    className="fill-muted-foreground/15 stroke-muted-foreground/50"
                    strokeWidth={1}
                  />
                ) : (
                  <rect
                    x={el.x - el.width / 2}
                    y={el.y - el.height / 2}
                    width={el.width}
                    height={el.height}
                    rx={el.type === "bar" ? 4 : 2}
                    className="fill-muted-foreground/15 stroke-muted-foreground/50"
                    strokeWidth={1}
                  />
                )}
                <text
                  x={el.x}
                  y={el.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-muted-foreground"
                  fontSize={Math.min(el.width, el.height) * 0.28}
                  fontWeight={600}
                >
                  {el.label}
                </text>
              </g>
            )
          }

          if (el.kind === "decoration") {
            if (el.shapeType === "circle" && el.radius != null) {
              return (
                <circle
                  key={el.id}
                  cx={el.x}
                  cy={el.y}
                  r={el.radius}
                  className="fill-muted-foreground/10 stroke-muted-foreground/30"
                  strokeWidth={1}
                />
              )
            }
            if (el.shapeType === "rect" && el.width != null && el.height != null) {
              return (
                <rect
                  key={el.id}
                  x={el.x - el.width / 2}
                  y={el.y - el.height / 2}
                  width={el.width}
                  height={el.height}
                  rx={2}
                  className="fill-muted-foreground/10 stroke-muted-foreground/30"
                  strokeWidth={1}
                />
              )
            }
          }

          return null
        })}
      </svg>
    </div>
  )
}
