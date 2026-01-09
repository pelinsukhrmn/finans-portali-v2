import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const [userId, setUserId] = useState<number | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    keycloak
      .init({
        onLoad: 'check-sso',
        checkLoginIframe: false,
      })
      .then(async (authenticated) => {
        setIsAuthenticated(authenticated)

        if (authenticated && keycloak.token) {
          setToken(keycloak.token)
          setUserEmail(keycloak.tokenParsed?.email ?? null)
          setUserName(
            keycloak.tokenParsed?.name ??
            keycloak.tokenParsed?.preferred_username ??
            null
          )

          // Token'ı axios header'ına ekle
          api.defaults.headers.common['Authorization'] = `Bearer ${keycloak.token}`

          // Backend'e kullanıcıyı senkronize et, internal ID al
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

          // Token yenileme: her 60 saniyede kontrol et, 30 sn kaldıysa yenile
          setInterval(() => {
            keycloak.updateToken(30).then((refreshed) => {
              if (refreshed && keycloak.token) {
                setToken(keycloak.token)
                api.defaults.headers.common['Authorization'] = `Bearer ${keycloak.token}`
              }
            }).catch(() => {
              console.warn('Token yenileme başarısız, çıkış yapılıyor...')
              keycloak.logout()
            })
          }, 60_000)
        }

        setIsLoading(false)
      })
      .catch((err) => {
        console.error('Keycloak init hatası:', err)
        setIsLoading(false)
      })
  }, [])

  const login = () => keycloak.login()
  const logout = () => {
    api.defaults.headers.common['Authorization'] = ''
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
