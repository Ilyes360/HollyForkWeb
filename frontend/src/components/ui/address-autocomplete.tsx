import { useState, useRef, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Location01Icon,
  Cancel01Icon,
  PencilEdit01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons"
import {
  useAddressAutocomplete,
  type UseAddressAutocompleteOptions,
} from "@/hooks/use-address-autocomplete"
import type { LocationData } from "@/types/location"
import { cn } from "@/lib/utils"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Command, CommandItem, CommandList } from "@/components/ui/command"

interface AddressAutocompleteProps {
  value: LocationData | null
  onValueChange: (location: LocationData | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  searchOptions?: UseAddressAutocompleteOptions
}

export function AddressAutocomplete({
  value,
  onValueChange,
  placeholder = "Ex : 12 Rue de Rivoli, Paris",
  disabled = false,
  className,
  searchOptions,
}: AddressAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [manual, setManual] = useState(false)
  const [manualValue, setManualValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    query,
    setQuery,
    suggestions,
    isLoading,
    error,
    selectSuggestion,
    clear,
  } = useAddressAutocomplete(searchOptions)

  const displayValue = value ? value.fullAddress : query

  const hasContent =
    isLoading ||
    suggestions.length > 0 ||
    error !== null ||
    (!isLoading && query.length >= 2 && suggestions.length === 0)

  useEffect(() => {
    if (manual) return
    if (hasContent && !value) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(true)
    } else {
      setOpen(false)
    }
  }, [hasContent, value, manual])

  // --- Manual mode ---
  if (manual) {
    const displayManual = value ? value.fullAddress : manualValue

    const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value
      setManualValue(v)
      if (v.trim()) {
        onValueChange({
          fullAddress: v,
          city: v,
          postalCode: "",
          country: "",
          longitude: 0,
          latitude: 0,
          mapboxId: "",
        })
      } else {
        onValueChange(null)
      }
    }

    const handleManualClear = () => {
      setManualValue("")
      onValueChange(null)
      inputRef.current?.focus()
    }

    const switchToSearch = () => {
      setManual(false)
      setManualValue("")
      onValueChange(null)
      clear()
      setTimeout(() => inputRef.current?.focus(), 0)
    }

    return (
      <div className={cn("space-y-1.5", className)}>
        <InputGroup className="bg-background">
          <InputGroupAddon>
            <HugeiconsIcon
              icon={PencilEdit01Icon}
              strokeWidth={2}
              className="size-4 text-muted-foreground"
            />
          </InputGroupAddon>
          <InputGroupInput
            ref={inputRef}
            placeholder="Saisissez votre adresse"
            disabled={disabled}
            value={displayManual}
            onChange={handleManualChange}
            autoFocus
          />
          {value && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                variant="ghost"
                onClick={handleManualClear}
                aria-label="Effacer l'adresse"
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  strokeWidth={2}
                  className="size-3.5"
                />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
        <button
          type="button"
          onClick={switchToSearch}
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <HugeiconsIcon
            icon={Search01Icon}
            strokeWidth={2}
            className="size-3"
          />
          <span>Rechercher avec l'autocomplete</span>
        </button>
      </div>
    )
  }

  // --- Autocomplete mode ---

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      if (hasContent && !value) setOpen(true)
    } else {
      setOpen(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setQuery(newValue)
    if (value) {
      onValueChange(null)
    }
  }

  const handleSelect = async (mapboxId: string) => {
    const location = await selectSuggestion(mapboxId)
    if (location) {
      onValueChange(location)
      setOpen(false)
    }
  }

  const handleClear = () => {
    clear()
    onValueChange(null)
    inputRef.current?.focus()
  }

  const switchToManual = () => {
    setManual(true)
    setManualValue(query)
    setOpen(false)
    if (query.trim()) {
      onValueChange({
        fullAddress: query.trim(),
        city: query.trim(),
        postalCode: "",
        country: "",
        longitude: 0,
        latitude: 0,
        mapboxId: "",
      })
    }
  }

  const canUseManual = !isLoading && !value && query.trim().length >= 2

  return (
    <div className={cn("space-y-1.5", className)}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger render={<div />} className="w-full">
          <InputGroup className="bg-background">
            <InputGroupAddon>
              <HugeiconsIcon
                icon={Location01Icon}
                strokeWidth={2}
                className="size-4 text-muted-foreground"
              />
            </InputGroupAddon>
            <InputGroupInput
              ref={inputRef}
              placeholder={placeholder}
              disabled={disabled}
              value={displayValue}
              onChange={handleInputChange}
              onFocus={() => {
                if (hasContent && !value) {
                  setOpen(true)
                }
              }}
            />
            {value && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  variant="ghost"
                  onClick={handleClear}
                  aria-label="Effacer l'adresse"
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    strokeWidth={2}
                    className="size-3.5"
                  />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>
        </PopoverTrigger>

        <PopoverContent
          className="w-(--anchor-width) p-0"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {...({ onOpenAutoFocus: (e: Event) => e.preventDefault() } as any)}
        >
          {isLoading && (
            <div className="px-3 py-2.5 text-center text-sm text-muted-foreground">
              Recherche en cours…
            </div>
          )}

          <Command shouldFilter={false} className="bg-popover">
            <CommandList>
              {suggestions.map((suggestion) => (
                <CommandItem
                  key={suggestion.mapboxId}
                  value={suggestion.mapboxId}
                  onSelect={() => handleSelect(suggestion.mapboxId)}
                >
                  <HugeiconsIcon
                    icon={Location01Icon}
                    strokeWidth={2}
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    <span className="truncate text-sm">{suggestion.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {suggestion.placeFormatted}
                    </span>
                  </div>
                </CommandItem>
              ))}

              {canUseManual && !error && (
                <CommandItem value="__manual__" onSelect={switchToManual}>
                  <HugeiconsIcon
                    icon={PencilEdit01Icon}
                    strokeWidth={2}
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                  <span className="text-sm text-muted-foreground">
                    Saisir manuellement
                  </span>
                </CommandItem>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {error && !value && (
        <button
          type="button"
          onClick={switchToManual}
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <HugeiconsIcon
            icon={PencilEdit01Icon}
            strokeWidth={2}
            className="size-3"
          />
          <span>Recherche indisponible — saisir manuellement</span>
        </button>
      )}
    </div>
  )
}
