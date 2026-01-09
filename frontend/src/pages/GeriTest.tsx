import { useEffect, useState } from 'react'
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend
} from 'recharts'
import { Search, FlaskConical, TrendingUp, TrendingDown, BarChart2, Play, AlertCircle } from 'lucide-react'
import { yatirimAraclari, geriTest } from '../services/api'

// ── Tipler ────────────────────────────────────────────────────
interface Araci {
  id: number
  sembol: string
  ad: string
  tip: string
}

interface Islem {
  tarih: string
  tur: 'AL' | 'SAT'
  fiyat: number
  miktar: number
  deger: number
  karZarar?: number
  karZararYuzde?: number
}

interface PortfoyNokta {
  tarih: string
  deger: number
  isaret?: string
}

interface BacktestSonuc {
  islemler: Islem[]
  portfoyDegerleri: PortfoyNokta[]
  toplamGetiriYuzde: number
  toplamGetiriTL: number
  maxDusus: number
  kazanmaOrani: number
  toplamIslem: number
  kazananIslem: number
  kaybettirenIslem: number
  sharpeOrani: number
  baslangicSermayesi: number
  bitisSermayesi: number
  sembol: string
  strateji: string
}

// ── Strateji konfigürasyonları ─────────────────────────────────
const STRATEJILER = {
  MA_KESISIM: {
    label: 'MA Kesişim',
    aciklama: 'Kısa MA uzun MA\'yı yukarı kestiğinde AL, aşağı kestiğinde SAT.',
    params: [
      { key: 'kisaPeriod',  label: 'Kısa MA Periyot', default: 20, min: 5,  max: 100 },
      { key: 'uzunPeriod',  label: 'Uzun MA Periyot',  default: 50, min: 10, max: 200 },
    ],
  },
  RSI: {
    label: 'RSI',
    aciklama: 'RSI aşırı satış seviyesinden çıkınca AL, aşırı alış seviyesinden düşünce SAT.',
    params: [
      { key: 'period',     label: 'RSI Periyot',          default: 14, min: 5,  max: 50 },
      { key: 'asiriSatis', label: 'Aşırı Satış Seviyesi', default: 30, min: 10, max: 45 },
      { key: 'asiriAlis',  label: 'Aşırı Alış Seviyesi',  default: 70, min: 55, max: 90 },
    ],
  },
  MACD: {
    label: 'MACD',
    aciklama: 'MACD çizgisi sinyal çizgisini yukarı kestiğinde AL, aşağı kestiğinde SAT.',
    params: [
      { key: 'kisaPeriod',   label: 'Hızlı EMA',     default: 12, min: 5,  max: 50  },
      { key: 'uzunPeriod',   label: 'Yavaş EMA',     default: 26, min: 10, max: 100 },
      { key: 'sinyalPeriod', label: 'Sinyal Periyot', default: 9,  min: 3,  max: 30  },
    ],
  },
} as const

type StratejiKey = keyof typeof STRATEJILER

// ── Tarih yardımcıları ─────────────────────────────────────────
function bugunStr() {
  return new Date().toISOString().split('T')[0]
}
function birYilOnceStr() {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 1)
  return d.toISOString().split('T')[0]
}

// ── Özel nokta (buy/sell) renderer ────────────────────────────
function CustomDot(props: any) {
  const { cx, cy, payload, index } = props
  if (payload.isaret === 'AL') {
    return <circle key={`dot-al-${index}`} cx={cx} cy={cy} r={5} fill="#22c55e" stroke="white" strokeWidth={2} />
  }
  if (payload.isaret === 'SAT') {
    return <circle key={`dot-sat-${index}`} cx={cx} cy={cy} r={5} fill="#ef4444" stroke="white" strokeWidth={2} />
  }
  return <circle key={`dot-none-${index}`} cx={cx} cy={cy} r={0} />
}

