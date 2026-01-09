import { useEffect, useState } from 'react'
import { Calendar, ChevronUp, ChevronDown, Minus, AlertCircle } from 'lucide-react'
import { ekonomikTakvim } from '../services/api'

// ── Tipler ────────────────────────────────────────────────────
interface Etkinlik {
  id: number
  ulke: string
  olay: string
  onemDerecesi: number
  aciklananDeger?: string
  beklenti?: string
  oncekiDeger?: string
  tarih: string
  saat: string
  gerceklesti: boolean
  sonucDurumu?: 'YUKARI' | 'ASAGI' | 'NÖTR'
}

// ── Sabitler ──────────────────────────────────────────────────
const ARALIKLAR = [
  { key: 'bugun',    label: 'Bugün'    },
  { key: 'bu-hafta', label: 'Bu Hafta' },
  { key: 'bu-ay',    label: 'Bu Ay'    },
  { key: 'tumu',     label: 'Tümü'     },
]

const ULKELER = [
  { key: 'TUMU', label: 'Tüm Ülkeler' },
  { key: 'TR',   label: 'Türkiye'     },
  { key: 'US',   label: 'ABD'         },
  { key: 'EU',   label: 'Avrupa'      },
]

// ── Yardımcılar ───────────────────────────────────────────────
function onemRenk(derece: number) {
  if (derece === 3) return 'text-red-500'
  if (derece === 2) return 'text-orange-400'
  return 'text-yellow-400'
}

function onemEtiket(derece: number) {
  return '★'.repeat(derece) + '☆'.repeat(3 - derece)
}

function grupla(liste: Etkinlik[]): Record<string, Etkinlik[]> {
  return liste.reduce((acc, e) => {
    if (!acc[e.tarih]) acc[e.tarih] = []
    acc[e.tarih].push(e)
    return acc
  }, {} as Record<string, Etkinlik[]>)
}

