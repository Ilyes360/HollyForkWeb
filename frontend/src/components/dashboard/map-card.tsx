import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Map, { Marker, Source, Layer } from "react-map-gl/mapbox"
import type { MapRef } from "react-map-gl/mapbox"
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  animate,
} from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Location01Icon,
  PaintBrush01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Globe02Icon,
  Add01Icon,
  Remove01Icon,
  Navigation03Icon,
  Cancel01Icon,
  TelephoneIcon,
  SeatSelectorIcon,
} from "@hugeicons/core-free-icons"

import { useResolvedTheme } from "@/hooks/use-resolved-theme"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useAdminStore } from "@/stores/admin-store"
import type { Establishment } from "@/stores/admin-types"

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

// Map KPIs per establishment (mock data for the map sidebar)
const mapKpis: Record<string, { revenue: number; covers: number; occupancy: number; rating: number }> = {
  "est-1": { revenue: 127500, covers: 1842, occupancy: 87, rating: 4.6 },
  "est-2": { revenue: 98200, covers: 1356, occupancy: 74, rating: 4.3 },
}

const defaultKpis = { revenue: 0, covers: 0, occupancy: 0, rating: 0 }

const MAP_STYLE = "mapbox://styles/mapbox/standard"

const BASE_CONFIG = {
  showPointOfInterestLabels: false,
  showTransitLabels: false,
  showRoadLabels: false,
  showPedestrianRoads: false,
  showPlaceLabels: true,
  showBuildingModels: false,
}

const THEME_CONFIGS = {
  light: { ...BASE_CONFIG, lightPreset: "day" },
  dark: { ...BASE_CONFIG, lightPreset: "night" },
}

const FOG_CONFIGS = {
  light: {
    range: [0.5, 10] as [number, number],
    color: "hsl(0, 0%, 97%)",
    "high-color": "hsl(220, 20%, 92%)",
    "horizon-blend": 0.08,
    "star-intensity": 0,
  },
  dark: {
    range: [0.5, 10] as [number, number],
    color: "hsl(220, 10%, 8%)",
    "high-color": "hsl(220, 15%, 12%)",
    "horizon-blend": 0.08,
    "star-intensity": 0.15,
  },
}

function applyThemeToMap(
  map: mapboxgl.Map,
  theme: "dark" | "light",
  monochrome: boolean,
  showBuildings = false
) {
  const config = THEME_CONFIGS[theme]
  try {
    for (const [key, value] of Object.entries(config)) {
      if (key === "showBuildingModels") {
        map.setConfigProperty("basemap", key, showBuildings)
      } else {
        map.setConfigProperty("basemap", key, value)
      }
    }
    map.setConfigProperty(
      "basemap",
      "theme",
      monochrome ? "monochrome" : "default"
    )
    map.setFog(FOG_CONFIGS[theme])
  } catch {
    // Config properties may not be available until style is fully loaded
  }
}

function buildConnectionLine(establishments: Establishment[]): GeoJSON.Feature {
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: establishments
        .filter((e) => e.address)
        .map((e) => [e.address!.longitude, e.address!.latitude]),
    },
  }
}

// ---------------------------------------------------------------------------
// Animated number (motion.dev pattern)
// ---------------------------------------------------------------------------
function AnimatedNumber({
  value,
  decimals = 0,
  formatFn,
}: {
  value: number
  decimals?: number
  formatFn?: (n: number) => string
}) {
  const mv = useMotionValue(0)
  const display = useTransform(mv, (v) => {
    if (formatFn) return formatFn(v)
    return v.toFixed(decimals)
  })

  useEffect(() => {
    const controls = animate(mv, value, {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1],
    })
    return () => controls.stop()
  }, [mv, value])

  return <motion.span>{display}</motion.span>
}

function MarkerPin({
  active,
  onClick,
}: {
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button type="button" onClick={onClick} className="group relative">
      {active && (
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
      )}
      <div
        className={cn(
          "relative flex size-10 items-center justify-center rounded-full shadow-lg transition-all duration-300",
          "bg-primary text-primary-foreground ring-2 ring-white/40 dark:ring-white/20",
          active && "scale-125 ring-4 ring-primary/30",
          "group-hover:scale-110"
        )}
      >
        <HugeiconsIcon icon={Location01Icon} className="size-4" />
      </div>
    </button>
  )
}