// ── Ana bileşen ───────────────────────────────────────────────
export default function GeriTest() {
  const [aracilar, setAracilar]           = useState<Araci[]>([])
  const [aramaQuery, setAramaQuery]       = useState('')
  const [seciliAraci, setSeciliAraci]     = useState<Araci | null>(null)
  const [strateji, setStrateji]           = useState<StratejiKey>('MA_KESISIM')
  const [parametreler, setParametreler]   = useState<Record<string, number>>({})
  const [baslangicTarihi, setBaslangicTarihi] = useState(birYilOnceStr())
  const [bitisTarihi, setBitisTarihi]     = useState(bugunStr())
  const [sermaye, setSermaye]             = useState(100000)
  const [loading, setLoading]             = useState(false)
  const [hata, setHata]                   = useState<string | null>(null)
  const [sonuc, setSonuc]                 = useState<BacktestSonuc | null>(null)
  const [islemSayfasi, setIslemSayfasi]   = useState(0)

  useEffect(() => {
    yatirimAraclari.tumunu().then(r => setAracilar(r.data)).catch(() => {})
  }, [])

  // Strateji değişince varsayılan parametreleri yükle
  useEffect(() => {
    const defaults: Record<string, number> = {}
    STRATEJILER[strateji].params.forEach(p => { defaults[p.key] = p.default })
    setParametreler(defaults)
  }, [strateji])

  const filtreliAracilar = aramaQuery
    ? aracilar.filter(a =>
        a.sembol.toLowerCase().includes(aramaQuery.toLowerCase()) ||
        a.ad.toLowerCase().includes(aramaQuery.toLowerCase())
      ).slice(0, 10)
    : aracilar.slice(0, 8)

  const calistir = async () => {
    if (!seciliAraci) return
    setLoading(true)
    setHata(null)
    setSonuc(null)
    try {
      const res = await geriTest.calistir({
        araciId: seciliAraci.id,
        strateji,
        parametreler,
        baslangicTarihi,
        bitisTarihi,
        baslangicSermayesi: sermaye,
      })
      setSonuc(res.data)
      setIslemSayfasi(0)
    } catch (e: any) {
      setHata(e?.response?.data?.message ?? 'Backtest sırasında hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  const stratejiAdi = (key: string) => {
    const map: Record<string, string> = {
      MA_KESISIM: 'MA Kesişim', RSI: 'RSI', MACD: 'MACD',
    }
    return map[key] ?? key
  }

  const SAYFA_BOYUTU = 10
  const islemSayfalari = sonuc ? Math.ceil(sonuc.islemler.length / SAYFA_BOYUTU) : 0
  const gosterilecekIslemler = sonuc?.islemler.slice(
    islemSayfasi * SAYFA_BOYUTU,
    (islemSayfasi + 1) * SAYFA_BOYUTU
  ) ?? []

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-6">
      <div className="flex items-center gap-3 mb-6">
        <FlaskConical className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-semibold text-gray-900">Backtesting</h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Demo / eğitim amaçlı</span>
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
              className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {filtreliAracilar.map(a => (
              <button
                key={a.id}
                onClick={() => { setSeciliAraci(a); setAramaQuery(''); setSonuc(null) }}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-indigo-50 transition-colors ${
                  seciliAraci?.id === a.id ? 'bg-indigo-50 border-l-2 border-l-indigo-600' : ''
                }`}
              >
                <div className="text-sm font-medium text-gray-900">{a.sembol}</div>
                <div className="text-xs text-gray-500 truncate">{a.ad}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Sağ: Konfigürasyon + Sonuçlar */}
        <div className="lg:col-span-3 space-y-4">

          {!seciliAraci ? (
            <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center h-80">
              <div className="text-center">
                <BarChart2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Test etmek için sol taraftan bir enstrüman seçin</p>
              </div>
            </div>
          ) : (
            <>
              {/* Konfigürasyon kartı */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
                <h3 className="text-sm font-semibold text-gray-900">
                  {seciliAraci.sembol} — Strateji Konfigürasyonu
                </h3>

                {/* Strateji seçimi */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Strateji</label>
                  <div className="flex gap-2 flex-wrap">
                    {(Object.keys(STRATEJILER) as StratejiKey[]).map(k => (
                      <button
                        key={k}
                        onClick={() => setStrateji(k)}
                        className={`px-4 py-2 text-xs font-medium rounded-lg border transition-colors ${
                          strateji === k
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        {STRATEJILER[k].label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{STRATEJILER[strateji].aciklama}</p>
                </div>

                {/* Strateji parametreleri */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {STRATEJILER[strateji].params.map(p => (
                    <div key={p.key}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{p.label}</label>
                      <input
                        type="number"
                        value={parametreler[p.key] ?? p.default}
                        min={p.min}
                        max={p.max}
                        onChange={e => setParametreler(prev => ({ ...prev, [p.key]: Number(e.target.value) }))}
                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  ))}
                </div>

                {/* Dönem + sermaye */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Başlangıç Tarihi</label>
                    <input
                      type="date"
                      value={baslangicTarihi}
                      max={bitisTarihi}
                      onChange={e => setBaslangicTarihi(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Bitiş Tarihi</label>
                    <input
                      type="date"
                      value={bitisTarihi}
                      min={baslangicTarihi}
                      max={bugunStr()}
                      onChange={e => setBitisTarihi(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Başlangıç Sermayesi (TL)</label>
                    <input
                      type="number"
                      value={sermaye}
                      min={1000}
                      step={1000}
                      onChange={e => setSermaye(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <button
                  onClick={calistir}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Çalışıyor...</>
                    : <><Play className="w-4 h-4" /> Testi Çalıştır</>
                  }
                </button>
              </div>

              {/* Hata */}
              {hata && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700">{hata}</p>
                </div>
              )}

              {/* Sonuçlar */}
              {sonuc && (
                <>
                  {/* Özet istatistikler */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <MetrikKart
                      baslik="Toplam Getiri"
                      deger={`${sonuc.toplamGetiriYuzde >= 0 ? '+' : ''}${sonuc.toplamGetiriYuzde.toFixed(2)}%`}
                      altDeger={`${sonuc.toplamGetiriTL >= 0 ? '+' : ''}${sonuc.toplamGetiriTL.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL`}
                      renk={sonuc.toplamGetiriYuzde >= 0 ? 'text-green-600' : 'text-red-500'}
                    />
                    <MetrikKart
                      baslik="Kazanma Oranı"
                      deger={`%${sonuc.kazanmaOrani.toFixed(1)}`}
                      altDeger={`${sonuc.kazananIslem}K / ${sonuc.kaybettirenIslem}K işlem`}
                      renk={sonuc.kazanmaOrani >= 50 ? 'text-green-600' : 'text-red-500'}
                    />
                    <MetrikKart
                      baslik="Max Düşüş"
                      deger={`-%${sonuc.maxDusus.toFixed(2)}`}
                      altDeger="En büyük tepe→dip"
                      renk="text-red-500"
                    />
                    <MetrikKart
                      baslik="Sharpe Oranı"
                      deger={sonuc.sharpeOrani.toFixed(2)}
                      altDeger={`${sonuc.toplamIslem} işlem toplam`}
                      renk={sonuc.sharpeOrani >= 1 ? 'text-green-600' : sonuc.sharpeOrani >= 0 ? 'text-yellow-600' : 'text-red-500'}
                    />
                  </div>

                  {/* Özet bilgi bandı */}
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex flex-wrap gap-4 text-xs text-indigo-700">
                    <span><strong>{seciliAraci.sembol}</strong> · {stratejiAdi(sonuc.strateji)}</span>
                    <span>Başlangıç: <strong>{sonuc.baslangicSermayesi.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL</strong></span>
                    <span>Bitiş: <strong>{sonuc.bitisSermayesi.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL</strong></span>
                    <span className="text-gray-400 ml-auto">* Demo veri · Yatırım tavsiyesi değildir</span>
                  </div>

                  {/* Portföy değer grafiği */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Portföy Değeri</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={sonuc.portfoyDegerleri} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="tarih"
                          tick={{ fontSize: 11, fill: '#9ca3af' }}
                          tickLine={false}
                          interval={Math.max(Math.floor(sonuc.portfoyDegerleri.length / 6), 1)}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#9ca3af' }}
                          tickLine={false}
                          axisLine={false}
                          width={70}
                          tickFormatter={v => v.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                        />
                        <Tooltip
                          contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                          formatter={(v: number, name: string) => {
                            if (name === 'Portföy Değeri')
                              return [v.toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' TL', name]
                            return [v, name]
                          }}
                        />
                        <ReferenceLine
                          y={sonuc.baslangicSermayesi}
                          stroke="#9ca3af"
                          strokeDasharray="4 2"
                          label={{ value: 'Başlangıç', fontSize: 10, fill: '#9ca3af' }}
                        />
                        <Legend
                          formatter={v => <span className="text-xs text-gray-700">{v}</span>}
                        />
                        <Line
                          type="monotone"
                          dataKey="deger"
                          stroke="#6366f1"
                          strokeWidth={2}
                          name="Portföy Değeri"
                          dot={<CustomDot />}
                          activeDot={{ r: 4 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> AL sinyali
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> SAT sinyali
                      </span>
                    </div>
                  </div>

                  {/* İşlem listesi */}
                  {sonuc.islemler.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <h4 className="text-sm font-semibold text-gray-900 mb-4">
                        İşlem Geçmişi
                        <span className="text-xs font-normal text-gray-400 ml-2">
                          ({sonuc.islemler.length} işlem)
                        </span>
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-100 text-xs text-gray-500">
                              <th className="text-left py-2 pr-4 font-medium">Tarih</th>
                              <th className="text-left py-2 pr-4 font-medium">İşlem</th>
                              <th className="text-right py-2 pr-4 font-medium">Fiyat (TL)</th>
                              <th className="text-right py-2 pr-4 font-medium">Miktar</th>
                              <th className="text-right py-2 pr-4 font-medium">Değer (TL)</th>
                              <th className="text-right py-2 font-medium">Kar/Zarar</th>
                            </tr>
                          </thead>
                          <tbody>
                            {gosterilecekIslemler.map((is, idx) => (
                              <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="py-2 pr-4 text-gray-600 text-xs">{is.tarih}</td>
                                <td className="py-2 pr-4">
                                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md ${
                                    is.tur === 'AL'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-red-100 text-red-600'
                                  }`}>
                                    {is.tur === 'AL'
                                      ? <TrendingUp className="w-3 h-3" />
                                      : <TrendingDown className="w-3 h-3" />}
                                    {is.tur}
                                  </span>
                                </td>
                                <td className="py-2 pr-4 text-right text-gray-800">
                                  {is.fiyat.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-2 pr-4 text-right text-gray-600 text-xs">
                                  {is.miktar.toFixed(4)}
                                </td>
                                <td className="py-2 pr-4 text-right text-gray-800">
                                  {is.deger.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                                </td>
                                <td className="py-2 text-right">
                                  {is.karZarar != null ? (
                                    <span className={`text-xs font-medium ${is.karZarar >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                      {is.karZarar >= 0 ? '+' : ''}{is.karZarar.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL
                                      {is.karZararYuzde != null && (
                                        <span className="ml-1 text-gray-400">
                                          ({is.karZararYuzde >= 0 ? '+' : ''}{is.karZararYuzde.toFixed(1)}%)
                                        </span>
                                      )}
                                    </span>
                                  ) : (
                                    <span className="text-gray-300 text-xs">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Sayfalama */}
                      {islemSayfalari > 1 && (
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-xs text-gray-400">
                            {islemSayfasi * SAYFA_BOYUTU + 1}–{Math.min((islemSayfasi + 1) * SAYFA_BOYUTU, sonuc.islemler.length)} / {sonuc.islemler.length}
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setIslemSayfasi(p => Math.max(p - 1, 0))}
                              disabled={islemSayfasi === 0}
                              className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                            >
                              ‹ Önceki
                            </button>
                            <button
                              onClick={() => setIslemSayfasi(p => Math.min(p + 1, islemSayfalari - 1))}
                              disabled={islemSayfasi >= islemSayfalari - 1}
                              className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                            >
                              Sonraki ›
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function MetrikKart({ baslik, deger, altDeger, renk = 'text-gray-900' }: {
  baslik: string; deger: string; altDeger?: string; renk?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-500 mb-1">{baslik}</p>
      <p className={`text-base font-bold ${renk}`}>{deger}</p>
      {altDeger && <p className="text-xs text-gray-400 mt-0.5">{altDeger}</p>}
    </div>
  )
}
