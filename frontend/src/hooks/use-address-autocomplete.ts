import { useState, useRef, useEffect, useCallback } from "react"
import {
  SearchBoxCore,
  SessionToken,
  type SearchBoxSuggestion,
} from "@mapbox/search-js-core"
import type { LocationData } from "@/types/location"

export interface AddressSuggestion {
  mapboxId: string
  name: string
  placeFormatted: string
}

export interface UseAddressAutocompleteOptions {
  debounce?: number
  language?: string
  country?: string
  limit?: number
}

export function useAddressAutocomplete(
  options: UseAddressAutocompleteOptions = {}
) {
  const { debounce = 300, language = "fr", country = "fr", limit = 5 } = options

  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchBoxRef = useRef(
    new SearchBoxCore({
      accessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
    })
  )
  const sessionTokenRef = useRef(new SessionToken())
  const rawSuggestionsRef = useRef<SearchBoxSuggestion[]>([])
  const requestCounterRef = useRef(0)

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      setError(null)
      return
    }

    const timeoutId = setTimeout(async () => {
      const currentRequest = ++requestCounterRef.current
      setIsLoading(true)
      setError(null)

      try {
        const response = await searchBoxRef.current.suggest(query, {
          sessionToken: sessionTokenRef.current,
          language,
          country,
          limit,
          types: new Set(["address", "place", "street"]),
        })

        if (currentRequest !== requestCounterRef.current) return

        rawSuggestionsRef.current = response.suggestions
        setSuggestions(
          response.suggestions.map((s) => ({
            mapboxId: s.mapbox_id,
            name: s.name,
            placeFormatted: s.place_formatted,
          }))
        )
      } catch (err) {
        if (currentRequest !== requestCounterRef.current) return
        setError(err instanceof Error ? err.message : "Erreur de recherche")
        setSuggestions([])
      } finally {
        if (currentRequest === requestCounterRef.current) {
          setIsLoading(false)
        }
      }
    }, debounce)

    return () => clearTimeout(timeoutId)
  }, [query, debounce, language, country, limit])

  const selectSuggestion = useCallback(
    async (mapboxId: string): Promise<LocationData | null> => {
      const rawSuggestion = rawSuggestionsRef.current.find(
        (s) => s.mapbox_id === mapboxId
      )
      if (!rawSuggestion) return null

      try {
        const response = await searchBoxRef.current.retrieve(rawSuggestion, {
          sessionToken: sessionTokenRef.current,
        })

        // New session token after retrieve (Mapbox billing cycle)
        sessionTokenRef.current = new SessionToken()

        const feature = response.features[0]
        if (!feature) return null

        const props = feature.properties
        const ctx = props.context

        return {
          fullAddress: props.full_address || props.name,
          city: ctx.place?.name ?? ctx.locality?.name ?? "",
          postalCode: ctx.postcode?.name ?? "",
          country: ctx.country?.name ?? "",
          longitude: props.coordinates.longitude,
          latitude: props.coordinates.latitude,
          mapboxId: props.mapbox_id,
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de récupération")
        return null
      }
    },
    []
  )

  const clear = useCallback(() => {
    setQuery("")
    setSuggestions([])
    setError(null)
    rawSuggestionsRef.current = []
  }, [])

  return {
    query,
    setQuery,
    suggestions,
    isLoading,
    error,
    selectSuggestion,
    clear,
  }
}
