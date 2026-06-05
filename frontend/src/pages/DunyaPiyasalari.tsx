import { useEffect, useState } from 'react'
import { Globe, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'

interface Endeks {
  sembol: string
  ad: string
  bolge: string
  ulke: string
  bayrak: string
  deger: number
  gunlukDegisim: number
  gunlukDegisimYuzde: number
  acikMi: boolean
}

type Bolge = 'TUMU' | 'AMERIKA' | 'AVRUPA' | 'ASYA_PASIFIK' | 'ORTA_DOGU_AFRIKA'

const BOLGE_LABEL: Record<Bolge, string> = {
  TUMU: 'Tüm Bölgeler',
  AMERIKA: 'Amerika',
  AVRUPA: 'Avrupa',
  ASYA_PASIFIK: 'Asya-Pasifik',
  ORTA_DOGU_AFRIKA: 'Orta Doğu & Afrika',
}

const DEMO_ENDEKSLER: Endeks[] = [
  // Amerika
  { sembol: 'S&P 500',   ad: 'S&P 500',              bolge: 'AMERIKA',          ulke: 'ABD',        bayrak: '🇺🇸', deger: 5248.32, gunlukDegisim:  42.18, gunlukDegisimYuzde:  0.81, acikMi: false },
  { sembol: 'NASDAQ',    ad: 'NASDAQ Composite',      bolge: 'AMERIKA',          ulke: 'ABD',        bayrak: '🇺🇸', deger: 16428.82, gunlukDegisim: -28.50, gunlukDegisimYuzde: -0.17, acikMi: false },
  { sembol: 'DJIA',      ad: 'Dow Jones',             bolge: 'AMERIKA',          ulke: 'ABD',        bayrak: '🇺🇸', deger: 38852.86, gunlukDegisim:  126.60, gunlukDegisimYuzde:  0.33, acikMi: false },
  { sembol: 'BOVESPA',   ad: 'Bovespa',               bolge: 'AMERIKA',          ulke: 'Brezilya',   bayrak: '🇧🇷', deger: 126440.00, gunlukDegisim: -380.00, gunlukDegisimYuzde: -0.30, acikMi: false },
  { sembol: 'TSX',       ad: 'S&P/TSX Composite',     bolge: 'AMERIKA',          ulke: 'Kanada',     bayrak: '🇨🇦', deger: 21842.00, gunlukDegisim:  84.20, gunlukDegisimYuzde:  0.39, acikMi: false },
  // Avrupa
  { sembol: 'FTSE 100',  ad: 'FTSE 100',              bolge: 'AVRUPA',           ulke: 'İngiltere',  bayrak: '🇬🇧', deger: 8278.52, gunlukDegisim:  22.40, gunlukDegisimYuzde:  0.27, acikMi: true  },
  { sembol: 'DAX',       ad: 'DAX 40',                bolge: 'AVRUPA',           ulke: 'Almanya',    bayrak: '🇩🇪', deger: 18498.64, gunlukDegisim: -56.20, gunlukDegisimYuzde: -0.30, acikMi: true  },
  { sembol: 'CAC 40',    ad: 'CAC 40',                bolge: 'AVRUPA',           ulke: 'Fransa',     bayrak: '🇫🇷', deger: 8022.41, gunlukDegisim:  18.60, gunlukDegisimYuzde:  0.23, acikMi: true  },
  { sembol: 'AEX',       ad: 'AEX',                   bolge: 'AVRUPA',           ulke: 'Hollanda',   bayrak: '🇳🇱', deger: 872.48, gunlukDegisim:   3.12, gunlukDegisimYuzde:  0.36, acikMi: true  },
  { sembol: 'IBEX 35',   ad: 'IBEX 35',               bolge: 'AVRUPA',           ulke: 'İspanya',    bayrak: '🇪🇸', deger: 11248.60, gunlukDegisim: -42.30, gunlukDegisimYuzde: -0.37, acikMi: true  },
  { sembol: 'SMI',       ad: 'Swiss Market Index',    bolge: 'AVRUPA',           ulke: 'İsviçre',    bayrak: '🇨🇭', deger: 11842.00, gunlukDegisim:  28.50, gunlukDegisimYuzde:  0.24, acikMi: true  },
  { sembol: 'BIST 100',  ad: 'BIST 100',              bolge: 'AVRUPA',           ulke: 'Türkiye',    bayrak: '🇹🇷', deger: 9812.44, gunlukDegisim:  124.80, gunlukDegisimYuzde:  1.29, acikMi: true  },
  // Asya-Pasifik
  { sembol: 'Nikkei 225',ad: 'Nikkei 225',            bolge: 'ASYA_PASIFIK',     ulke: 'Japonya',    bayrak: '🇯🇵', deger: 38648.24, gunlukDegisim:  248.60, gunlukDegisimYuzde:  0.65, acikMi: false },
  { sembol: 'Hang Seng', ad: 'Hang Seng',             bolge: 'ASYA_PASIFIK',     ulke: 'Hong Kong',  bayrak: '🇭🇰', deger: 18824.52, gunlukDegisim: -186.40, gunlukDegisimYuzde: -0.98, acikMi: false },
  { sembol: 'SSE',       ad: 'Shanghai Composite',    bolge: 'ASYA_PASIFIK',     ulke: 'Çin',        bayrak: '🇨🇳', deger: 3124.68, gunlukDegisim:   12.42, gunlukDegisimYuzde:  0.40, acikMi: false },
  { sembol: 'ASX 200',   ad: 'S&P/ASX 200',           bolge: 'ASYA_PASIFIK',     ulke: 'Avustralya', bayrak: '🇦🇺', deger: 7784.80, gunlukDegisim:   32.60, gunlukDegisimYuzde:  0.42, acikMi: false },
  { sembol: 'KOSPI',     ad: 'KOSPI',                 bolge: 'ASYA_PASIFIK',     ulke: 'Güney Kore', bayrak: '🇰🇷', deger: 2724.62, gunlukDegisim:  -18.40, gunlukDegisimYuzde: -0.67, acikMi: false },
  { sembol: 'Sensex',    ad: 'BSE Sensex',            bolge: 'ASYA_PASIFIK',     ulke: 'Hindistan',  bayrak: '🇮🇳', deger: 72824.46, gunlukDegisim:  342.80, gunlukDegisimYuzde:  0.47, acikMi: false },
  // Orta Doğu & Afrika
  { sembol: 'Tadawul',   ad: 'Saudi Stock Exchange',  bolge: 'ORTA_DOGU_AFRIKA', ulke: 'S. Arabistan',bayrak: '🇸🇦', deger: 11842.64, gunlukDegisim:  86.40, gunlukDegisimYuzde:  0.73, acikMi: true  },
  { sembol: 'DFM',       ad: 'Dubai Financial Market',bolge: 'ORTA_DOGU_AFRIKA', ulke: 'BAE',        bayrak: '🇦🇪', deger: 4248.32, gunlukDegisim:  -28.60, gunlukDegisimYuzde: -0.67, acikMi: true  },
  { sembol: 'EGX 30',    ad: 'EGX 30',                bolge: 'ORTA_DOGU_AFRIKA', ulke: 'Mısır',      bayrak: '🇪🇬', deger: 24682.40, gunlukDegisim:  248.60, gunlukDegisimYuzde:  1.02, acikMi: true  },
  { sembol: 'JSE',       ad: 'JSE All Share',         bolge: 'ORTA_DOGU_AFRIKA', ulke: 'G. Afrika',  bayrak: '🇿🇦', deger: 76842.00, gunlukDegisim: -312.40, gunlukDegisimYuzde: -0.41, acikMi: false },
]

function kucukDegisimEkle(endeksler: Endeks[]): Endeks[] {
  return endeksler.map(e => ({
    ...e,
    deger: parseFloat((e.deger * (1 + (Math.random() - 0.5) * 0.002)).toFixed(2)),
    gunlukDegisim: parseFloat((e.gunlukDegisim + (Math.random() - 0.5) * 2).toFixed(2)),
    gunlukDegisimYuzde: parseFloat((e.gunlukDegisimYuzde + (Math.random() - 0.5) * 0.05).toFixed(2)),
  }))
}

export default function DunyaPiyasalari() {
  const [endeksler, setEndeksler] = useState<Endeks[]>(DEMO_ENDEKSLER)
  const [seciliBolge, setSeciliBolge] = useState<Bolge>('TUMU')
  const [sonGuncelleme, setSonGuncelleme] = useState(new Date())
  const [yukleniyor, setYukleniyor] = useState(false)

  const yenile = () => {
    setYukleniyor(true)
    setTimeout(() => {
      setEndeksler(kucukDegisimEkle(DEMO_ENDEKSLER))
      setSonGuncelleme(new Date())
      setYukleniyor(false)
    }, 600)
  }

  useEffect(() => {
    const interval = setInterval(yenile, 30000)
    return () => clearInterval(interval)
  }, [])

  const filtreliEndeksler = seciliBolge === 'TUMU'
    ? endeksler
    : endeksler.filter(e => e.bolge === seciliBolge)

  const yukselenler = endeksler.filter(e => e.gunlukDegisimYuzde > 0).length
  const dusenler    = endeksler.filter(e => e.gunlukDegisimYuzde < 0).length
  const globalSkor  = Math.round((yukselenler / endeksler.length) * 100)

  const bolgeOzeti = (bolge: string) => {
    const b = endeksler.filter(e => e.bolge === bolge)
    const yuk = b.filter(e => e.gunlukDegisimYuzde > 0).length
    const avgDeg = b.reduce((s, e) => s + e.gunlukDegisimYuzde, 0) / b.length
    return { yuk, toplam: b.length, avgDeg }
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-6">
      {/* Başlık */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-900">Dünya Piyasaları</h1>
          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">Demo verisi</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            Son güncelleme: {sonGuncelleme.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button onClick={yenile} disabled={yukleniyor}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${yukleniyor ? 'animate-spin' : ''}`} />
            Yenile
          </button>
        </div>
      </div>

      {/* Global Özet */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 col-span-1">
          <p className="text-xs text-gray-500 mb-2">Global Alış Skoru</p>
          <div className="flex items-end gap-2">
            <span className={`text-3xl font-bold ${globalSkor >= 50 ? 'text-green-600' : 'text-red-500'}`}>{globalSkor}</span>
            <span className="text-sm text-gray-400 mb-1">/100</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
            <div className={`h-1.5 rounded-full ${globalSkor >= 50 ? 'bg-green-500' : 'bg-red-400'}`}
              style={{ width: `${globalSkor}%` }} />
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-green-500" />
          <div>
            <p className="text-xs text-green-600">Yükselen</p>
            <p className="text-2xl font-bold text-green-700">{yukselenler}</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <TrendingDown className="w-8 h-8 text-red-400" />
          <div>
            <p className="text-xs text-red-500">Düşen</p>
            <p className="text-2xl font-bold text-red-600">{dusenler}</p>
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Toplam Endeks</p>
          <p className="text-2xl font-bold text-gray-800">{endeksler.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">4 bölge</p>
        </div>
      </div>

      {/* Bölge Özet Kartları */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {(['AMERIKA', 'AVRUPA', 'ASYA_PASIFIK', 'ORTA_DOGU_AFRIKA'] as Bolge[]).map(b => {
          const ozet = bolgeOzeti(b)
          return (
            <button key={b} onClick={() => setSeciliBolge(seciliBolge === b ? 'TUMU' : b)}
              className={`text-left p-4 rounded-xl border transition-all ${
                seciliBolge === b
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/40'
              }`}>
              <p className="text-xs font-medium text-gray-700 mb-2">{BOLGE_LABEL[b]}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-600">↑ {ozet.yuk}/{ozet.toplam}</span>
                <span className={`text-xs font-semibold ${ozet.avgDeg >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {ozet.avgDeg >= 0 ? '+' : ''}{ozet.avgDeg.toFixed(2)}%
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Filtre */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(Object.keys(BOLGE_LABEL) as Bolge[]).map(b => (
          <button key={b} onClick={() => setSeciliBolge(b)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              seciliBolge === b
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {BOLGE_LABEL[b]}
          </button>
        ))}
      </div>

      {/* Endeks Tablosu */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500">
          <div className="col-span-4">Endeks</div>
          <div className="col-span-2">Bölge</div>
          <div className="col-span-2 text-right">Değer</div>
          <div className="col-span-2 text-right">Günlük Değişim</div>
          <div className="col-span-1 text-center">Durum</div>
          <div className="col-span-1 text-center">Trend</div>
        </div>

        {filtreliEndeksler.map((e, i) => (
          <div key={e.sembol}
            className={`grid grid-cols-12 px-4 py-3 items-center text-sm border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
            <div className="col-span-4 flex items-center gap-3">
              <span className="text-lg">{e.bayrak}</span>
              <div>
                <div className="font-semibold text-gray-900">{e.sembol}</div>
                <div className="text-xs text-gray-500">{e.ulke}</div>
              </div>
            </div>
            <div className="col-span-2 text-xs text-gray-500">{BOLGE_LABEL[e.bolge as Bolge]}</div>
            <div className="col-span-2 text-right font-mono font-medium text-gray-900">
              {e.deger.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </div>
            <div className={`col-span-2 text-right font-medium ${e.gunlukDegisimYuzde >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              <div>{e.gunlukDegisim >= 0 ? '+' : ''}{e.gunlukDegisim.toFixed(2)}</div>
              <div className="text-xs">{e.gunlukDegisimYuzde >= 0 ? '+' : ''}{e.gunlukDegisimYuzde.toFixed(2)}%</div>
            </div>
            <div className="col-span-1 text-center">
              <span className={`text-xs px-2 py-0.5 rounded-full ${e.acikMi ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {e.acikMi ? 'Açık' : 'Kapalı'}
              </span>
            </div>
            <div className="col-span-1 flex justify-center">
              {e.gunlukDegisimYuzde >= 0
                ? <TrendingUp className="w-4 h-4 text-green-500" />
                : <TrendingDown className="w-4 h-4 text-red-400" />}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-3 text-center">
        * Veriler demo amaçlıdır, gerçek piyasa verilerini yansıtmaz.
      </p>
    </div>
  )
}