// ── Ana bileşen ───────────────────────────────────────────────
export default function EkonomikTakvimSayfasi() {
  const [etkinlikler, setEtkinlikler] = useState<Etkinlik[]>([])
  const [loading, setLoading]         = useState(false)
  const [hata, setHata]               = useState<string | null>(null)
  const [aralik, setAralik]           = useState('bu-hafta')
  const [ulke, setUlke]               = useState('TUMU')
  const [onem, setOnem]               = useState<number | undefined>(undefined)

  useEffect(() => {
    yukle()
  }, [aralik, ulke, onem])

  const yukle = async () => {
    setLoading(true)
    setHata(null)
    try {
      const res = await ekonomikTakvim.listele(aralik, ulke, onem)
      setEtkinlikler(res.data)
    } catch {
      setHata('Ekonomik takvim yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }

  const grupluEtkinlikler = grupla(etkinlikler)
  const tarihler = Object.keys(grupluEtkinlikler).sort((a, b) => {
    const [da, ma, ya] = a.split('.').map(Number)
    const [db, mb, yb] = b.split('.').map(Number)
    return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime()
  })

  const bugun = new Date().toLocaleDateString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-6">
      {/* Başlık */}
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Ekonomik Takvim</h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          Merkez bankası, enflasyon, istihdam verileri
        </span>
      </div>

      {/* Filtreler */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 flex flex-wrap gap-4 items-center">

        {/* Zaman aralığı */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {ARALIKLAR.map(a => (
            <button
              key={a.key}
              onClick={() => setAralik(a.key)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                aralik === a.key
                  ? 'bg-white text-gray-900 shadow-sm font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>

        {/* Ülke */}
        <div className="flex gap-1 flex-wrap">
          {ULKELER.map(u => (
            <button
              key={u.key}
              onClick={() => setUlke(u.key)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                ulke === u.key
                  ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {u.label}
            </button>
          ))}
        </div>

        {/* Önem derecesi */}
        <div className="flex gap-1 ml-auto">
          <button
            onClick={() => setOnem(undefined)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              onem === undefined
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            Tüm Önemi
          </button>
          {[3, 2, 1].map(d => (
            <button
              key={d}
              onClick={() => setOnem(onem === d ? undefined : d)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                onem === d
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className={onemRenk(d)}>{onemEtiket(d)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Hata */}
      {hata && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 mb-4">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{hata}</p>
        </div>
      )}

      {/* Yükleniyor */}
      {loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-10 flex items-center justify-center">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-400">Yükleniyor...</p>
          </div>
        </div>
      )}

      {/* Boş durum */}
      {!loading && !hata && etkinlikler.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Bu dönemde seçili filtrelere uyan etkinlik yok.</p>
        </div>
      )}

      {/* Takvim listesi */}
      {!loading && tarihler.length > 0 && (
        <div className="space-y-4">
          {tarihler.map(tarih => (
            <div key={tarih} className="bg-white rounded-xl border border-gray-200 overflow-hidden">

              {/* Tarih başlığı */}
              <div className={`px-5 py-3 flex items-center gap-3 border-b border-gray-100 ${
                tarih === bugun ? 'bg-blue-50' : 'bg-gray-50'
              }`}>
                <Calendar className={`w-4 h-4 ${tarih === bugun ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className={`text-sm font-semibold ${tarih === bugun ? 'text-blue-700' : 'text-gray-700'}`}>
                  {tarih}
                </span>
                {tarih === bugun && (
                  <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Bugün</span>
                )}
                <span className="text-xs text-gray-400 ml-auto">
                  {grupluEtkinlikler[tarih].length} etkinlik
                </span>
              </div>

              {/* Etkinlik satırları */}
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50 text-xs text-gray-400">
                    <th className="text-left px-5 py-2 font-medium w-16">Saat</th>
                    <th className="text-left px-3 py-2 font-medium w-12">Ülke</th>
                    <th className="text-left px-3 py-2 font-medium w-24">Önem</th>
                    <th className="text-left px-3 py-2 font-medium">Etkinlik</th>
                    <th className="text-right px-3 py-2 font-medium w-24">Önceki</th>
                    <th className="text-right px-3 py-2 font-medium w-24">Beklenti</th>
                    <th className="text-right px-5 py-2 font-medium w-28">Gerçekleşen</th>
                  </tr>
                </thead>
                <tbody>
                  {grupluEtkinlikler[tarih].map(etk => (
                    <tr
                      key={etk.id}
                      className={`border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors ${
                        etk.gerceklesti ? 'opacity-75' : ''
                      }`}
                    >
                      {/* Saat */}
                      <td className="px-5 py-3 text-sm text-gray-600 font-mono">{etk.saat}</td>

                      {/* Ülke */}
                      <td className="px-3 py-3">
                        <span className="text-xs font-medium text-gray-600">{etk.ulke}</span>
                      </td>

                      {/* Önem */}
                      <td className="px-3 py-3">
                        <span className={`text-xs font-medium ${onemRenk(etk.onemDerecesi)}`}>
                          {onemEtiket(etk.onemDerecesi)}
                        </span>
                      </td>

                      {/* Olay adı */}
                      <td className="px-3 py-3">
                        <span className={`text-sm ${etk.onemDerecesi === 3 ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                          {etk.olay}
                        </span>
                      </td>

                      {/* Önceki */}
                      <td className="px-3 py-3 text-right text-sm text-gray-500">
                        {etk.oncekiDeger ?? <span className="text-gray-300">—</span>}
                      </td>

                      {/* Beklenti */}
                      <td className="px-3 py-3 text-right text-sm text-gray-600">
                        {etk.beklenti ?? <span className="text-gray-300">—</span>}
                      </td>

                      {/* Gerçekleşen */}
                      <td className="px-5 py-3 text-right">
                        {etk.gerceklesti ? (
                          etk.aciklananDeger ? (
                            <div className="flex items-center justify-end gap-1">
                              <span className={`text-sm font-semibold ${
                                etk.sonucDurumu === 'YUKARI' ? 'text-green-600'
                                : etk.sonucDurumu === 'ASAGI' ? 'text-red-500'
                                : 'text-gray-700'
                              }`}>
                                {etk.aciklananDeger}
                              </span>
                              {etk.sonucDurumu === 'YUKARI' && <ChevronUp className="w-3.5 h-3.5 text-green-500" />}
                              {etk.sonucDurumu === 'ASAGI' && <ChevronDown className="w-3.5 h-3.5 text-red-400" />}
                              {etk.sonucDurumu === 'NÖTR'  && <Minus className="w-3.5 h-3.5 text-gray-400" />}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Açıklanmadı</span>
                          )
                        ) : (
                          <span className="text-xs text-gray-300">Bekleniyor</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Alt not */}
      <p className="text-xs text-gray-400 mt-6 text-center">
        * Saatler Türkiye saatiyle (UTC+3) gösterilmektedir. Veriler demo amaçlıdır.
      </p>
    </div>
  )
}
