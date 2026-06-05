import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { piyasaVerileri } from '../../services/api'

interface Gosterge {
  label: string
  deger: string
  degisim: number
  birim?: string
}

const DEMO: Gosterge[] = [
  { label: 'BIST 100',  deger: '11.452',   degisim:  0.82 },
  { label: 'USD/TRY',   deger: '36,82',     degisim: -0.45 },
  { label: 'EUR/TRY',   deger: '38,91',     degisim:  0.32 },
  { label: 'Altın/TRY', deger: '2.458',    degisim:  1.12, birim: '₺/gr' },
  { label: 'BTC/TRY',   deger: '2.345.670', degisim:  1.74 },
  { label: 'ETH/TRY',   deger: '126.400',   degisim: -0.58 },
]

const BIST_DEMO_ID = 1

export default function MarketSummaryBar() {
  const [gostergeler, setGostergeler] = useState<Gosterge[]>(DEMO)

  useEffect(() => {
    piyasaVerileri.guncel()
      .then(r => {
        if (!r.data?.length) return
        const map: Record<number, any> = {}
        r.data.forEach((d: any) => { map[d.yatirimAraciId] = d })
        // Enrich BIST 100 entry if data available
        const bist = map[BIST_DEMO_ID]
        if (bist) {
          setGostergeler(prev => prev.map(g =>
            g.label === 'BIST 100'
              ? { ...g, deger: Number(bist.fiyat).toLocaleString('tr-TR', { maximumFractionDigits: 0 }), degisim: Number(bist.degisimYuzde ?? 0) }
              : g
          ))
        }
      })
      .catch(() => {})
  }, [])

  const now = new Date()
  const saat = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  const tr = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }))
  const gun = tr.getDay()
  const dakika = tr.getHours() * 60 + tr.getMinutes()
  const piyasaAcik = gun >= 1 && gun <= 5 && dakika >= 10 * 60 && dakika < 18 * 60

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-5">
      <div className="flex items-center gap-4 overflow-x-auto scrollbar-none">
        {/* Market status */}
        <div className="flex items-center gap-2 shrink-0 pr-4 border-r border-gray-100">
          <Activity className={`w-3.5 h-3.5 ${piyasaAcik ? 'text-green-500' : 'text-gray-400'}`} />
          <span className={`text-xs font-semibold ${piyasaAcik ? 'text-green-700' : 'text-gray-500'}`}>
            {piyasaAcik ? 'Piyasa Açık' : 'Piyasa Kapalı'}
          </span>
          <span className="text-xs text-gray-400">{saat}</span>
        </div>

        {/* Indicators */}
        <div className="flex items-center gap-5 overflow-x-auto scrollbar-none">
          {gostergeler.map(g => {
            const poz = g.degisim >= 0
            return (
              <div key={g.label} className="flex items-center gap-2.5 shrink-0">
                <span className="text-xs text-gray-500 font-medium">{g.label}</span>
                <span className="text-sm font-bold text-gray-900">{g.deger}</span>
                <span className={`flex items-center gap-0.5 text-xs font-semibold ${poz ? 'text-green-600' : 'text-red-500'}`}>
                  {poz ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {poz ? '+' : ''}{g.degisim.toFixed(2)}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
