import { useEffect, useState, useMemo } from 'react'
import { yatirimAraclari, piyasaVerileri, takipListesi } from '../services/api'
import { Search, TrendingUp, TrendingDown, ArrowUpDown, BarChart2, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface Araci { id: number; sembol: string; ad: string; tip: string }
interface FiyatVerisi { yatirimAraciId: number; fiyat: number; degisimYuzde: number | null }

const DEMO_ARACLARI: Record<string, Araci[]> = {
  HISSE: [
    { id:1, sembol:'THYAO', ad:'Türk Hava Yolları', tip:'HISSE' },
    { id:2, sembol:'GARAN', ad:'Garanti BBVA', tip:'HISSE' },
    { id:3, sembol:'ASELS', ad:'Aselsan', tip:'HISSE' },
    { id:4, sembol:'KCHOL', ad:'Koç Holding', tip:'HISSE' },
    { id:5, sembol:'BIMAS', ad:'BİM Mağazalar', tip:'HISSE' },
    { id:6, sembol:'AKBNK', ad:'Akbank', tip:'HISSE' },
    { id:7, sembol:'TUPRS', ad:'Tüpraş', tip:'HISSE' },
    { id:8, sembol:'PGSUS', ad:'Pegasus', tip:'HISSE' },
    { id:9, sembol:'EREGL', ad:'Ereğli Demir Çelik', tip:'HISSE' },
    { id:10, sembol:'FROTO', ad:'Ford Otosan', tip:'HISSE' },
  ],
  DOVIZ: [
    { id:11, sembol:'USD/TRY', ad:'Amerikan Doları / Türk Lirası', tip:'DOVIZ' },
    { id:12, sembol:'EUR/TRY', ad:'Euro / Türk Lirası', tip:'DOVIZ' },
    { id:13, sembol:'GBP/TRY', ad:'İngiliz Sterlini / Türk Lirası', tip:'DOVIZ' },
    { id:14, sembol:'JPY/TRY', ad:'Japon Yeni / Türk Lirası', tip:'DOVIZ' },
    { id:15, sembol:'CHF/TRY', ad:'İsviçre Frangı / Türk Lirası', tip:'DOVIZ' },
  ],
  KRIPTO: [
    { id:16, sembol:'BTC/TRY', ad:'Bitcoin', tip:'KRIPTO' },
    { id:17, sembol:'ETH/TRY', ad:'Ethereum', tip:'KRIPTO' },
    { id:18, sembol:'BNB/TRY', ad:'BNB', tip:'KRIPTO' },
    { id:19, sembol:'XRP/TRY', ad:'XRP', tip:'KRIPTO' },
    { id:20, sembol:'SOL/TRY', ad:'Solana', tip:'KRIPTO' },
  ],
}

interface ExtraData {
  fiyat: number
  degisimYuzde: number
  gunlukYuksek: number
  gunlukDusuk: number
  hacim: string
  piyasaDegeri?: string
}

const DEMO_FIYATLAR: Record<string, ExtraData> = {
  'THYAO':   { fiyat:307.50,    degisimYuzde: 3.82,  gunlukYuksek:312.00, gunlukDusuk:298.40, hacim:'1.24 Mn',  piyasaDegeri:'142.5 Mr' },
  'GARAN':   { fiyat:124.50,    degisimYuzde: 2.15,  gunlukYuksek:126.80, gunlukDusuk:121.60, hacim:'2.85 Mn',  piyasaDegeri:'210.3 Mr' },
  'ASELS':   { fiyat: 87.20,    degisimYuzde: 2.41,  gunlukYuksek: 88.90, gunlukDusuk: 85.10, hacim:'0.93 Mn',  piyasaDegeri:'87.2 Mr' },
  'KCHOL':   { fiyat:163.70,    degisimYuzde:-1.85,  gunlukYuksek:168.50, gunlukDusuk:161.20, hacim:'0.72 Mn',  piyasaDegeri:'430.5 Mr' },
  'BIMAS':   { fiyat:412.00,    degisimYuzde: 1.42,  gunlukYuksek:415.50, gunlukDusuk:406.00, hacim:'0.38 Mn',  piyasaDegeri:'96.4 Mr' },
  'AKBNK':   { fiyat: 72.60,    degisimYuzde: 0.87,  gunlukYuksek: 73.90, gunlukDusuk: 71.80, hacim:'3.51 Mn',  piyasaDegeri:'290.4 Mr' },
  'TUPRS':   { fiyat:198.40,    degisimYuzde:-2.76,  gunlukYuksek:205.00, gunlukDusuk:196.80, hacim:'0.64 Mn',  piyasaDegeri:'78.8 Mr' },
  'PGSUS':   { fiyat:621.00,    degisimYuzde: 1.05,  gunlukYuksek:628.00, gunlukDusuk:613.00, hacim:'0.19 Mn',  piyasaDegeri:'33.5 Mr' },
  'EREGL':   { fiyat: 61.35,    degisimYuzde:-0.65,  gunlukYuksek: 62.50, gunlukDusuk: 60.80, hacim:'1.02 Mn',  piyasaDegeri:'98.2 Mr' },
  'FROTO':   { fiyat:1120.50,   degisimYuzde:-0.43,  gunlukYuksek:1138.00,gunlukDusuk:1112.00,hacim:'0.12 Mn',  piyasaDegeri:'41.5 Mr' },
  'USD/TRY': { fiyat: 36.82,    degisimYuzde:-0.45,  gunlukYuksek: 37.10, gunlukDusuk: 36.70, hacim:'—' },
  'EUR/TRY': { fiyat: 38.91,    degisimYuzde: 0.32,  gunlukYuksek: 39.20, gunlukDusuk: 38.75, hacim:'—' },
  'GBP/TRY': { fiyat: 46.50,    degisimYuzde:-0.18,  gunlukYuksek: 46.90, gunlukDusuk: 46.35, hacim:'—' },
  'JPY/TRY': { fiyat:  0.2432,  degisimYuzde: 0.12,  gunlukYuksek:  0.248, gunlukDusuk: 0.241, hacim:'—' },
  'CHF/TRY': { fiyat: 41.80,    degisimYuzde:-0.09,  gunlukYuksek: 42.10, gunlukDusuk: 41.65, hacim:'—' },
  'BTC/TRY': { fiyat:2345670,   degisimYuzde: 1.74,  gunlukYuksek:2389000,gunlukDusuk:2298000,hacim:'42.3 Mr', piyasaDegeri:'46.2 Tr' },
  'ETH/TRY': { fiyat:126400,    degisimYuzde:-0.58,  gunlukYuksek:129800, gunlukDusuk:124600, hacim:'18.7 Mr', piyasaDegeri:'15.3 Tr' },
  'BNB/TRY': { fiyat: 23580,    degisimYuzde: 0.91,  gunlukYuksek: 24100, gunlukDusuk: 23200, hacim:'7.2 Mr',  piyasaDegeri:'3.4 Tr' },
  'XRP/TRY': { fiyat:   87.45,  degisimYuzde: 1.33,  gunlukYuksek:  89.10, gunlukDusuk: 86.20, hacim:'12.1 Mr', piyasaDegeri:'4.8 Tr' },
  'SOL/TRY': { fiyat:  7840,    degisimYuzde: 1.23,  gunlukYuksek: 8020,  gunlukDusuk: 7710,  hacim:'5.4 Mr',  piyasaDegeri:'1.2 Tr' },
}

type SortKey = 'sembol' | 'fiyat' | 'degisim' | 'gunlukYuksek'
type SortDir = 'asc' | 'desc'

const TAB_LABELS: Record<string, string> = { HISSE: 'Hisseler', DOVIZ: 'Döviz', KRIPTO: 'Kripto' }

function fmt(f: number) {
  if (f >= 1_000_000) return f.toLocaleString('tr-TR', { maximumFractionDigits: 0 })
  if (f >= 1) return f.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
  return f.toLocaleString('tr-TR', { minimumFractionDigits: 4, maximumFractionDigits: 6 })
}

function RangeBar({ low, high, cur }: { low: number; high: number; cur: number }) {
  const range = high - low
  const pct = range > 0 ? Math.min(100, Math.max(0, ((cur - low) / range) * 100)) : 50
  return (
    <div className="flex items-center gap-1.5 w-28">
      <span className="text-[10px] text-gray-400 w-8 text-right shrink-0">{fmt(low)}</span>
      <div className="relative flex-1 h-1.5 bg-gray-100 rounded-full">
        <div className="absolute top-0 left-0 h-1.5 bg-blue-200 rounded-full" style={{ width: `${pct}%` }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full border-2 border-white shadow" style={{ left: `calc(${pct}% - 4px)` }} />
      </div>
      <span className="text-[10px] text-gray-400 w-8 shrink-0">{fmt(high)}</span>
    </div>
  )
}

export default function PiyasaVerileri() {
  const navigate = useNavigate()
  const { userId } = useAuth()
  const [veriler, setVeriler] = useState<Araci[]>([])
  const [fiyatlar, setFiyatlar] = useState<Map<number, FiyatVerisi>>(new Map())
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('HISSE')
  const [ara, setAra] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('degisim')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [takipEdilen, setTakipEdilen] = useState<Set<number>>(new Set())
  const [takipYukleniyor, setTakipYukleniyor] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!userId) return
    takipListesi.kullanicinin(userId)
      .then(r => setTakipEdilen(new Set(r.data.map((t: any) => t.yatirimAraciId))))
      .catch(() => {})
  }, [userId])

  const takipToggle = async (araciId: number) => {
    if (!userId) return
    setTakipYukleniyor(prev => new Set(prev).add(araciId))
    try {
      if (takipEdilen.has(araciId)) {
        await takipListesi.sil(userId, araciId)
        setTakipEdilen(prev => { const s = new Set(prev); s.delete(araciId); return s })
      } else {
        await takipListesi.ekle(userId, araciId)
        setTakipEdilen(prev => new Set(prev).add(araciId))
      }
    } catch {}
    setTakipYukleniyor(prev => { const s = new Set(prev); s.delete(araciId); return s })
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([yatirimAraclari.tipeGore(tab), piyasaVerileri.guncel()])
      .then(([ar, fr]) => {
        setVeriler(ar.data)
        const m = new Map<number, FiyatVerisi>()
        fr.data.forEach((f: any) => m.set(f.yatirimAraciId, f))
        setFiyatlar(m)
        setLoading(false)
      })
      .catch(() => {
        const demoAraclar = DEMO_ARACLARI[tab] ?? []
        setVeriler(demoAraclar)
        const m = new Map<number, FiyatVerisi>()
        demoAraclar.forEach(a => {
          const df = DEMO_FIYATLAR[a.sembol]
          if (df) m.set(a.id, { yatirimAraciId: a.id, fiyat: df.fiyat, degisimYuzde: df.degisimYuzde })
        })
        setFiyatlar(m)
        setLoading(false)
      })
  }, [tab])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const enriched = useMemo(() => {
    return veriler.map(a => {
      const f = fiyatlar.get(a.id)
      const demo = DEMO_FIYATLAR[a.sembol]
      return {
        ...a,
        fiyat: f?.fiyat ?? demo?.fiyat ?? 0,
        degisimYuzde: f?.degisimYuzde ?? demo?.degisimYuzde ?? 0,
        gunlukYuksek: demo?.gunlukYuksek ?? (f?.fiyat ?? 0) * 1.02,
        gunlukDusuk: demo?.gunlukDusuk ?? (f?.fiyat ?? 0) * 0.98,
        hacim: demo?.hacim ?? '—',
        piyasaDegeri: demo?.piyasaDegeri,
      }
    })
  }, [veriler, fiyatlar])

  const filtered = useMemo(() => {
    let list = ara
      ? enriched.filter(v => v.sembol.toLowerCase().includes(ara.toLowerCase()) || v.ad.toLowerCase().includes(ara.toLowerCase()))
      : enriched
    return [...list].sort((a, b) => {
      let diff = 0
      if (sortKey === 'sembol') diff = a.sembol.localeCompare(b.sembol)
      else if (sortKey === 'fiyat') diff = a.fiyat - b.fiyat
      else if (sortKey === 'degisim') diff = (a.degisimYuzde ?? 0) - (b.degisimYuzde ?? 0)
      else if (sortKey === 'gunlukYuksek') diff = a.gunlukYuksek - b.gunlukYuksek
      return sortDir === 'asc' ? diff : -diff
    })
  }, [enriched, ara, sortKey, sortDir])

  const gainers = enriched.filter(v => (v.degisimYuzde ?? 0) > 0).length
  const losers  = enriched.filter(v => (v.degisimYuzde ?? 0) < 0).length
  const flat    = enriched.length - gainers - losers
  const avgChange = enriched.length > 0
    ? enriched.reduce((s, v) => s + (v.degisimYuzde ?? 0), 0) / enriched.length
    : 0

  function SortTh({ label, k, className = '' }: { label: string; k: SortKey; className?: string }) {
    const active = sortKey === k
    return (
      <th
        className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-800 select-none ${className}`}
        onClick={() => handleSort(k)}
      >
        <span className="flex items-center gap-1 justify-inherit">
          {label}
          <ArrowUpDown className={`w-3 h-3 ${active ? 'text-blue-500' : 'text-gray-300'}`} />
        </span>
      </th>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Piyasa Verileri</h2>
          <p className="text-xs text-gray-400 mt-0.5">Gerçek zamanlı fiyat ve değişim bilgileri</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Sembol veya isim ara..."
            value={ara}
            onChange={e => setAra(e.target.value)}
            className="pl-9 pr-4 py-1.5 text-sm bg-white border border-gray-200 rounded-lg w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tab + Market Stats Bar */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {Object.entries(TAB_LABELS).map(([id, label]) => (
            <button
              key={id}
              onClick={() => { setTab(id); setAra('') }}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors font-medium ${
                tab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {!loading && (
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-100 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5 text-green-600" />
              <span className="font-semibold text-green-700">{gainers}</span>
              <span className="text-green-600">Yükseliyor</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-100 rounded-lg">
              <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              <span className="font-semibold text-red-600">{losers}</span>
              <span className="text-red-500">Düşüyor</span>
            </span>
            {flat > 0 && (
              <span className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500">
                <span className="font-semibold">{flat}</span> Değişmedi
              </span>
            )}
            <span className={`px-3 py-1.5 rounded-lg border font-semibold ${avgChange >= 0 ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-600'}`}>
              Ort. {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="animate-pulse space-y-2">
          {[...Array(8)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg" />)}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <SortTh label="Sembol" k="sembol" className="text-left w-44" />
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-left hidden sm:table-cell">Enstrüman</th>
                <SortTh label="Fiyat" k="fiyat" className="text-right" />
                <SortTh label="Değişim" k="degisim" className="text-right" />
                <SortTh label="Gün Y/D" k="gunlukYuksek" className="text-center hidden lg:table-cell" />
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right hidden xl:table-cell">Hacim</th>
                {tab !== 'DOVIZ' && <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right hidden xl:table-cell">Piy. Değeri</th>}
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(a => {
                const deg = a.degisimYuzde ?? 0
                const pozitif = deg > 0
                const negatif = deg < 0
                const tipRenk = a.tip === 'HISSE' ? 'bg-blue-50 text-blue-700'
                  : a.tip === 'DOVIZ' ? 'bg-purple-50 text-purple-700'
                  : 'bg-orange-50 text-orange-700'
                return (
                  <tr key={a.id} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tipRenk} font-bold text-xs`}>
                          {a.sembol.replace('/TRY','').slice(0, 3)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{a.sembol}</div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${tipRenk}`}>
                            {a.tip}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <span className="text-sm text-gray-500 truncate max-w-[180px] block">{a.ad}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm font-bold text-gray-900">₺{fmt(a.fiyat)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${
                        pozitif ? 'bg-green-50 text-green-700' : negatif ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'
                      }`}>
                        {pozitif ? <TrendingUp className="w-3 h-3" /> : negatif ? <TrendingDown className="w-3 h-3" /> : null}
                        {pozitif ? '+' : ''}{deg.toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <RangeBar low={a.gunlukDusuk} high={a.gunlukYuksek} cur={a.fiyat} />
                    </td>
                    <td className="px-4 py-3.5 text-right hidden xl:table-cell">
                      <span className="text-xs text-gray-500">{a.hacim}</span>
                    </td>
                    {tab !== 'DOVIZ' && (
                      <td className="px-4 py-3.5 text-right hidden xl:table-cell">
                        <span className="text-xs text-gray-500">{a.piyasaDegeri ?? '—'}</span>
                      </td>
                    )}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/analiz?sembol=${a.sembol}`)}
                          title="Grafik"
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <BarChart2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => takipToggle(a.id)}
                          disabled={takipYukleniyor.has(a.id)}
                          title={takipEdilen.has(a.id) ? 'Takipten çıkar' : 'Takip listesine ekle'}
                          className="p-1.5 hover:bg-yellow-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Star className={`w-3.5 h-3.5 transition-colors ${
                            takipEdilen.has(a.id)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-400 hover:text-yellow-500'
                          }`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400">Arama sonucu bulunamadı.</div>
          )}
        </div>
      )}
    </div>
  )
}
