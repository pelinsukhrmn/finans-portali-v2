import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Briefcase } from 'lucide-react'
import { portfoyler } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

interface Portfoy {
  id: number
  ad: string
  toplamDeger: number
  toplamMaliyet: number
  nominalGetiri: number
  nominalGetiriYuzde: number
  varlikSayisi: number
}

const fmt = (n: number, d = 2) =>
  n?.toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d }) ?? '—'

export default function PortfolioSummary() {
  const { userId, isAuthenticated } = useAuth()
  const [liste, setListe] = useState<Portfoy[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !userId) return
    setLoading(true)
    portfoyler.kullanicinin(userId)
      .then(r => setListe(r.data ?? []))
      .catch(() => setListe([]))
      .finally(() => setLoading(false))
  }, [userId, isAuthenticated])

  const toplamDeger   = liste.reduce((s, p) => s + (p.toplamDeger   ?? 0), 0)
  const toplamMaliyet = liste.reduce((s, p) => s + (p.toplamMaliyet ?? 0), 0)
  const toplamGetiri  = liste.reduce((s, p) => s + (p.nominalGetiri  ?? 0), 0)
  const getiriYuzde   = toplamMaliyet > 0 ? (toplamGetiri / toplamMaliyet) * 100 : 0
  const pozitif       = getiriYuzde >= 0

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Portföy Özeti</h3>
        <div className="text-center py-4 text-sm text-gray-400">
          Portföyünüzü görmek için giriş yapın.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-32 mb-4" />
        <div className="h-8 bg-gray-100 rounded w-24 mx-auto mb-2" />
        <div className="h-3 bg-gray-100 rounded w-20 mx-auto" />
      </div>
    )
  }

  if (liste.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Portföy Özeti</h3>
        <div className="text-center py-4">
          <Briefcase className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Henüz portföy oluşturulmadı.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Portföy Özeti</h3>
        <span className="text-xs text-gray-400">{liste.length} portföy</span>
      </div>

      {/* Toplam değer */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-1">Toplam Değer</p>
        <p className="text-2xl font-bold text-gray-900">₺{fmt(toplamDeger)}</p>
        <div className={`flex items-center gap-1 mt-1 text-sm font-medium ${pozitif ? 'text-green-600' : 'text-red-500'}`}>
          {pozitif ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          <span>{pozitif ? '+' : ''}₺{fmt(toplamGetiri)}</span>
          <span className="text-xs">({pozitif ? '+' : ''}{fmt(getiriYuzde)}%)</span>
        </div>
      </div>

      {/* Maliyet */}
      <div className="flex justify-between text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
        <span>Toplam Maliyet</span>
        <span className="font-medium text-gray-700">₺{fmt(toplamMaliyet)}</span>
      </div>

      {/* Portföy listesi */}
      <div className="space-y-2">
        {liste.map(p => {
          const poz = (p.nominalGetiriYuzde ?? 0) >= 0
          return (
            <div key={p.id} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2 min-w-0">
                <Briefcase className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                <span className="text-xs text-gray-700 truncate max-w-[100px]">{p.ad}</span>
                <span className="text-xs text-gray-400">{p.varlikSayisi} varlık</span>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs font-semibold text-gray-900">₺{fmt(p.toplamDeger)}</div>
                <div className={`text-xs ${poz ? 'text-green-600' : 'text-red-500'}`}>
                  {poz ? '+' : ''}{fmt(p.nominalGetiriYuzde)}%
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
