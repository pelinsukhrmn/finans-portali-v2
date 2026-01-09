import { useEffect, useState } from 'react'
import { yatirimAraclari, piyasaVerileri } from '../../services/api'

interface Hisse { id: number; sembol: string; ad: string }
interface FiyatVerisi { yatirimAraciId: number; fiyat: number; degisimYuzde: number | null }

export default function StockTable() {
  const [hisseler, setHisseler] = useState<Hisse[]>([])
  const [fiyatlar, setFiyatlar] = useState<Map<number, FiyatVerisi>>(new Map())
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'HISSE' | 'DOVIZ' | 'KRIPTO'>('HISSE')

  useEffect(() => {
    setLoading(true)
    Promise.all([yatirimAraclari.tipeGore(tab), piyasaVerileri.guncel()])
      .then(([ar, fr]) => {
        setHisseler(ar.data.slice(0, 15))
        const m = new Map<number, FiyatVerisi>()
        fr.data.forEach((f: any) => m.set(f.yatirimAraciId, f))
        setFiyatlar(m)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [tab])

  const fmt = (f: number) =>
    f >= 100000
      ? f.toLocaleString('tr-TR', { maximumFractionDigits: 0 })
      : f >= 1
      ? f.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
      : f.toLocaleString('tr-TR', { minimumFractionDigits: 4, maximumFractionDigits: 6 })

  if (loading) return (
    <div className="animate-pulse space-y-3">
      {[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Piyasa</h2>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(['HISSE', 'DOVIZ', 'KRIPTO'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                tab === t ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'HISSE' ? 'Hisseler' : t === 'DOVIZ' ? 'Döviz' : 'Kripto'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3">Sembol</th>
              <th className="px-4 py-3">Ad</th>
              <th className="px-4 py-3 text-right">Fiyat</th>
              <th className="px-4 py-3 text-right">Değişim</th>
            </tr>
          </thead>
          <tbody>
            {hisseler.map((h) => {
              const f = fiyatlar.get(h.id)
              const deg = f ? Number(f.degisimYuzde) : null
              return (
                <tr key={h.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-blue-600 font-medium text-sm">{h.sembol}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-[160px] truncate">{h.ad}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                    {f ? `₺${fmt(Number(f.fiyat))}` : '—'}
                  </td>
                  <td className={`px-4 py-3 text-xs text-right font-semibold ${
                    deg === null   ? 'text-gray-400'
                    : deg > 0     ? 'text-green-600'
                    : deg < 0     ? 'text-red-500'
                    : 'text-gray-400'
                  }`}>
                    {deg !== null ? `${deg > 0 ? '+' : ''}${deg.toFixed(2)}%` : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
