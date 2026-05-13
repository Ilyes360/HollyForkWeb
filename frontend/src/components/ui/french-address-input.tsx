import { useState, useRef, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { Location01Icon, Loading03Icon } from "@hugeicons/core-free-icons"

export interface FrenchAddressResult {
  label: string
  address: string
  postalCode: string
  city: string
  longitude: number
  latitude: number
}

interface FrenchAddressInputProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (result: FrenchAddressResult) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

const API_URL = "https://data.geopf.fr/geocodage/search/"

export function FrenchAddressInput({
  value,
  onChange,
  onSelect,
  placeholder = "Rechercher une adresse...",
  className,
  disabled,
}: FrenchAddressInputProps) {
  const [suggestions, setSuggestions] = useState<FrenchAddressResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(
        `${API_URL}?q=${encodeURIComponent(query)}&limit=5`
      )
      if (!res.ok) throw new Error()
      const data = await res.json()

      const results: FrenchAddressResult[] = (data.features ?? []).map(
        (f: {
          properties: {
            label: string
            name: string
            postcode: string
            city: string
          }
          geometry: { coordinates: [number, number] }
        }) => ({
          label: f.properties.label,
          address: f.properties.name,
          postalCode: f.properties.postcode,
          city: f.properties.city,
          longitude: f.geometry.coordinates[0],
          latitude: f.geometry.coordinates[1],
        })
      )

      setSuggestions(results)
      setIsOpen(results.length > 0)
      setActiveIndex(-1)
    } catch {
      // API unavailable — user can type manually
      setSuggestions([])
      setIsOpen(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      onChange(val)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => fetchSuggestions(val), 300)
    },
    [onChange, fetchSuggestions]
  )

  const handleSelect = useCallback(
    (result: FrenchAddressResult) => {
      onChange(result.address)
      onSelect?.(result)
      setIsOpen(false)
      setSuggestions([])
    },
    [onChange, onSelect]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || suggestions.length === 0) return
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveIndex((i) => (i > 0 ? i - 1 : suggestions.length - 1))
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault()
        handleSelect(suggestions[activeIndex])
      } else if (e.key === "Escape") {
        setIsOpen(false)
      }
    },
    [isOpen, suggestions, activeIndex, handleSelect]
  )

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className={cn("pr-8", className)}
          disabled={disabled}
          autoComplete="off"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
          {isLoading ? (
            <HugeiconsIcon icon={Loading03Icon} className="size-3.5 animate-spin" />
          ) : (
            <HugeiconsIcon icon={Location01Icon} className="size-3.5" strokeWidth={2} />
          )}
        </div>
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-[9999] mt-1 w-full max-h-[240px] overflow-y-auto rounded-lg border bg-popover p-1 shadow-lg">
          {suggestions.map((result, i) => (
            <button
              key={`${result.label}-${i}`}
              type="button"
              className={cn(
                "flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                i === activeIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted"
              )}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <HugeiconsIcon
                icon={Location01Icon}
                className="size-3.5 mt-0.5 shrink-0 text-muted-foreground"
                strokeWidth={2}
              />
              <div className="min-w-0">
                <p className="font-medium truncate">{result.address}</p>
                <p className="text-xs text-muted-foreground">
                  {result.postalCode} {result.city}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
