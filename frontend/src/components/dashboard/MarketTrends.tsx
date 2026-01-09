import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { piyasaVerileri } from '../../services/api'

interface Veri {
  sembol: string
  fiyat: number
  degisimYuzde: number
}

const DEMO_YUKSELEN: Veri[] = [
  { sembol: 'THYAO',   fiyat: 307.50,    degisimYuzde:  3.82 },
  { sembol: 'ASELS',   fiyat: 87.20,     degisimYuzde:  2.41 },
  { sembol: 'GARAN',   fiyat: 124.50,    degisimYuzde:  2.15 },
  { sembol: 'BTC/TRY', fiyat: 2345670,   degisimYuzde:  1.74 },
  { sembol: 'BIMAS',   fiyat: 412.00,    degisimYuzde:  1.42 },
]

const DEMO_DUSEN: Veri[] = [
  { sembol: 'TUPRS',   fiyat: 198.40,    degisimYuzde: -2.76 },
  { sembol: 'KCHOL',   fiyat: 163.70,    degisimYuzde: -1.85 },
  { sembol: 'EUR/TRY', fiyat: 38.91,     degisimYuzde: -0.72 },
  { sembol: 'ETH/TRY', fiyat: 126400,    degisimYuzde: -0.58 },
  { sembol: 'FROTO',   fiyat: 1120.50,   degisimYuzde: -0.43 },
]

function Satir({ item }: { item: Veri }) {
  const yukseldi = item.degisimYuzde >= 0
  const fmtFiyat = item.fiyat >= 100000
    ? item.fiyat.toLocaleString('tr-TR', { maximumFractionDigits: 0 })
    : item.fiyat >= 1
    ? item.fiyat.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : item.fiyat.toLocaleString('tr-TR', { minimumFractionDigits: 4 })

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm font-medium text-gray-800">{item.sembol}</span>
      <div className="text-right">
        <div className="text-xs text-gray-500">₺{fmtFiyat}</div>
        <div className={`text-xs font-semibold ${yukseldi ? 'text-green-600' : 'text-red-500'}`}>
          {yukseldi ? '+' : ''}{item.degisimYuzde.toFixed(2)}%
        </div>
      </div>
    </div>
  )
}

export default function MarketTrends() {
  const [yukselen, setYukselen] = useState<Veri[]>(DEMO_YUKSELEN)
  const [dusen, setDusen] = useState<Veri[]>(DEMO_DUSEN)

  useEffect(() => {
    const toVeri = (d: any): Veri => ({
      sembol: d.sembol ?? '—',
      fiyat: Number(d.fiyat ?? 0),
      degisimYuzde: Number(d.degisimYuzde ?? 0),
    })

    Promise.all([piyasaVerileri.yukselen(5), piyasaVerileri.dusen(5)])
      .then(([yukRes, dusRes]) => {
        if (yukRes.data?.length > 0) setYukselen(yukRes.data.map(toVeri))
        if (dusRes.data?.length > 0) setDusen(dusRes.data.map(toVeri))
      })
      .catch(() => {
        // fallback to demo data (already set as initial state)
      })
  }, [])

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-600" />
          En Çok Yükselenler
        </h3>
        {yukselen.map((item) => <Satir key={item.sembol} item={item} />)}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-red-500" />
          En Çok Düşenler
        </h3>
        {dusen.map((item) => <Satir key={item.sembol} item={item} />)}
      </div>
    </div>
  )
}
