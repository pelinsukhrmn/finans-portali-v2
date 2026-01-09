import { useEffect, useRef, useState } from 'react'
import { Bell, BrainCircuit, CheckCheck, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { bildirimler } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

interface Bildirim {
  id: number
  mesaj: string
  haberBaslik: string
  etkilenenSemboller: string
  etkiYonu: 'POZITIF' | 'NEGATIF' | 'KARISIK'
  okundu: boolean
  olusturmaTarihi: string
}

function EtkiIkon({ yon }: { yon: string }) {
  if (yon === 'POZITIF') return <TrendingUp className="w-3.5 h-3.5 text-green-500 shrink-0" />
  if (yon === 'NEGATIF') return <TrendingDown className="w-3.5 h-3.5 text-red-500 shrink-0" />
  return <Minus className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
}

export default function NotificationBell() {
  const { isAuthenticated, userId } = useAuth()
  const navigate = useNavigate()
  const [acik, setAcik] = useState(false)
  const [liste, setListe] = useState<Bildirim[]>([])
  const [okunmamisSayi, setOkunmamisSayi] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  const sayi = async () => {
    if (!userId) return
    try {
      const r = await bildirimler.okunmamisSayi(userId)
      setOkunmamisSayi(r.data.sayi)
    } catch { /* silent */ }
  }

  useEffect(() => {
    if (!isAuthenticated || !userId) return
    sayi()
    const id = setInterval(sayi, 60_000)
    return () => clearInterval(id)
  }, [isAuthenticated, userId])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAcik(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const ac = async () => {
    if (!userId) return
    setAcik(!acik)
    if (!acik) {
      try {
        const r = await bildirimler.listele(userId, 10)
        setListe(r.data)
        if (okunmamisSayi > 0) {
          await bildirimler.hepsiniOkundu(userId)
          setOkunmamisSayi(0)
        }
      } catch { /* silent */ }
    }
  }

  const tarihFmt = (s: string) => {
    const d = new Date(s)
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  if (!isAuthenticated) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={ac}
        className="relative p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        title="AI Haber Bildirimleri"
      >
        <Bell className="w-5 h-5" />
        {okunmamisSayi > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {okunmamisSayi > 9 ? '9+' : okunmamisSayi}
          </span>
        )}
      </button>

      {acik && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-900">AI Haber Analizi</span>
            </div>
            <button
              onClick={() => { setAcik(false); navigate('/ayarlar') }}
              className="text-xs text-blue-600 hover:underline"
            >
              Ayarlar
            </button>
          </div>

          {liste.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <CheckCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Henüz bildirim yok.</p>
              <p className="text-xs text-gray-400 mt-1">
                AI haberleri portföyünüzle karşılaştırarak sizi uyarır.
              </p>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50">
              {liste.map(b => (
                <div key={b.id} className={`px-4 py-3 ${b.okundu ? 'bg-white' : 'bg-blue-50/40'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <EtkiIkon yon={b.etkiYonu} />
                      <p className="text-xs font-semibold text-gray-800 line-clamp-1">{b.haberBaslik}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                      {tarihFmt(b.olusturmaTarihi)}
                    </span>
                  </div>
                  {b.etkilenenSemboller && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {b.etkilenenSemboller.split(',').map(s => {
                        const color = b.etkiYonu === 'POZITIF'
                          ? 'bg-green-100 text-green-700'
                          : b.etkiYonu === 'NEGATIF'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-yellow-100 text-yellow-700'
                        return (
                          <span key={s} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${color}`}>
                            {s.trim()}
                          </span>
                        )
                      })}
                    </div>
                  )}
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{b.mesaj}</p>
                </div>
              ))}
            </div>
          )}

          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
            <button
              onClick={() => { setAcik(false); navigate('/ayarlar') }}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Tüm bildirimleri gör / ayarları yönet
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
