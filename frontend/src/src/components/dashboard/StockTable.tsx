import { useEffect, useState } from 'react'
import { yatirimAraclari, piyasaVerileri } from '../../services/api'

interface Hisse { id: number; sembol: string; ad: string }
interface Fiyat { yatirimAraciId: number; fiyat: number; degisimYuzde: number | null }

export default function StockTable() {
  const [hisseler, setHisseler] = useState<Hisse[]>([])
  const [fiyatlar, setFiyatlar] = useState<Map<number,Fiyat>>(new Map())
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'HISSE'|'DOVIZ'|'KRIPTO'>('HISSE')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      yatirimAraclari.tipeGore(tab),
      piyasaVerileri.guncel(),
    ]).then(([ar, fr]) => {
      setHisseler(ar.data.slice(0, 15))
      const m = new Map<number, Fiyat>()
      fr.data.forEach((f: any) => m.set(f.yatirimAraciId, f))
      setFiyatlar(m)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [tab])

  const fmt = (f: number) => f >= 100 
    ? f.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : f.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Piyasa</h2>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(['HISSE','DOVIZ','KRIPTO'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-1 text-xs rounded-md transition-colors ${tab===t?'bg-white text-gray-900 shadow-sm font-medium':'text-gray-500 hover:text-gray-700'}`}>
              {t==='HISSE'?'Hisseler':t==='DOVIZ'?'Döviz':'Kripto'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 font-medium">Sembol</th>
              <th className="px-4 py-3 font-medium">Ad</th>
              <th className="px-4 py-3 font-medium text-right">Fiyat</th>
              <th className="px-4 py-3 font-medium text-right">Değişim</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(8)].map((_,i) => (
                <tr key={i}><td colSpan={4} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse"/></td></tr>
              ))
            ) : hisseler.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">Veri yükleniyor...</td></tr>
            ) : hisseler.map(h => {
              const f = fiyatlar.get(h.id)
              const poz = (f?.degisimYuzde ?? 0) >= 0
              return (
                <tr key={h.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3"><span className="text-blue-600 font-medium text-sm">{h.sembol}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-700 truncate max-w-[200px]">{h.ad}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                    {f ? `₺${fmt(f.fiyat)}` : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {f?.degisimYuzde != null ? (
                      <span className={`text-xs font-medium ${poz?'text-green-600':'text-red-500'}`}>
                        {poz?'+':''}{f.degisimYuzde.toFixed(2)}%
                      </span>
                    ) : <span className="text-xs text-gray-400">—</span>}
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
