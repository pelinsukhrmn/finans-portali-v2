import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import keycloak from '../keycloak'
import api from '../services/api'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
  userId: number | null
  userEmail: string | null
  userName: string | null
  login: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  token: null,
  userId: null,
  userEmail: null,
  userName: null,
  login: () => {},
  logout: () => {},
})

function applyToken(t: string) {
  api.defaults.headers.common['Authorization'] = `Bearer ${t}`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const [userId, setUserId] = useState<number | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsLoading(false)
    }, 5000)

    // Refresh token before it expires — keeps login persistent
    keycloak.onTokenExpired = () => {
      keycloak.updateToken(30)
        .then(() => {
          if (keycloak.token) {
            setToken(keycloak.token)
            applyToken(keycloak.token)
          }
        })
        .catch(() => {
          setIsAuthenticated(false)
          setToken(null)
          delete api.defaults.headers.common['Authorization']
        })
    }

    keycloak
      .init({
        onLoad: 'check-sso',
        checkLoginIframe: false,
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      })
      .then(async (authenticated: boolean) => {
        clearTimeout(timeout)
        setIsAuthenticated(authenticated)

        if (authenticated && keycloak.token) {
          setToken(keycloak.token)
          setUserEmail(keycloak.tokenParsed?.email ?? null)
          setUserName(
            keycloak.tokenParsed?.name ??
            keycloak.tokenParsed?.preferred_username ??
            null
          )
          applyToken(keycloak.token)

          try {
            const res = await api.post('/kullanicilar/sync', {
              keycloakId: keycloak.tokenParsed?.sub,
              eposta: keycloak.tokenParsed?.email,
              adSoyad: keycloak.tokenParsed?.name,
            })
            setUserId(res.data.id)
          } catch (err) {
            console.warn('Kullanıcı sync hatası:', err)
          }
        }

        setIsLoading(false)
      })
      .catch(() => {
        clearTimeout(timeout)
        setIsLoading(false)
      })

    // Proactively refresh token every 4 minutes to stay logged in
    const refreshInterval = setInterval(() => {
      if (keycloak.authenticated) {
        keycloak.updateToken(60)
          .then((refreshed) => {
            if (refreshed && keycloak.token) {
              setToken(keycloak.token)
              applyToken(keycloak.token)
            }
          })
          .catch(() => {})
      }
    }, 4 * 60 * 1000)

    return () => {
      clearTimeout(timeout)
      clearInterval(refreshInterval)
    }
  }, [])

  const login = () => keycloak.login()
  const logout = () => {
    delete api.defaults.headers.common['Authorization']
    keycloak.logout({ redirectUri: window.location.origin })
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, token, userId, userEmail, userName, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
