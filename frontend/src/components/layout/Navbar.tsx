import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Search, TrendingUp, LogIn, LogOut, User, Settings, ChevronDown,
         ShieldAlert, BookOpen, BarChart2, Globe, Menu, X } from 'lucide-react'
import { yatirimAraclari } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import NotificationBell from './NotificationBell'

const ANA_TABS = [
  { path: '/',                label: 'Genel Bakış'    },
  { path: '/piyasa',          label: 'Piyasa'         },
  { path: '/analiz',          label: 'Analiz'         },
  { path: '/portfoy',         label: 'Portföy'        },
  { path: '/haberler',        label: 'Haberler'       },
  { path: '/ekonomik-takvim', label: 'Takvim'         },
]

const ARACLAR_MENU = [
  { path: '/geri-test',       label: 'Backtesting',           icon: BarChart2   },
  { path: '/etkin-sinir',     label: 'Etkin Sınır Analizi',   icon: TrendingUp  },
  { path: '/stres-testi',     label: 'Kriz Stres Testi',      icon: ShieldAlert },
  { path: '/tahmin-defteri',  label: 'Tahmin Defteri',        icon: BookOpen    },
  { path: '/dunya-piyasalari',label: 'Dünya Piyasaları',      icon: Globe       },
]

const ARACLAR_PATHS = new Set(ARACLAR_MENU.map(a => a.path))

