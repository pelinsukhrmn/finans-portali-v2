import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend, ComposedChart, Area
} from 'recharts'
import { yatirimAraclari, piyasaVerileri, aiAsistan } from '../services/api'
import { Search, TrendingUp, Activity, TrendingDown, Minus, Info, Sparkles, Loader2 } from 'lucide-react'

// ── Tipler ────────────────────────────────────────────────────
interface Araci {
  id: number
  sembol: string
  ad: string
  tip: string
}

interface FiyatNoktasi {
  tarih: string
  fiyat: number
  ma20?: number
  ma50?: number
  bollingerUst?: number
  bollingerAlt?: number
  bollingerOrta?: number
  rsi?: number
  karsilastirma?: number
}

// ── Zaman aralığı seçenekleri ────────────────────────────────
const ARALILAR = [
  { label: '1H',  days: 7   },
  { label: '1A',  days: 30  },
  { label: '3A',  days: 90  },
  { label: '6A',  days: 180 },
  { label: '1Y',  days: 365 },
]

// ── Demo veri üretici (gerçek veri yoksa) ─────────────────────
function demoVerisiUret(
  sembol: string,
  days: number,
  baslangicFiyat: number
): FiyatNoktasi[] {
  const veriler: FiyatNoktasi[] = []
  let fiyat = baslangicFiyat
  const now = new Date()

  for (let i = days; i >= 0; i--) {
    const tarih = new Date(now)
    tarih.setDate(now.getDate() - i)

    // Rastgele ama gerçekçi fiyat hareketi (±%2)
    const degisim = (Math.random() - 0.48) * 0.04 * fiyat
    fiyat = Math.max(fiyat + degisim, 1)

    veriler.push({
      tarih: tarih.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
      fiyat: parseFloat(fiyat.toFixed(4)),
    })
  }

  // Hareketli ortalama hesapla
  return hesaplaMA(veriler)
}

// ── MA hesaplama ─────────────────────────────────────────────
function hesaplaMA(veriler: FiyatNoktasi[]): FiyatNoktasi[] {
  return veriler.map((v, i, arr) => {
    const ma20 = i >= 19
      ? arr.slice(i - 19, i + 1).reduce((s, x) => s + x.fiyat, 0) / 20
      : undefined
    const ma50 = i >= 49
      ? arr.slice(i - 49, i + 1).reduce((s, x) => s + x.fiyat, 0) / 50
      : undefined

    // Bollinger Bantları (20 periyot, 2 standart sapma)
    let bollingerUst: number | undefined
    let bollingerAlt: number | undefined
    let bollingerOrta: number | undefined
    if (ma20 !== undefined) {
      const pencere = arr.slice(i - 19, i + 1).map(x => x.fiyat)
      const std = Math.sqrt(pencere.reduce((s, x) => s + (x - ma20) ** 2, 0) / 20)
      bollingerOrta = parseFloat(ma20.toFixed(4))
      bollingerUst  = parseFloat((ma20 + 2 * std).toFixed(4))
      bollingerAlt  = parseFloat((ma20 - 2 * std).toFixed(4))
    }

    // RSI (14 periyot)
    let rsi: number | undefined
    if (i >= 14) {
      const degisimler = arr.slice(i - 13, i + 1).map((x, j, a) =>
        j === 0 ? 0 : x.fiyat - a[j - 1].fiyat
      ).slice(1)
      const kazanc = degisimler.filter(d => d > 0).reduce((s, d) => s + d, 0) / 14
      const kayip  = degisimler.filter(d => d < 0).reduce((s, d) => s + Math.abs(d), 0) / 14
      rsi = kayip === 0 ? 100 : parseFloat((100 - 100 / (1 + kazanc / kayip)).toFixed(1))
    }

    return {
      ...v,
      ma20:          ma20 ? parseFloat(ma20.toFixed(4)) : undefined,
      ma50:          ma50 ? parseFloat(ma50.toFixed(4)) : undefined,
      bollingerUst,
      bollingerAlt,
      bollingerOrta,
      rsi,
    }
  })
}

