import * as React from "react"

type User = {
  id: string
  email: string
  name: string
}

type AuthContextValue = {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const stored = localStorage.getItem("auth_user")
    if (stored) {
      setUser(JSON.parse(stored))
    }
    setIsLoading(false)
  }, [])

  const login = React.useCallback(async (_email: string, _password: string) => {
    // TODO: remplacer par un vrai appel API
    const mockUser: User = { id: "1", email: _email, name: "Admin" }
    localStorage.setItem("auth_user", JSON.stringify(mockUser))
    setUser(mockUser)
  }, [])

  const register = React.useCallback(
    async (_email: string, _password: string, _name: string) => {
      // TODO: remplacer par un vrai appel API
      const mockUser: User = { id: "1", email: _email, name: _name }
      localStorage.setItem("auth_user", JSON.stringify(mockUser))
      setUser(mockUser)
    },
    []
  )

  const logout = React.useCallback(() => {
    localStorage.removeItem("auth_user")
    setUser(null)
  }, [])

  const value = React.useMemo(
    () => ({ user, isLoading, login, register, logout }),
    [user, isLoading, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
