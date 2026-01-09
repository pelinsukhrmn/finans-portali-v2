import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { piyasaVerileri } from '../../services/api'

interface TrendItem {
  sembol: string
  fiyat: number
  degisimYuzde: number | null
}

export default function MarketTrends() {
  const [yukselenler, setYukselenler] = useState<TrendItem[]>([])
  const [dusenler, setDusenler] = useState<TrendItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      piyasaVerileri.yukselen(5),
      piyasaVerileri.dusen(5),
    ]).then(([y, d]) => {
      setYukselenler(y.data.map((i: any) => ({ sembol: i.sembol, fiyat: i.fiyat, degisimYuzde: i.degisimYuzde })))
      setDusenler(d.data.map((i: any) => ({ sembol: i.sembol, fiyat: i.fiyat, degisimYuzde: i.degisimYuzde })))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const TrendListesi = ({ items, renk }: { items: TrendItem[], renk: 'green' | 'red' }) => (
    <div className="space-y-2">
      {loading ? (
        <div className="animate-pulse space-y-2">{[...Array(3)].map((_,i) => <div key={i} className="h-6 bg-gray-100 rounded"/>)}</div>
      ) : items.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-2">Veri bekleniyor...</p>
      ) : items.map(item => (
        <div key={item.sembol} className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">{item.sembol}</span>
          <div className="text-right">
            <span className="text-xs text-gray-500 mr-2">
              {item.fiyat?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </span>
            <span className={`text-xs font-medium ${renk === 'green' ? 'text-green-600' : 'text-red-500'}`}>
              {renk === 'green' ? '+' : ''}{item.degisimYuzde?.toFixed(2)}%
            </span>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-600"/>En Çok Yükselenler
        </h3>
        <TrendListesi items={yukselenler} renk="green" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-red-500"/>En Çok Düşenler
        </h3>
        <TrendListesi items={dusenler} renk="red" />
      </div>
    </div>
  )
}
