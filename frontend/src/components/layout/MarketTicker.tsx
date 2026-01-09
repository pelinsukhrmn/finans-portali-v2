import { useEffect, useState } from 'react'
import { piyasaVerileri } from '../../services/api'
interface TickerItem { sembol: string; fiyat: number; degisimYuzde: number }
export default function MarketTicker() {
  const [items, setItems] = useState<TickerItem[]>([])
  const FALLBACK: TickerItem[] = [
    { sembol: 'USD/TRY', fiyat: 36.82,    degisimYuzde: -0.45 },
    { sembol: 'EUR/TRY', fiyat: 38.91,    degisimYuzde:  0.32 },
    { sembol: 'GBP/TRY', fiyat: 46.50,    degisimYuzde: -0.18 },
    { sembol: 'BTC/TRY', fiyat: 2345670,  degisimYuzde:  1.74 },
    { sembol: 'ETH/TRY', fiyat: 126400,   degisimYuzde: -0.58 },
    { sembol: 'THYAO',   fiyat: 307.50,   degisimYuzde:  3.82 },
    { sembol: 'GARAN',   fiyat: 124.50,   degisimYuzde:  2.15 },
    { sembol: 'ASELS',   fiyat: 87.20,    degisimYuzde:  2.41 },
    { sembol: 'KCHOL',   fiyat: 163.70,   degisimYuzde: -1.85 },
    { sembol: 'TUPRS',   fiyat: 198.40,   degisimYuzde: -2.76 },
    { sembol: 'BNB/TRY', fiyat: 23580,    degisimYuzde:  0.91 },
    { sembol: 'SOL/TRY', fiyat: 7840,     degisimYuzde:  1.23 },
  ]

  useEffect(() => {
    piyasaVerileri.guncel()
      .then(r => {
        const mapped = r.data.slice(0, 12).map((i: any) => ({
          sembol: i.sembol || '—',
          fiyat: Number(i.fiyat) || 0,
          degisimYuzde: Number(i.degisimYuzde) || 0,
        }))
        setItems(mapped.length > 0 ? mapped : FALLBACK)
      })
      .catch(() => setItems(FALLBACK))
  }, [])
  if (!items.length) return null
  return (
    <div className="bg-gray-50 border-b border-gray-200 overflow-hidden">
      <style>{`@keyframes tk{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}.tk{animation:tk 30s linear infinite}.tk:hover{animation-play-state:paused}`}</style>
      <div className="h-10 flex items-center">
        <div className="tk flex items-center gap-8 whitespace-nowrap">
          {[...items,...items].map((item,i)=>(
            <div key={i} className="flex items-center gap-2 shrink-0 text-sm">
              <span className="font-medium text-gray-700">{item.sembol}</span>
              <span className="text-gray-900">{item.fiyat.toLocaleString('tr-TR',{minimumFractionDigits:2})}</span>
              <span className={`font-medium ${item.degisimYuzde>=0?'text-green-600':'text-red-500'}`}>{item.degisimYuzde>=0?'+':''}{item.degisimYuzde}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
