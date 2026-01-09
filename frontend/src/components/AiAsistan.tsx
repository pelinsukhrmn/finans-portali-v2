import { useState, useRef, useEffect } from 'react'
import { Bot, X, Send, Loader2, Sparkles, MessageSquare, AlertTriangle, BarChart2 } from 'lucide-react'
import { aiAsistan } from '../services/api'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface AnomalyDTO {
  type: string
  symbol: string
  message: string
  severity?: string
}

interface GrafikVeri {
  sembol: string
  isim?: string
  agirlik?: number
  karZarar?: number
}

interface GrafikData {
  tip: 'PIE' | 'BAR' | 'RISK_BAR'
  baslik: string
  veri: GrafikVeri[]
}

interface Mesaj {
  rol: 'kullanici' | 'asistan'
  icerik: string
  grafikData?: GrafikData | null
  anomalies?: AnomalyDTO[]
  secenekler?: string[]
}

interface PortfoyBilgi {
  ad: string
  toplamDeger: number
  toplamMaliyet: number
  nominalGetiriYuzde: number
  varliklar: { sembol: string; enstrumanAdi: string; agirlik: number; nominalKarZarar: number }[]
}

interface Props {
  portfoy: PortfoyBilgi | null
  kullaniciId?: number
}

const PASTEL_RENKLER = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

const ILK_MESAJ: Mesaj = {
  rol: 'asistan',
  icerik: 'Merhaba! Ben senin yatırım asistanınım. Portföyün hakkında sorularını yanıtlayabilirim. Ne öğrenmek istersin?',
}

