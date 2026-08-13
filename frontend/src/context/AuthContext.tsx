import { createContext, useContext, useState, type ReactNode } from 'react'

type Role = 'ADMIN' | 'VENDEDOR'

interface AuthContextType {
  token: string | null
  role: Role | null
  login: (token: string, remember: boolean) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function decodeRole(token: string): Role | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.role ?? null
  } catch {
    return null
  }
}

// "Recordarme" decide dónde vive el token: localStorage sobrevive a cerrar el
// navegador, sessionStorage se borra solo al cerrar la pestaña/ventana.
function readStoredToken(): string | null {
  return localStorage.getItem('token') ?? sessionStorage.getItem('token')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(readStoredToken)

  function login(newToken: string, remember: boolean) {
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    if (remember) {
      localStorage.setItem('token', newToken)
    } else {
      sessionStorage.setItem('token', newToken)
    }
    setToken(newToken)
  }

  function logout() {
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    setToken(null)
  }

  const role = token ? decodeRole(token) : null

  return (
    <AuthContext.Provider value={{ token, role, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}