const EXPAND_TRANSITION = {
  duration: 0.3,
  ease: [0.32, 0.72, 0, 1] as const, // ease-out cubic
}

function formatRevenue(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toFixed(0)
}

export default function MapCard() {
  const resolvedTheme = useResolvedTheme()
  const establishments = useAdminStore((s) => s.establishments)
  const setCurrentEstablishment = useAdminStore((s) => s.setCurrentEstablishment)
  // Only show establishments that have an address (needed for map)
  const restaurants = useMemo(
    () => establishments.filter((e) => e.address),
    [establishments]
  )
  const connectionLineData = useMemo(() => buildConnectionLine(restaurants), [restaurants])
  const [monochrome, setMonochrome] = useState(true)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [cardStyleLoaded, setCardStyleLoaded] = useState(false)
  const [fullscreenStyleLoaded, setFullscreenStyleLoaded] = useState(false)
  const cardMapRef = useRef<MapRef>(null)
  const fullscreenMapRef = useRef<MapRef>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const [transformOrigin, setTransformOrigin] = useState("center center")

  const establishment = activeIndex !== null ? restaurants[activeIndex] : null
  const restaurant = establishment // alias for JSX readability
  const restaurantKpis = establishment ? (mapKpis[establishment.id] ?? defaultKpis) : null

  const FRANCE_VIEW = { longitude: 2.5, latitude: 46.8, zoom: 4.8 }

  const prev = () =>
    setActiveIndex((i) =>
      i === null || i === 0 ? restaurants.length - 1 : i - 1
    )
  const next = () =>
    setActiveIndex((i) =>
      i === null || i === restaurants.length - 1 ? 0 : i + 1
    )
  const resetView = () => setActiveIndex(null)

  const handleMarkerClick = (index: number) => {
    setActiveIndex(index)
    // Sync global establishment selection
    const r = restaurants[index]
    if (r) setCurrentEstablishment(r.id)
  }

  const handleExpand = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      setTransformOrigin(`${cx}px ${cy}px`)
    }
    setIsExpanded(true)
  }

  const handleCardMapLoad = useCallback(() => {
    const map = cardMapRef.current?.getMap()
    if (map) applyThemeToMap(map, resolvedTheme, monochrome)
    setCardStyleLoaded(true)
  }, [resolvedTheme, monochrome])

  const handleFullscreenMapLoad = useCallback(() => {
    const map = fullscreenMapRef.current?.getMap()
    if (!map) return
    const isLocked = !!restaurant
    applyThemeToMap(map, resolvedTheme, monochrome, isLocked)
    setFullscreenStyleLoaded(true)
    if (restaurant) {
      map.flyTo({
        center: [restaurant.address!.longitude, restaurant.address!.latitude],
        zoom: 14,
        pitch: 45,
        bearing: 20,
        duration: 2500,
        curve: 1.42,
        essential: true,
      })
    }
  }, [resolvedTheme, monochrome, restaurant])

  // Sync theme/monochrome changes to card map
  useEffect(() => {
    const map = cardMapRef.current?.getMap()
    if (map?.isStyleLoaded()) applyThemeToMap(map, resolvedTheme, monochrome)
  }, [resolvedTheme, monochrome])

  // Sync theme/monochrome changes to fullscreen map
  useEffect(() => {
    const map = fullscreenMapRef.current?.getMap()
    if (map?.isStyleLoaded())
      applyThemeToMap(map, resolvedTheme, monochrome, !!restaurant)
  }, [resolvedTheme, monochrome, restaurant])

  // Fly card map to active restaurant or back to France
  useEffect(() => {
    const map = cardMapRef.current?.getMap()
    if (!map) return
    const r = activeIndex !== null ? restaurants[activeIndex] : null
    if (r) {
      map.flyTo({
        center: [r.address!.longitude, r.address!.latitude],
        zoom: 8,
        pitch: 30,
        bearing: 10,
        duration: 2000,
        curve: 1.42,
        essential: true,
      })
    } else {
      map.flyTo({
        center: [FRANCE_VIEW.longitude, FRANCE_VIEW.latitude],
        zoom: FRANCE_VIEW.zoom,
        pitch: 0,
        bearing: 0,
        duration: 2000,
        curve: 1.8,
        essential: true,
      })
    }
  }, [activeIndex])

  // Fly fullscreen map when activeIndex changes + toggle 3D
  useEffect(() => {
    const map = fullscreenMapRef.current?.getMap()
    if (!map) return
    const locked = activeIndex !== null
    const r = locked ? restaurants[activeIndex] : null
    try {
      map.setConfigProperty("basemap", "showBuildingModels", locked)
    } catch { /* style may not be ready yet */ }
    if (r) {
      map.flyTo({
        center: [r.address!.longitude, r.address!.latitude],
        zoom: 14,
        pitch: 45,
        bearing: 20,
        duration: 4000,
        curve: 1.8,
        speed: 0.8,
        essential: true,
      })
    } else {
      map.flyTo({
        center: [FRANCE_VIEW.longitude, FRANCE_VIEW.latitude],
        zoom: FRANCE_VIEW.zoom,
        pitch: 0,
        bearing: 0,
        duration: 3500,
        curve: 2,
        speed: 0.6,
        essential: true,
      })
    }
  }, [activeIndex])

  // Escape key to close
  useEffect(() => {
    if (!isExpanded) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsExpanded(false)
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [isExpanded])

  // Body scroll lock when expanded
  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isExpanded])

  // Reset style-loaded flags on expand/collapse so remounted maps wait for onLoad
  useEffect(() => {
    if (isExpanded) {
      setCardStyleLoaded(false)
    } else {
      setFullscreenStyleLoaded(false)
    }
  }, [isExpanded])

  // Resize map after sidebar appears
  useEffect(() => {
    if (!isExpanded) return
    const timer = setTimeout(() => {
      fullscreenMapRef.current?.getMap()?.resize()
    }, 400)
    return () => clearTimeout(timer)
  }, [isExpanded])

  const zoomIn = () => {
    const map = fullscreenMapRef.current?.getMap()
    if (map) map.zoomIn({ duration: 300 })
  }
  const zoomOut = () => {
    const map = fullscreenMapRef.current?.getMap()
    if (map) map.zoomOut({ duration: 300 })
  }
  const resetBearing = () => {
    const map = fullscreenMapRef.current?.getMap()
    if (map) map.resetNorthPitch({ duration: 500 })
  }

  const connectionLineColor =
    resolvedTheme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"

  return (
    <>
      {/* Card view — always in the DOM to hold grid space, invisible when expanded */}
      <div
        ref={cardRef}
        className={cn(
          "relative h-full cursor-pointer overflow-hidden rounded-xl",
          isExpanded && "invisible"
        )}
        onClick={handleExpand}
      >
        <Card className="!gap-0 relative h-full overflow-hidden !p-0">
          <div className="map-card h-full min-h-[300px]">
            <Map
              ref={cardMapRef}
              mapboxAccessToken={MAPBOX_TOKEN}
              mapStyle={MAP_STYLE}
              initialViewState={{
                longitude: 2.5,
                latitude: 46.8,
                zoom: 4.8,
                pitch: 0,
              }}
              maxZoom={18}
              minZoom={3}
              maxBounds={[
                [-10, 35],
                [15, 55],
              ]}
              renderWorldCopies={false}
              interactive={false}
              attributionControl={false}
              style={{ width: "100%", height: "100%" }}
              onLoad={handleCardMapLoad}
            >
              {cardStyleLoaded && (
                <Source id="connections" type="geojson" data={connectionLineData}>
                  <Layer
                    id="connection-line"
                    type="line"
                    paint={{
                      "line-color": connectionLineColor,
                      "line-width": 1,
                      "line-dasharray": [4, 4],
                    }}
                  />
                </Source>
              )}
              {restaurants.map((r, i) => (
                <Marker
                  key={i}
                  longitude={r.address!.longitude}
                  latitude={r.address!.latitude}
                  anchor="bottom"
                >
                  <div
                    className="marker-enter"
                    style={{ animationDelay: `${0.3 + i * 0.15}s` }}
                  >
                    <MarkerPin active={activeIndex === i} />
                  </div>
                </Marker>
              ))}
            </Map>
          </div>

          {/* Badges overlay */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-between p-3">
            <Badge
              variant="secondary"
              className="pointer-events-auto shadow-sm"
            >
              Localisation
            </Badge>
            <Badge
              variant="outline"
              className="pointer-events-auto bg-card/80 shadow-sm backdrop-blur-sm"
            >
              {restaurants.length} Restaurants
            </Badge>
          </div>

          {/* Blur info overlay */}
          <div
            className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/50 via-black/25 to-transparent p-4 pt-16 backdrop-blur-sm"
            style={{
              maskImage: "linear-gradient(to bottom, transparent, black 40%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent, black 40%)",
            }}
          >
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {restaurant ? restaurant.name : "Holly Fork"}
                </h3>
                <p className="text-xs text-white/70">
                  {restaurant
                    ? restaurant.address!.fullAddress
                    : `${restaurants.length} restaurants en France`}
                </p>
              </div>
              <div className="flex gap-1">
                {activeIndex !== null && (
                  <button
                    type="button"
                    className="flex size-7 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25"
                    onClick={(e) => {
                      e.stopPropagation()
                      resetView()
                    }}
                  >
                    <HugeiconsIcon icon={Globe02Icon} className="size-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  className="flex size-7 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25"
                  onClick={(e) => {
                    e.stopPropagation()
                    prev()
                  }}
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5" />
                </button>
                <button
                  type="button"
                  className="flex size-7 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25"
                  onClick={(e) => {
                    e.stopPropagation()
                    next()
                  }}
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Backdrop + Expanded view — portaled to body */}
      {createPortal(
        <>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsExpanded(false)}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                className="fixed inset-4 z-[61] flex overflow-hidden rounded-2xl shadow-2xl"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={EXPAND_TRANSITION}
                style={{ transformOrigin }}
              >
                {/* SIDEBAR */}
                <div className="flex w-80 shrink-0 flex-col overflow-y-auto border-r bg-background">
                  <AnimatePresence mode="wait">
                    {activeIndex === null ? (
                      <motion.div
                        key="free"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-1 flex-col"
                      >
                        {/* Header */}
                        <div className="p-5 pb-3">
                          <h2 className="text-lg font-semibold">Holly Fork</h2>
                          <p className="text-sm text-muted-foreground">
                            {restaurants.length} restaurants
                          </p>
                        </div>
                        <Separator />

                        {/* Restaurant list */}
                        <div className="flex flex-1 flex-col gap-2 p-4">
                          {restaurants.map((r, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setActiveIndex(i)}
                              className="flex items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium truncate">
                                    {r.name}
                                  </span>
                                  <Badge
                                    variant={r.isActive ? "success" : "destructive"}
                                    className="text-[10px]"
                                  >
                                    {r.isActive ? "Ouvert" : "Fermé"}
                                  </Badge>
                                </div>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {r.address!.city}, {r.address!.postalCode}
                                </p>
                              </div>
                              <div className="text-right shrink-0 ml-3">
                                <p className="text-xs tabular-nums text-muted-foreground">
                                  {r.totalCapacity} cvts
                                </p>
                                <p className="text-xs tabular-nums text-muted-foreground">
                                  {(mapKpis[r.id] ?? defaultKpis).occupancy}%
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={`locked-${activeIndex}`}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-1 flex-col"
                      >
                        {/* Image placeholder + status badge */}
                        <div className="relative h-40 bg-muted">
                          <div className="flex h-full items-center justify-center">
                            <HugeiconsIcon
                              icon={Location01Icon}
                              className="size-8 text-muted-foreground/40"
                            />
                          </div>
                          <div className="absolute bottom-2 left-3">
                            <Badge
                              variant={restaurant!.isActive ? "success" : "destructive"}
                            >
                              {restaurant!.isActive ? "Ouvert" : "Fermé"}
                            </Badge>
                          </div>
                        </div>

                        {/* Title */}
                        <div className="p-4 pb-3">
                          <h2 className="text-base font-semibold">
                            {restaurant!.name}
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            {restaurant!.address!.city}, {restaurant!.address!.postalCode}
                          </p>
                        </div>

                        <Separator />

                        {/* KPI grid */}
                        <div className="grid grid-cols-2 gap-3 p-4">
                          <div>
                            <p className="text-[11px] text-muted-foreground">
                              CA mensuel
                            </p>
                            <p className="text-lg font-semibold tabular-nums">
                              <AnimatedNumber
                                value={restaurantKpis!.revenue}
                                formatFn={(n) => `${formatRevenue(n)}€`}
                              />
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-muted-foreground">
                              Couverts
                            </p>
                            <p className="text-lg font-semibold tabular-nums">
                              <AnimatedNumber
                                value={restaurantKpis!.covers}
                                formatFn={(n) =>
                                  n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ")
                                }
                              />
                            </p>
                          </div>
                          <div className="col-span-2">
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] text-muted-foreground">
                                Occupation
                              </p>
                              <p className="text-[11px] font-medium tabular-nums">
                                <AnimatedNumber value={restaurantKpis!.occupancy} />%
                              </p>
                            </div>
                            <Progress
                              value={restaurantKpis!.occupancy}
                              className="mt-1.5"
                            />
                          </div>
                          <div>
                            <p className="text-[11px] text-muted-foreground">
                              Satisfaction
                            </p>
                            <p className="text-lg font-semibold tabular-nums">
                              <AnimatedNumber
                                value={restaurantKpis!.rating}
                                decimals={1}
                              />
                              <span className="text-sm text-muted-foreground font-normal">
                                /5
                              </span>
                            </p>
                          </div>
                        </div>

                        <Separator />

                        {/* Contact info */}
                        <div className="space-y-2.5 p-4">
                          <div className="flex items-start gap-2 text-sm">
                            <HugeiconsIcon
                              icon={Location01Icon}
                              className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                            />
                            <span className="text-muted-foreground">
                              {restaurant!.address!.fullAddress}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <HugeiconsIcon
                              icon={TelephoneIcon}
                              className="size-3.5 shrink-0 text-muted-foreground"
                            />
                            <span className="text-muted-foreground">
                              {restaurant!.phone}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <HugeiconsIcon
                              icon={SeatSelectorIcon}
                              className="size-3.5 shrink-0 text-muted-foreground"
                            />
                            <span className="text-muted-foreground">
                              {restaurant!.totalCapacity} couverts
                            </span>
                          </div>

                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(restaurant!.address!.fullAddress)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                          >
                            <HugeiconsIcon
                              icon={Globe02Icon}
                              className="size-3.5"
                            />
                            Voir sur Google Maps
                          </a>
                        </div>

                        {/* Navigation footer */}
                        <div className="mt-auto border-t p-3">
                          <div className="flex items-center justify-between">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={prev}
                            >
                              <HugeiconsIcon
                                icon={ArrowLeft01Icon}
                                className="size-3.5"
                              />
                              Préc.
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={resetView}
                              title="Vue France"
                            >
                              <HugeiconsIcon
                                icon={Globe02Icon}
                                className="size-4"
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={next}
                            >
                              Suiv.
                              <HugeiconsIcon
                                icon={ArrowRight01Icon}
                                className="size-3.5"
                              />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* MAP CONTAINER */}
                <div className="relative flex-1">
                  <Map
                    ref={fullscreenMapRef}
                    mapboxAccessToken={MAPBOX_TOKEN}
                    mapStyle={MAP_STYLE}
                    initialViewState={{
                      longitude: restaurant
                        ? restaurant.address!.longitude
                        : FRANCE_VIEW.longitude,
                      latitude: restaurant
                        ? restaurant.address!.latitude
                        : FRANCE_VIEW.latitude,
                      zoom: restaurant ? 14 : FRANCE_VIEW.zoom,
                      pitch: restaurant ? 45 : 0,
                      bearing: restaurant ? 20 : 0,
                    }}
                    maxZoom={18}
                    minZoom={3}
                    maxBounds={[
                      [-10, 35],
                      [15, 55],
                    ]}
                    renderWorldCopies={false}
                    style={{ width: "100%", height: "100%" }}
                    onLoad={handleFullscreenMapLoad}
                  >
                    {fullscreenStyleLoaded && (
                      <Source
                        id="connections"
                        type="geojson"
                        data={connectionLineData}
                      >
                        <Layer
                          id="connection-line"
                          type="line"
                          paint={{
                            "line-color": connectionLineColor,
                            "line-width": 1,
                            "line-dasharray": [4, 4],
                          }}
                        />
                      </Source>
                    )}
                    {fullscreenStyleLoaded &&
                      restaurants.map((r, i) => (
                        <Marker
                          key={i}
                          longitude={r.address!.longitude}
                          latitude={r.address!.latitude}
                          anchor="bottom"
                        >
                          <div
                            className="marker-enter"
                            style={{ animationDelay: `${0.3 + i * 0.15}s` }}
                          >
                            <MarkerPin
                              active={activeIndex === i}
                              onClick={() => handleMarkerClick(i)}
                            />
                          </div>
                        </Marker>
                      ))}
                  </Map>

                  {/* Cover — hides map until style is fully loaded to avoid color flash */}
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-0 z-20 flex items-center justify-center transition-opacity duration-500",
                      fullscreenStyleLoaded ? "opacity-0" : "opacity-100",
                      resolvedTheme === "dark"
                        ? "bg-[hsl(220,10%,8%)]"
                        : "bg-[hsl(0,0%,97%)]"
                    )}
                  >
                    {!fullscreenStyleLoaded && (
                      <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground/60" />
                    )}
                  </div>

                  {/* Close button */}
                  <motion.div
                    className="absolute top-3 right-12 z-30"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Button
                      variant="outline"
                      size="icon-sm"
                      className="bg-card/80 backdrop-blur-sm"
                      onClick={() => setIsExpanded(false)}
                    >
                      <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
                      <span className="sr-only">Fermer</span>
                    </Button>
                  </motion.div>

                  {/* Custom navigation controls */}
                  <motion.div
                    className="absolute top-3 right-3 z-30 flex flex-col gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Button
                      variant="outline"
                      size="icon-sm"
                      className="bg-card/80 backdrop-blur-sm"
                      onClick={zoomIn}
                    >
                      <HugeiconsIcon icon={Add01Icon} className="size-4" />
                      <span className="sr-only">Zoom avant</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      className="bg-card/80 backdrop-blur-sm"
                      onClick={zoomOut}
                    >
                      <HugeiconsIcon icon={Remove01Icon} className="size-4" />
                      <span className="sr-only">Zoom arrière</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      className="bg-card/80 backdrop-blur-sm"
                      onClick={resetBearing}
                    >
                      <HugeiconsIcon
                        icon={Navigation03Icon}
                        className="size-4"
                      />
                      <span className="sr-only">
                        Réinitialiser orientation
                      </span>
                    </Button>
                  </motion.div>

                  {/* Monochrome / Color toggle */}
                  <motion.div
                    className="absolute top-3 left-3 z-30"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Button
                      variant="outline"
                      size="icon-sm"
                      className="bg-card/80 backdrop-blur-sm"
                      onClick={() => setMonochrome((v) => !v)}
                    >
                      <HugeiconsIcon
                        icon={PaintBrush01Icon}
                        className={monochrome ? "size-4 opacity-50" : "size-4"}
                      />
                      <span className="sr-only">
                        {monochrome ? "Activer les couleurs" : "Mode monochrome"}
                      </span>
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>,
        document.body
      )}
    </>
  )
}