function GrafikKutu({ data }: { data: GrafikData }) {
  if (!data?.veri?.length) return null

  if (data.tip === 'PIE') {
    return (
      <div className="mt-2 bg-indigo-50 rounded-xl p-3">
        <p className="text-xs font-semibold text-indigo-700 mb-2 flex items-center gap-1">
          <BarChart2 className="w-3 h-3" /> {data.baslik}
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie data={data.veri} dataKey="agirlik" nameKey="sembol" outerRadius={65} label={({ sembol, agirlik }) => `${sembol} %${Number(agirlik).toFixed(1)}`} labelLine={false}>
              {data.veri.map((_, i) => <Cell key={i} fill={PASTEL_RENKLER[i % PASTEL_RENKLER.length]} />)}
            </Pie>
            <Tooltip formatter={(v: number) => `%${v.toFixed(1)}`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="mt-2 bg-indigo-50 rounded-xl p-3">
      <p className="text-xs font-semibold text-indigo-700 mb-2 flex items-center gap-1">
        <BarChart2 className="w-3 h-3" /> {data.baslik}
      </p>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data.veri} margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
          <XAxis dataKey="sembol" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Bar dataKey={data.tip === 'BAR' ? 'karZarar' : 'agirlik'} radius={[4, 4, 0, 0]}>
            {data.veri.map((v, i) => {
              const deger = data.tip === 'BAR' ? (v.karZarar ?? 0) : (v.agirlik ?? 0)
              return <Cell key={i} fill={deger >= 0 ? '#10b981' : '#ef4444'} />
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function AnomalyBadge({ anomaly }: { anomaly: AnomalyDTO }) {
  const renkMap: Record<string, string> = {
    CONCENTRATION: 'bg-orange-100 text-orange-700 border-orange-200',
    UNDERPERFORMANCE: 'bg-red-100 text-red-700 border-red-200',
    HIGH_RISK_PORTFOLIO: 'bg-red-100 text-red-700 border-red-200',
  }
  const renk = renkMap[anomaly.type] ?? 'bg-yellow-100 text-yellow-700 border-yellow-200'
  return (
    <div className={`flex items-start gap-1.5 text-xs px-2 py-1.5 rounded-lg border mt-1 ${renk}`}>
      <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
      <span><b>{anomaly.symbol}</b>: {anomaly.message}</span>
    </div>
  )
}

export default function AiAsistan({ portfoy, kullaniciId = 1 }: Props) {
  const [acik, setAcik] = useState(false)
  const [seansId, setSeansId] = useState<number | null>(null)
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([ILK_MESAJ])
  const [seciliMesajIndex, setSeciliMesajIndex] = useState<number | null>(null)
  const [girilenSoru, setGirilenSoru] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const mesajlarSonuRef = useRef<HTMLDivElement>(null)
  const mesajRefleri = useRef<(HTMLDivElement | null)[]>([])
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const kullaniciMesajlari = mesajlar
    .map((m, i) => ({ ...m, index: i }))
    .filter((m) => m.rol === 'kullanici')

  useEffect(() => {
    if (acik && !seansId) {
      aiAsistan.oturumOlustur(kullaniciId).then(res => {
        setSeansId(res.data.id)
      }).catch(() => {})
    }
  }, [acik])

  useEffect(() => {
    if (acik) mesajlarSonuRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mesajlar, acik])

  useEffect(() => {
    if (acik) setTimeout(() => inputRef.current?.focus(), 150)
  }, [acik])

  useEffect(() => {
    if (seciliMesajIndex !== null) {
      mesajRefleri.current[seciliMesajIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [seciliMesajIndex])

  const soruGonder = async (soru: string) => {
    if (!soru.trim() || yukleniyor || !seansId) return

    const yeniMesajlar: Mesaj[] = [...mesajlar, { rol: 'kullanici', icerik: soru }]
    setMesajlar(yeniMesajlar)
    setGirilenSoru('')
    setYukleniyor(true)

    try {
      const ozet = portfoy ?? {
        ad: 'Portföy', toplamDeger: 0, toplamMaliyet: 0, nominalGetiriYuzde: 0, varliklar: [],
      }
      const res = await aiAsistan.tavsiyeAl(seansId, soru, ozet)
      const { cevap, grafikData, anomalies, secenekler } = res.data
      setMesajlar([...yeniMesajlar, {
        rol: 'asistan',
        icerik: cevap,
        grafikData: grafikData && Object.keys(grafikData).length > 0 ? grafikData : null,
        anomalies: anomalies?.length > 0 ? anomalies : [],
        secenekler: secenekler?.length > 0 ? secenekler : [],
      }])
    } catch {
      setMesajlar([...yeniMesajlar, {
        rol: 'asistan',
        icerik: 'Şu anda yanıt alınamıyor. Lütfen biraz sonra tekrar deneyin.',
      }])
    } finally {
      setYukleniyor(false)
    }
  }

  const tusKontrol = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      soruGonder(girilenSoru)
    }
  }

  const sonMesajSecenekleri = [...mesajlar].reverse().find(m => m.rol === 'asistan' && m.secenekler?.length)?.secenekler

  const mesajOzet = (icerik: string, max = 48) =>
    icerik.length > max ? icerik.slice(0, max) + '…' : icerik

  return (
    <>
      {acik && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setAcik(false)} aria-hidden />

          <div className="relative z-10 flex w-[60vw] min-w-[320px] max-w-5xl h-[75vh] min-h-[480px] max-h-[820px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Sol: geçmiş */}
            <aside className="w-[30%] min-w-[200px] max-w-[280px] flex flex-col border-r border-gray-200 bg-gray-50">
              <div className="px-4 py-3 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-900">Geçmiş</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto py-2">
                {kullaniciMesajlari.length === 0 ? (
                  <p className="px-4 py-6 text-xs text-gray-400 text-center">Henüz mesaj yok.</p>
                ) : (
                  kullaniciMesajlari.map((m) => (
                    <button key={m.index} type="button"
                      onClick={() => setSeciliMesajIndex(m.index)}
                      className={`w-full text-left px-4 py-3 border-l-2 transition-colors ${
                        seciliMesajIndex === m.index ? 'border-blue-600 bg-blue-50' : 'border-transparent hover:bg-gray-100'
                      }`}>
                      <p className="text-xs font-medium text-gray-500 mb-0.5">Siz</p>
                      <p className="text-sm text-gray-800 line-clamp-2">{mesajOzet(m.icerik)}</p>
                    </button>
                  ))
                )}
              </div>
            </aside>

            {/* Sağ: ana alan */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white" />
                  <span className="text-sm font-semibold text-white">Yatırım Asistanı</span>
                  <span className="text-xs text-blue-200 bg-blue-500/40 px-2 py-0.5 rounded-full">AI</span>
                  {portfoy && <span className="text-xs text-blue-100/80 hidden sm:inline">· {portfoy.ad}</span>}
                </div>
                <button type="button" onClick={() => setAcik(false)}
                  className="text-white/70 hover:text-white transition-colors p-1" aria-label="Kapat">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-gray-50">
                {mesajlar.map((m, i) => (
                  <div key={i} ref={(el) => { mesajRefleri.current[i] = el }}
                    className={`flex ${m.rol === 'kullanici' ? 'justify-end' : 'justify-start'} ${
                      seciliMesajIndex === i ? 'ring-2 ring-blue-300 ring-offset-2 rounded-2xl' : ''
                    }`}>
                    {m.rol === 'asistan' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-2.5 mt-0.5 flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[85%] ${m.rol === 'kullanici' ? '' : 'w-full'}`}>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                        m.rol === 'kullanici'
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'
                      }`}>
                        {m.icerik}
                      </div>
                      {m.rol === 'asistan' && m.grafikData && <GrafikKutu data={m.grafikData} />}
                      {m.rol === 'asistan' && m.anomalies?.map((a, j) => <AnomalyBadge key={j} anomaly={a} />)}
                    </div>
                  </div>
                ))}

                {yukleniyor && (
                  <div className="flex justify-start">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-2.5 flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={mesajlarSonuRef} />
              </div>

              {/* Öneri butonları */}
              {(sonMesajSecenekleri?.length || mesajlar.length === 1) && (
                <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-2 flex-shrink-0">
                  {(sonMesajSecenekleri ?? ['Portföyümün genel durumu nasıl?', 'En riskli varlığım hangisi?', 'Çeşitlendirme önerir misin?']).map((s) => (
                    <button key={s} type="button" onClick={() => soruGonder(s)}
                      className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <div className="px-4 py-4 bg-white border-t border-gray-100 flex items-end gap-3 flex-shrink-0">
                <textarea ref={inputRef} value={girilenSoru}
                  onChange={(e) => setGirilenSoru(e.target.value)} onKeyDown={tusKontrol}
                  placeholder="Bir soru sor… (Enter ile gönder)" rows={1}
                  className="flex-1 resize-none text-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-28 overflow-y-auto"
                  style={{ lineHeight: '1.4' }} />
                <button type="button" onClick={() => soruGonder(girilenSoru)}
                  disabled={!girilenSoru.trim() || yukleniyor || !seansId}
                  className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <button type="button" onClick={() => setAcik(!acik)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
        title="AI Yatırım Asistanı">
        {acik ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
        {!acik && <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />}
      </button>
    </>
  )
}
