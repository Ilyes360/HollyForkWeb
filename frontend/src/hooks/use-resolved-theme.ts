import { useState, useEffect } from "react"
import { useTheme } from "@/components/theme-provider"

const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)"

export function useResolvedTheme(): "dark" | "light" {
  const { theme } = useTheme()

  const [resolved, setResolved] = useState<"dark" | "light">(() => {
    if (theme !== "system") return theme
    return window.matchMedia(COLOR_SCHEME_QUERY).matches ? "dark" : "light"
  })

  useEffect(() => {
    if (theme !== "system") {
      setResolved(theme)
      return
    }

    const mq = window.matchMedia(COLOR_SCHEME_QUERY)
    const update = () => setResolved(mq.matches ? "dark" : "light")
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [theme])

  return resolved
}