// ── Yüzde değişim hesabı (karşılaştırma için) ─────────────────
function normalizeVeriler(veriler: FiyatNoktasi[]): FiyatNoktasi[] {
  if (veriler.length === 0) return veriler
  const ilkFiyat = veriler[0].fiyat
  return veriler.map(v => ({
    ...v,
    fiyat: parseFloat(((v.fiyat / ilkFiyat - 1) * 100).toFixed(2)),
    ma20: v.ma20 ? parseFloat(((v.ma20 / ilkFiyat - 1) * 100).toFixed(2)) : undefined,
    ma50: v.ma50 ? parseFloat(((v.ma50 / ilkFiyat - 1) * 100).toFixed(2)) : undefined,
  }))
}

// ── Demo fiyatları ────────────────────────────────────────────
const DEMO_FIYATLAR: Record<string, number> = {
  'USD/TRY': 36.82, 'EUR/TRY': 38.91, 'GBP/TRY': 46.50,
  'BTC/TRY': 2345670, 'ETH/TRY': 126400,
  'THYAO': 307.5, 'GARAN': 124.5, 'ASELS': 87.2,
}

// ── Ana bileşen ───────────────────────────────────────────────
export default function Analiz() {
  const [searchParams] = useSearchParams()
  const [aracilar, setAracilar] = useState<Araci[]>([])
  const [aramaQuery, setAramaQuery] = useState('')
  const [seciliAraci, setSeciliAraci] = useState<Araci | null>(null)
  const [karsilastirmaAraci, setKarsilastirmaAraci] = useState<Araci | null>(null)
  const [aralikGun, setAralikGun] = useState(30)
  const [veriler, setVeriler] = useState<FiyatNoktasi[]>([])
  const [karsilastirmaVerileri, setKarsilastirmaVerileri] = useState<FiyatNoktasi[]>([])
  const [loading, setLoading] = useState(false)
  const [maGoster, setMaGoster] = useState(true)
  const [bollingerGoster, setBollingerGoster] = useState(false)
  const [rsiGoster, setRsiGoster] = useState(false)
  const [karsilastirmaGoster, setKarsilastirmaGoster] = useState(false)
  const [karsilastirmaArama, setKarsilastirmaArama] = useState('')
  const [aiYorum, setAiYorum] = useState<string | null>(null)
  const [aiYorumLoading, setAiYorumLoading] = useState(false)

  // Enstrüman listesi yükle, URL param varsa pre-seç
  useEffect(() => {
    yatirimAraclari.tumunu()
      .then(r => {
        setAracilar(r.data)
        const sembolParam = searchParams.get('sembol')
        if (sembolParam) {
          const bulunan = r.data.find((a: Araci) => a.sembol === sembolParam)
          if (bulunan) setSeciliAraci(bulunan)
        }
      })
      .catch(() => {})
  }, [searchParams])

  // Seçili enstrüman değişince veri yükle
  useEffect(() => {
    if (!seciliAraci) return
    grafıkVerisiYukle(seciliAraci)
  }, [seciliAraci, aralikGun])

  // Karşılaştırma enstrümanı değişince
  useEffect(() => {
    if (!karsilastirmaAraci) { setKarsilastirmaVerileri([]); return }
    const baslangic = DEMO_FIYATLAR[karsilastirmaAraci.sembol] ?? 100
    const ham = demoVerisiUret(karsilastirmaAraci.sembol, aralikGun, baslangic)
    setKarsilastirmaVerileri(normalizeVeriler(ham))
  }, [karsilastirmaAraci, aralikGun])

  // Sembol veya aralık değişince AI yorumunu sıfırla
  useEffect(() => { setAiYorum(null) }, [seciliAraci, aralikGun])

  const aiYorumAl = async () => {
    if (!istatistikler || !seciliAraci) return
    setAiYorumLoading(true)
    setAiYorum(null)
    try {
      const aralikAdi = ARALILAR.find(a => a.days === aralikGun)?.label ?? `${aralikGun} gün`
      const soru = `${seciliAraci.sembol} (${seciliAraci.ad}) sembolü için son ${aralikAdi} grafik verilerini teknik analiz açısından yorumla:
- Son Fiyat: ${istatistikler.sonFiyat.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
- Dönem Min: ${istatistikler.min.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
- Dönem Max: ${istatistikler.max.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
- Dönem Değişim: ${istatistikler.degisimYuzde >= 0 ? '+' : ''}${istatistikler.degisimYuzde.toFixed(2)}%
- Yıllık Volatilite: %${istatistikler.volatilite ?? 'hesaplanamadı'}
- MA20 Sinyali: ${istatistikler.maSignal ?? 'yetersiz veri'}
Kısa, anlaşılır ve Türkçe bir teknik analiz yorumu yaz. 3-4 cümle yeterli.`
      const res = await aiAsistan.marketBriefing(soru)
      setAiYorum(res.data.cevap)
    } catch {
      setAiYorum('AI şu anda yanıt veremiyor. Lütfen tekrar deneyin.')
    } finally {
      setAiYorumLoading(false)
    }
  }

  const grafıkVerisiYukle = async (araci: Araci) => {
    setLoading(true)
    try {
      const now = new Date()
      const baslangic = new Date(now)
      baslangic.setDate(now.getDate() - aralikGun)

      const res = await piyasaVerileri.tarihsel(
        araci.id,
        baslangic.toISOString(),
        now.toISOString()
      )

      // Need at least 3 distinct days to show a meaningful chart
      const gunler = new Set(
        (res.data ?? []).map((d: any) =>
          new Date(d.veriZamani).toDateString()
        )
      )

      if (res.data && res.data.length > 0 && gunler.size >= 3) {
        const ham: FiyatNoktasi[] = res.data.map((d: any) => ({
          tarih: new Date(d.veriZamani).toLocaleDateString('tr-TR', {
            day: '2-digit', month: '2-digit',
          }),
          fiyat: parseFloat(d.fiyat),
        }))
        setVeriler(hesaplaMA(ham))
      } else {
        throw new Error('Yetersiz veri')
      }
    } catch {
      // API unavailable or not enough history — use demo data
      const basFiyat = DEMO_FIYATLAR[araci.sembol] ?? 100
      setVeriler(demoVerisiUret(araci.sembol, aralikGun, basFiyat))
    } finally {
      setLoading(false)
    }
  }

  // Filtreleme
  const filtreliAracilar = aramaQuery
    ? aracilar.filter(a =>
        a.sembol.toLowerCase().includes(aramaQuery.toLowerCase()) ||
        a.ad.toLowerCase().includes(aramaQuery.toLowerCase())
      ).slice(0, 10)
    : aracilar.slice(0, 8)

  const filtreliKarsilastirma = karsilastirmaArama
    ? aracilar.filter(a =>
        a.id !== seciliAraci?.id &&
        (a.sembol.toLowerCase().includes(karsilastirmaArama.toLowerCase()) ||
         a.ad.toLowerCase().includes(karsilastirmaArama.toLowerCase()))
      ).slice(0, 6)
    : []

  // Grafik için birleştirilmiş veri
  const grafıkVerisi = karsilastirmaGoster && karsilastirmaVerileri.length > 0
    ? normalizeVeriler(veriler).map((v, i) => ({
        ...v,
        karsilastirma: karsilastirmaVerileri[i]?.fiyat,
      }))
    : veriler

  // İstatistikler
  const istatistikler = veriler.length > 1 ? (() => {
    const min = Math.min(...veriler.map(v => v.fiyat))
    const max = Math.max(...veriler.map(v => v.fiyat))
    const sonFiyat = veriler[veriler.length - 1].fiyat
    const degisim = sonFiyat - veriler[0].fiyat
    const degisimYuzde = (degisim / veriler[0].fiyat) * 100
    const volatilite = veriler.length > 2
      ? (() => {
          const getiriler = veriler.slice(1).map((v, i) => (v.fiyat - veriler[i].fiyat) / veriler[i].fiyat)
          const ort = getiriler.reduce((s, g) => s + g, 0) / getiriler.length
          const varyans = getiriler.reduce((s, g) => s + (g - ort) ** 2, 0) / getiriler.length
          return (Math.sqrt(varyans) * Math.sqrt(252) * 100).toFixed(1)
        })()
      : null
    const lastMa20 = veriler[veriler.length - 1].ma20
    const maSignal = lastMa20
      ? sonFiyat > lastMa20 * 1.005 ? 'AL' : sonFiyat < lastMa20 * 0.995 ? 'SAT' : 'NÖTR'
      : null
    return { min, max, sonFiyat, degisim, degisimYuzde, volatilite, maSignal }
  })() : null

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <div className="flex items-center gap-3 mb-6">
        <Activity className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Tarihsel Analiz</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Sol: Enstrüman arama */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Sembol ara..."
              value={aramaQuery}
              onChange={e => setAramaQuery(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {filtreliAracilar.map(a => (
              <button
                key={a.id}
                onClick={() => { setSeciliAraci(a); setAramaQuery('') }}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-blue-50 transition-colors ${
                  seciliAraci?.id === a.id ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''
                }`}
              >
                <div className="text-sm font-medium text-gray-900">{a.sembol}</div>
                <div className="text-xs text-gray-500 truncate">{a.ad}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Sağ: Grafik alanı */}
        <div className="lg:col-span-3 space-y-4">

          {!seciliAraci ? (
            <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center h-80">
              <div className="text-center">
                <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Analiz etmek için sol taraftan bir enstrüman seçin</p>
              </div>
            </div>
          ) : (
            <>
              {/* Başlık + kontroller */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{seciliAraci.sembol}</h3>
                  <p className="text-xs text-gray-500">{seciliAraci.ad}</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Zaman aralığı */}
                  <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                    {ARALILAR.map(a => (
                      <button
                        key={a.label}
                        onClick={() => setAralikGun(a.days)}
                        className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                          aralikGun === a.days
                            ? 'bg-white text-gray-900 shadow-sm font-medium'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>

                  {/* MA toggle */}
                  <button onClick={() => setMaGoster(!maGoster)}
                    className={`px-3 py-1 text-xs rounded-lg border transition-colors ${maGoster ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-500'}`}>
                    MA20/MA50
                  </button>

                  {/* Bollinger toggle */}
                  <button onClick={() => setBollingerGoster(!bollingerGoster)}
                    className={`px-3 py-1 text-xs rounded-lg border transition-colors ${bollingerGoster ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-500'}`}>
                    Bollinger
                  </button>

                  {/* RSI toggle */}
                  <button onClick={() => setRsiGoster(!rsiGoster)}
                    className={`px-3 py-1 text-xs rounded-lg border transition-colors ${rsiGoster ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-gray-200 text-gray-500'}`}>
                    RSI
                  </button>

                  {/* Karşılaştırma toggle */}
                  <button
                    onClick={() => setKarsilastirmaGoster(!karsilastirmaGoster)}
                    className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                      karsilastirmaGoster
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-white border-gray-200 text-gray-500'
                    }`}
                  >
                    Karşılaştır
                  </button>
                </div>
              </div>

              {/* İstatistikler */}
              {istatistikler && (
                <div className="grid grid-cols-4 gap-3">
                  <StatKart baslik="Son Fiyat"
                    deger={istatistikler.sonFiyat.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} />
                  <StatKart baslik="Dönem Min"
                    deger={istatistikler.min.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} />
                  <StatKart baslik="Dönem Max"
                    deger={istatistikler.max.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} />
                  <StatKart
                    baslik="Toplam Değişim"
                    deger={`${istatistikler.degisimYuzde >= 0 ? '+' : ''}${istatistikler.degisimYuzde.toFixed(2)}%`}
                    renk={istatistikler.degisimYuzde >= 0 ? 'text-green-600' : 'text-red-500'}
                  />
                </div>
              )}

              {/* Karşılaştırma arama */}
              {karsilastirmaGoster && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">Karşılaştırılacak enstrüman:</p>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Sembol ara..."
                        value={karsilastirmaArama}
                        onChange={e => setKarsilastirmaArama(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {karsilastirmaAraci && (
                      <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg px-2 py-1">
                        {karsilastirmaAraci.sembol}
                      </span>
                    )}
                  </div>
                  {filtreliKarsilastirma.length > 0 && (
                    <div className="mt-2 border border-gray-100 rounded-lg overflow-hidden">
                      {filtreliKarsilastirma.map(a => (
                        <button
                          key={a.id}
                          onClick={() => { setKarsilastirmaAraci(a); setKarsilastirmaArama('') }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 border-b border-gray-50 last:border-0"
                        >
                          <span className="font-medium">{a.sembol}</span>
                          <span className="text-gray-500 ml-2">{a.ad}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    * Karşılaştırma modunda fiyatlar yüzde değişim olarak gösterilir.
                  </p>
                </div>
              )}

              {/* Grafik */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-sm text-gray-400">Veri yükleniyor...</div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={grafıkVerisi} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="tarih"
                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                        tickLine={false}
                        interval={Math.floor(grafıkVerisi.length / 6)}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                        tickLine={false}
                        axisLine={false}
                        width={60}
                        tickFormatter={v => typeof v === 'number'
                          ? (karsilastirmaGoster ? `${v.toFixed(1)}%` : v.toLocaleString('tr-TR'))
                          : v}
                      />
                      <Tooltip
                        contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                        formatter={(v: number, name: string) => {
                          if (karsilastirmaGoster) return [`${v.toFixed(2)}%`, name]
                          return [v?.toLocaleString('tr-TR', { minimumFractionDigits: 2 }), name]
                        }}
                      />
                      {karsilastirmaGoster && (
                        <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
                      )}
                      <Legend
                        formatter={(v) => <span className="text-xs text-gray-700">{v}</span>}
                      />

                      {/* Ana fiyat çizgisi */}
                      <Line
                        type="monotone"
                        dataKey="fiyat"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        name={seciliAraci.sembol}
                        activeDot={{ r: 4 }}
                      />

                      {/* Hareketli ortalamalar */}
                      {maGoster && (
                        <>
                          <Line type="monotone" dataKey="ma20" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="MA20" />
                          <Line type="monotone" dataKey="ma50" stroke="#8b5cf6" strokeWidth={1.5} dot={false} strokeDasharray="6 3" name="MA50" />
                        </>
                      )}

                      {/* Bollinger Bantları */}
                      {bollingerGoster && (
                        <>
                          <Line type="monotone" dataKey="bollingerUst" stroke="#6366f1" strokeWidth={1} dot={false} strokeDasharray="3 2" name="BB Üst" />
                          <Line type="monotone" dataKey="bollingerOrta" stroke="#6366f1" strokeWidth={1} dot={false} opacity={0.5} name="BB Orta" />
                          <Line type="monotone" dataKey="bollingerAlt" stroke="#6366f1" strokeWidth={1} dot={false} strokeDasharray="3 2" name="BB Alt" />
                        </>
                      )}

                      {/* Karşılaştırma çizgisi */}
                      {karsilastirmaGoster && karsilastirmaAraci && (
                        <Line
                          type="monotone"
                          dataKey="karsilastirma"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={false}
                          name={karsilastirmaAraci.sembol}
                          activeDot={{ r: 4 }}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* RSI Grafiği */}
              {rsiGoster && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900">RSI (14)</h4>
                    <div className="flex gap-3 text-xs">
                      <span className="text-red-500">Aşırı Alım: &gt;70</span>
                      <span className="text-green-600">Aşırı Satım: &lt;30</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={120}>
                    <ComposedChart data={grafıkVerisi} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="tarih" tick={{ fontSize: 10 }} tickLine={false}
                        interval={Math.floor(grafıkVerisi.length / 6)} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={30} />
                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                        formatter={(v: number) => [v?.toFixed(1), 'RSI']} />
                      <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 2" strokeWidth={1} />
                      <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 2" strokeWidth={1} />
                      <ReferenceLine y={50} stroke="#9ca3af" strokeDasharray="2 2" strokeWidth={1} />
                      <Line type="monotone" dataKey="rsi" stroke="#f43f5e" strokeWidth={1.5} dot={false} name="RSI" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Teknik Analiz Açıklaması */}
              {maGoster && (
                <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 text-xs text-blue-700 space-y-1">
                  <p><strong>MA20</strong> (Sarı): 20 günlük hareketli ortalama — kısa vadeli trend göstergesi.</p>
                  <p><strong>MA50</strong> (Mor): 50 günlük hareketli ortalama — orta vadeli trend göstergesi.</p>
                  <p>Fiyat MA20'yi yukarı kırıyorsa <strong>yükseliş sinyali</strong>; aşağı kırıyorsa <strong>düşüş sinyali</strong> olarak yorumlanabilir.</p>
                </div>
              )}

              {/* Teknik Sinyaller Özeti */}
              {/* AI Grafik Yorumu */}
              {istatistikler && (
                <div className="bg-white rounded-xl border border-purple-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <h4 className="text-sm font-semibold text-gray-900">AI Grafik Yorumu</h4>
                    </div>
                    <button
                      onClick={aiYorumAl}
                      disabled={aiYorumLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                      {aiYorumLoading
                        ? <><Loader2 className="w-3 h-3 animate-spin" /> Analiz ediliyor...</>
                        : <><Sparkles className="w-3 h-3" /> {aiYorum ? 'Yenile' : 'AI Yorumu Al'}</>
                      }
                    </button>
                  </div>
                  {aiYorum ? (
                    <div className="bg-purple-50 rounded-lg p-3 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {aiYorum}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">
                      Seçili sembolün grafik verilerini AI ile analiz etmek için butona tıklayın.
                    </p>
                  )}
                </div>
              )}

              {istatistikler && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4 text-gray-400" />
                    <h4 className="text-sm font-semibold text-gray-900">Teknik Özet</h4>
                    <span className="text-xs text-gray-400 ml-auto">Demo / eğitim amaçlı</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">MA20 Sinyali</p>
                      {istatistikler.maSignal ? (
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md ${
                          istatistikler.maSignal === 'AL' ? 'bg-green-100 text-green-700'
                          : istatistikler.maSignal === 'SAT' ? 'bg-red-100 text-red-600'
                          : 'bg-yellow-50 text-yellow-700'
                        }`}>
                          {istatistikler.maSignal === 'AL' ? <TrendingUp className="w-3 h-3" />
                           : istatistikler.maSignal === 'SAT' ? <TrendingDown className="w-3 h-3" />
                           : <Minus className="w-3 h-3" />}
                          {istatistikler.maSignal}
                        </span>
                      ) : <span className="text-xs text-gray-400">Yetersiz veri</span>}
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Trend Yönü</p>
                      <span className={`inline-flex items-center gap-1 text-xs font-bold ${
                        istatistikler.degisimYuzde > 2 ? 'text-green-600'
                        : istatistikler.degisimYuzde < -2 ? 'text-red-500'
                        : 'text-yellow-600'
                      }`}>
                        {istatistikler.degisimYuzde > 2 ? <TrendingUp className="w-3.5 h-3.5" />
                         : istatistikler.degisimYuzde < -2 ? <TrendingDown className="w-3.5 h-3.5" />
                         : <Minus className="w-3.5 h-3.5" />}
                        {istatistikler.degisimYuzde > 2 ? 'Yükseliş' : istatistikler.degisimYuzde < -2 ? 'Düşüş' : 'Yatay'}
                      </span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Volatilite (Yıllık)</p>
                      <p className="text-sm font-bold text-gray-800">
                        {istatistikler.volatilite ? `%${istatistikler.volatilite}` : '—'}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Dönem Değişim</p>
                      <p className={`text-sm font-bold ${istatistikler.degisimYuzde >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {istatistikler.degisimYuzde >= 0 ? '+' : ''}{istatistikler.degisimYuzde.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-3">
                    * Sinyaller geçmiş fiyat hareketlerine dayanır. Yatırım tavsiyesi niteliği taşımaz.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function StatKart({ baslik, deger, renk = 'text-gray-900' }: {
  baslik: string; deger: string; renk?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3">
      <p className="text-xs text-gray-500 mb-1">{baslik}</p>
      <p className={`text-sm font-bold ${renk}`}>{deger}</p>
    </div>
  )
}
