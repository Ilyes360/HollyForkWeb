import * as React from "react"

type ThemeProviderProps = {
  children: React.ReactNode
}

type Theme = "light" | "dark" | "system"

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext = React.createContext<
  ThemeProviderState | undefined
>(undefined)

export function ThemeProvider({ children }: ThemeProviderProps) {
  React.useEffect(() => {
    const root = document.documentElement
    root.classList.remove("dark")
    root.classList.add("light")
  }, [])

  const setTheme = React.useCallback((_theme: Theme) => {
    // Currently only light mode is supported
  }, [])

  const value = React.useMemo(
    () => ({ theme: "light" as Theme, setTheme }),
    [setTheme]
  )

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext)

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }

  return context
}
