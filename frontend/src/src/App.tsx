import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import MarketTicker from './components/layout/MarketTicker'
import Dashboard from './pages/Dashboard'
import PiyasaVerileri from './pages/PiyasaVerileri'
import Haberler from './pages/Haberler'
import Portfoy from './pages/Portfoy'
import Analiz from './pages/Analiz'
import { useAuth } from './context/AuthContext'

// Giriş gerektiren sayfa wrapper'ı
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, login } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-gray-500">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Giriş Gerekli</h2>
          <p className="text-sm text-gray-500 mb-6">Bu sayfayı görüntülemek için giriş yapmanız gerekiyor.</p>
          <button
            onClick={login}
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Giriş Yap
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <MarketTicker />
        <Routes>
          {/* Public sayfalar */}
          <Route path="/"         element={<Dashboard />} />
          <Route path="/piyasa"   element={<PiyasaVerileri />} />
          <Route path="/analiz"   element={<Analiz />} />
          <Route path="/haberler" element={<Haberler />} />

          {/* Korumalı sayfalar */}
          <Route path="/portfoy" element={
            <ProtectedRoute>
              <Portfoy />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