interface AramaSonuc { id: number; sembol: string; ad: string; tip: string }

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sonuclar, setSonuclar]       = useState<AramaSonuc[]>([])
  const [aramaAcik, setAramaAcik]     = useState(false)
  const [userMenuAcik, setUserMenuAcik] = useState(false)
  const [araclarAcik, setAraclarAcik] = useState(false)
  const [mobileMenuAcik, setMobileMenuAcik] = useState(false)
  const [mobileAraclarAcik, setMobileAraclarAcik] = useState(false)
  const araclarRef = useRef<HTMLDivElement>(null)
  const location   = useLocation()
  const navigate   = useNavigate()
  const { isAuthenticated, isLoading, userName, userEmail, login, logout } = useAuth()

  const araclarAktif = ARACLAR_PATHS.has(location.pathname)

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuAcik(false)
  }, [location.pathname])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (araclarRef.current && !araclarRef.current.contains(e.target as Node)) {
        setAraclarAcik(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const aramaYap = async (q: string) => {
    setSearchQuery(q)
    if (q.length < 2) { setSonuclar([]); return }
    try {
      const res = await yatirimAraclari.ara(q)
      setSonuclar(res.data.slice(0, 6))
      setAramaAcik(true)
    } catch { setSonuclar([]) }
  }

  const sonucaTikla = (araci: AramaSonuc) => {
    setSearchQuery(''); setSonuclar([]); setAramaAcik(false)
    navigate(`/analiz?sembol=${araci.sembol}`)
  }

  const tipRenk = (tip: string) => {
    const renkler: Record<string, string> = {
      HISSE: 'bg-blue-50 text-blue-600',
      DOVIZ: 'bg-green-50 text-green-600',
      KRIPTO: 'bg-orange-50 text-orange-600',
      FON: 'bg-purple-50 text-purple-600',
    }
    return renkler[tip] ?? 'bg-gray-50 text-gray-600'
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-gray-900 tracking-tight shrink-0">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span className="hidden sm:inline">Finans Portalı</span>
            <span className="sm:hidden">FP</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 ml-4">
            {ANA_TABS.map(tab => (
              <Link key={tab.path} to={tab.path}
                className={`px-3 py-2 text-sm rounded-md transition-colors whitespace-nowrap ${
                  location.pathname === tab.path
                    ? 'text-blue-600 bg-blue-50 font-medium'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}>
                {tab.label}
              </Link>
            ))}

            {/* Araçlar dropdown */}
            <div className="relative" ref={araclarRef}>
              <button onClick={() => setAraclarAcik(v => !v)}
                className={`flex items-center gap-1 px-3 py-2 text-sm rounded-md transition-colors whitespace-nowrap ${
                  araclarAktif
                    ? 'text-blue-600 bg-blue-50 font-medium'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}>
                Araçlar
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${araclarAcik ? 'rotate-180' : ''}`} />
              </button>

              {araclarAcik && (
                <div className="absolute left-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                  {ARACLAR_MENU.map(item => {
                    const Icon = item.icon
                    return (
                      <Link key={item.path} to={item.path}
                        onClick={() => setAraclarAcik(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                          location.pathname === item.path
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}>
                        <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Sağ: Arama + Bildirim + Kullanıcı + Hamburger */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Arama - masaüstünde göster */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Hisse, döviz, kripto ara..."
                value={searchQuery}
                onChange={e => aramaYap(e.target.value)}
                onBlur={() => setTimeout(() => setAramaAcik(false), 150)}
                className="pl-9 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg w-48 lg:w-56 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {aramaAcik && sonuclar.length > 0 && (
                <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                  {sonuclar.map(s => (
                    <button key={s.id} onMouseDown={() => sonucaTikla(s)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-blue-50 transition-colors">
                      <div className="text-left">
                        <div className="text-sm font-medium text-gray-900">{s.sembol}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[180px]">{s.ad}</div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipRenk(s.tip)}`}>{s.tip}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <NotificationBell />

            {/* Kullanıcı - masaüstünde göster */}
            <div className="hidden md:block">
              {isLoading ? (
                <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
              ) : isAuthenticated ? (
                <div className="relative">
                  <button onClick={() => setUserMenuAcik(!userMenuAcik)}
                    onBlur={() => setTimeout(() => setUserMenuAcik(false), 150)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="hidden lg:inline max-w-[120px] truncate">{userName ?? userEmail ?? 'Kullanıcı'}</span>
                  </button>
                  {userMenuAcik && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-xs font-medium text-gray-900 truncate">{userName}</p>
                        <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                      </div>
                      <button onMouseDown={() => { setUserMenuAcik(false); navigate('/ayarlar') }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Settings className="w-4 h-4 text-gray-400" />
                        Bildirim Ayarları
                      </button>
                      <button onMouseDown={logout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut className="w-4 h-4" />
                        Çıkış Yap
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={login}
                  className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                  <LogIn className="w-4 h-4" />
                  Giriş Yap
                </button>
              )}
            </div>

            {/* Hamburger - mobilde göster */}
            <button
              onClick={() => setMobileMenuAcik(v => !v)}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
              {mobileMenuAcik ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuAcik && (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <div className="max-w-[1400px] mx-auto px-4 py-3 space-y-1">

            {/* Mobil arama */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Hisse, döviz, kripto ara..."
                value={searchQuery}
                onChange={e => aramaYap(e.target.value)}
                onBlur={() => setTimeout(() => setAramaAcik(false), 150)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {aramaAcik && sonuclar.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                  {sonuclar.map(s => (
                    <button key={s.id} onMouseDown={() => sonucaTikla(s)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-blue-50 transition-colors">
                      <div className="text-left">
                        <div className="text-sm font-medium text-gray-900">{s.sembol}</div>
                        <div className="text-xs text-gray-500 truncate">{s.ad}</div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipRenk(s.tip)}`}>{s.tip}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Ana linkler */}
            {ANA_TABS.map(tab => (
              <Link key={tab.path} to={tab.path}
                className={`block px-4 py-2.5 text-sm rounded-lg transition-colors ${
                  location.pathname === tab.path
                    ? 'text-blue-600 bg-blue-50 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}>
                {tab.label}
              </Link>
            ))}

            {/* Araçlar bölümü */}
            <button
              onClick={() => setMobileAraclarAcik(v => !v)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm rounded-lg transition-colors ${
                araclarAktif ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-700 hover:bg-gray-50'
              }`}>
              Araçlar
              <ChevronDown className={`w-4 h-4 transition-transform ${mobileAraclarAcik ? 'rotate-180' : ''}`} />
            </button>

            {mobileAraclarAcik && (
              <div className="pl-4 space-y-1">
                {ARACLAR_MENU.map(item => {
                  const Icon = item.icon
                  return (
                    <Link key={item.path} to={item.path}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-colors ${
                        location.pathname === item.path
                          ? 'text-blue-600 bg-blue-50 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}>
                      <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Kullanıcı bölümü mobilde */}
            <div className="pt-2 border-t border-gray-100 mt-2">
              {isLoading ? (
                <div className="w-full h-10 rounded-lg bg-gray-100 animate-pulse" />
              ) : isAuthenticated ? (
                <>
                  <div className="px-4 py-2 mb-1">
                    <p className="text-xs font-medium text-gray-900 truncate">{userName}</p>
                    <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                  </div>
                  <Link to="/ayarlar"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <Settings className="w-4 h-4 text-gray-400" />
                    Bildirim Ayarları
                  </Link>
                  <button onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <LogOut className="w-4 h-4" />
                    Çıkış Yap
                  </button>
                </>
              ) : (
                <button onClick={() => { setMobileMenuAcik(false); login() }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                  <LogIn className="w-4 h-4" />
                  Giriş Yap
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
