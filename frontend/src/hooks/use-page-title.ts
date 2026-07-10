import { useEffect } from "react"

export function usePageTitle(section: string) {
  useEffect(() => {
    document.title = section ? `${section} — Holy Fork` : "Holy Fork"
    return () => {
      document.title = "Holy Fork"
    }
  }, [section])
}
