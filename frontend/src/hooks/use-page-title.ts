import { useEffect } from "react"

export function usePageTitle(section: string) {
  useEffect(() => {
    document.title = section ? `${section} — Holly Fork` : "Holly Fork"
    return () => { document.title = "Holly Fork" }
  }, [section])
}
