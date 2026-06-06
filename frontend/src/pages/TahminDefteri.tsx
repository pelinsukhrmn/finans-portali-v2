import { useEffect, useState } from 'react'
import { BookOpen, Plus, Trash2, X, Search } from 'lucide-react'
import { tahminler, yatirimAraclari, piyasaVerileri } from '../services/api'
import { useAuth } from '../context/AuthContext'

interface Tahmin {
  id: number
  yatirimAraciId: number
  sembol: string
  ad: string
  tip: string
  hedefFiyat: number
  mevcutFiyatOlusturma: number | null
  hedefTarih: string
  durum: 'BEKLEMEDE' | 'ISABETLI' | 'YANLIS'
  notlar: string | null
  olusturmaTarihi: string
  mevcutFiyat?: number
}

interface Araci { id: number; sembol: string; ad: string; tip: string }

const DURUM_STYLE = {
  BEKLEMEDE: 'bg-yellow-100 text-yellow-700',
  ISABETLI:  'bg-green-100 text-green-700',
  YANLIS:    'bg-red-100 text-red-700',
}
const DURUM_LABEL = { BEKLEMEDE: 'Beklemede', ISABETLI: 'İsabetli', YANLIS: 'Yanlış' }

type Filtre = 'TUMU' | 'BEKLEMEDE' | 'ISABETLI' | 'YANLIS'

export default function TahminDefteri() {
  const { userId } = useAuth()
  const [liste, setListe] = useState<Tahmin[]>([])
  const [filtre, setFiltre] = useState<Filtre>('TUMU')
  const [modalAcik, setModalAcik] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(false)

  // Form state
  const [aramaQ, setAramaQ] = useState('')
  const [aramaResult, setAramaResult] = useState<Araci[]>([])
  const [seciliAraci, setSeciliAraci] = useState<Araci | null>(null)
  const [hedefFiyat, setHedefFiyat] = useState('')
  const [hedefTarih, setHedefTarih] = useState('')
  const [notlar, setNotlar] = useState('')
  const [kaydetYukleniyor, setKaydetYukleniyor] = useState(false)

  const yukle = async () => {
    if (!userId) return
    setYukleniyor(true)
    try {
      const res = await tahminler.listele(userId)
      const data: Tahmin[] = res.data
      // Mevcut fiyatları çek
      const guncel = await Promise.allSettled(
        data.map(t => piyasaVerileri.sonByAraci(t.yatirimAraciId))
      )
      data.forEach((t, i) => {
        const r = guncel[i]
        if (r.status === 'fulfilled') t.mevcutFiyat = r.value.data?.fiyat ?? undefined
      })
      setListe(data)
    } finally {
      setYukleniyor(false)
    }
  }

  useEffect(() => { yukle() }, [userId])

  const aramaYap = async (q: string) => {
    setAramaQ(q)
    if (q.length < 2) { setAramaResult([]); return }
    const res = await yatirimAraclari.ara(q)
    setAramaResult(res.data.slice(0, 6))
  }

  const kaydet = async () => {
    if (!userId || !seciliAraci || !hedefFiyat || !hedefTarih) return
    setKaydetYukleniyor(true)
    try {
      await tahminler.ekle(userId, {
        yatirimAraciId: seciliAraci.id,
        hedefFiyat: parseFloat(hedefFiyat),
        hedefTarih,
        notlar: notlar || undefined,
      })
      setModalAcik(false)
      resetForm()
      await yukle()
    } finally {
      setKaydetYukleniyor(false)
    }
  }

  const sil = async (id: number) => {
    if (!userId) return
    await tahminler.sil(id, userId)
    setListe(prev => prev.filter(t => t.id !== id))
  }

  const durumGuncelle = async (id: number, durum: string) => {
    if (!userId) return
    await tahminler.durumGuncelle(id, userId, durum)
    await yukle()
  }

  const resetForm = () => {
    setAramaQ(''); setAramaResult([]); setSeciliAraci(null)
    setHedefFiyat(''); setHedefTarih(''); setNotlar('')
  }

  const filtreliListe = liste.filter(t => filtre === 'TUMU' || t.durum === filtre)

  const istatistik = {
    toplam: liste.length,
    beklemede: liste.filter(t => t.durum === 'BEKLEMEDE').length,
    isabetli: liste.filter(t => t.durum === 'ISABETLI').length,
    yanlis: liste.filter(t => t.durum === 'YANLIS').length,
    isabetOrani: liste.length > 0
      ? Math.round((liste.filter(t => t.durum === 'ISABETLI').length / liste.filter(t => t.durum !== 'BEKLEMEDE').length) * 100) || 0
      : 0,
  }

  const hedefMesafe = (t: Tahmin): number | null => {
    const baz = t.mevcutFiyat ?? t.mevcutFiyatOlusturma
    if (!baz || !t.hedefFiyat) return null
    return ((t.hedefFiyat - baz) / baz) * 100
  }

  const formatPara = (v: number) =>
    new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 3 }).format(v)

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
      {/* Başlık */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-900">Tahmin Defteri</h1>
        </div>
        <button onClick={() => setModalAcik(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> Yeni Tahmin
        </button>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Toplam', value: istatistik.toplam, color: 'text-gray-900' },
          { label: 'Beklemede', value: istatistik.beklemede, color: 'text-yellow-600' },
          { label: 'İsabetli', value: istatistik.isabetli, color: 'text-green-600' },
          { label: 'Yanlış', value: istatistik.yanlis, color: 'text-red-600' },
          { label: 'İsabet %', value: `${istatistik.isabetOrani}%`, color: 'text-blue-600' },
        ].map((k, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filtre Sekmeleri */}
      <div className="flex gap-2 mb-4">
        {(['TUMU', 'BEKLEMEDE', 'ISABETLI', 'YANLIS'] as Filtre[]).map(f => (
          <button key={f} onClick={() => setFiltre(f)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${filtre === f ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {f === 'TUMU' ? `Tümü ${istatistik.toplam}` :
             f === 'BEKLEMEDE' ? `Beklemede ${istatistik.beklemede}` :
             f === 'ISABETLI' ? `İsabetli ${istatistik.isabetli}` :
             `Yanlış ${istatistik.yanlis}`}
          </button>
        ))}
      </div>

      {/* Tahmin Listesi */}
      {yukleniyor ? (
        <div className="text-center py-12 text-sm text-gray-400">Yükleniyor...</div>
      ) : filtreliListe.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-16 text-center">
          <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Henüz tahmin yok.</p>
          <p className="text-xs text-gray-400 mt-1">Yeni Tahmin butonu ile fiyat tahmini ekleyebilirsiniz.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtreliListe.map(t => {
            const mesafe = hedefMesafe(t)
            const ilerleme = mesafe !== null ? Math.min(100, Math.max(0, 100 - Math.abs(mesafe))) : null
            return (
              <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{t.sembol}</span>
                      <span className="text-sm text-gray-500">{t.ad}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DURUM_STYLE[t.durum]}`}>
                        {DURUM_LABEL[t.durum]}
                      </span>
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-gray-500">
                      <span>Hedef: <span className="font-medium text-gray-700">{formatPara(t.hedefFiyat)} TL</span></span>
                      {t.mevcutFiyat && <span>Mevcut: <span className="font-medium text-gray-700">{formatPara(t.mevcutFiyat)} TL</span></span>}
                      <span>Hedef Tarihi <span className="font-medium text-gray-700">{new Date(t.hedefTarih).toLocaleDateString('tr-TR')}</span></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {t.durum === 'BEKLEMEDE' && (
                      <>
                        <button onClick={() => durumGuncelle(t.id, 'ISABETLI')}
                          className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">İsabetli</button>
                        <button onClick={() => durumGuncelle(t.id, 'YANLIS')}
                          className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors">Yanlış</button>
                      </>
                    )}
                    <button onClick={() => sil(t.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                {mesafe !== null && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Hedefe mesafe</span>
                      <span className={mesafe >= 0 ? 'text-green-600' : 'text-red-500'}>
                        {mesafe > 0 ? '+' : ''}{mesafe.toFixed(2)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full transition-all ${mesafe >= 0 ? 'bg-green-500' : 'bg-red-400'}`}
                        style={{ width: `${Math.min(100, Math.abs(mesafe))}%` }} />
                    </div>
                  </div>
                )}

                {t.notlar && <p className="text-xs text-gray-500 mt-2 italic">"{t.notlar}"</p>}
              </div>
            )
          })}
        </div>
      )}

      {/* Yeni Tahmin Modal */}
      {modalAcik && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-900">Yeni Tahmin</h2>
              <button onClick={() => { setModalAcik(false); resetForm() }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Araç arama */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Yatırım Aracı</label>
                {seciliAraci ? (
                  <div className="flex items-center justify-between border border-blue-300 rounded-lg px-3 py-2 bg-blue-50">
                    <span className="text-sm font-medium text-blue-900">{seciliAraci.sembol} — {seciliAraci.ad}</span>
                    <button onClick={() => setSeciliAraci(null)} className="text-blue-400 hover:text-blue-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Hisse, döviz veya kripto ara..." value={aramaQ}
                      onChange={e => aramaYap(e.target.value)}
                      className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    {aramaResult.length > 0 && (
                      <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                        {aramaResult.map(a => (
                          <button key={a.id} onMouseDown={() => { setSeciliAraci(a); setAramaResult([]); setAramaQ('') }}
                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-blue-50 text-left">
                            <div>
                              <div className="text-sm font-medium">{a.sembol}</div>
                              <div className="text-xs text-gray-500 truncate max-w-[200px]">{a.ad}</div>
                            </div>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{a.tip}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Hedef Fiyat (TL)</label>
                <input type="number" placeholder="0.00" value={hedefFiyat}
                  onChange={e => setHedefFiyat(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Hedef Tarihi</label>
                <input type="date" value={hedefTarih} onChange={e => setHedefTarih(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Notlar (isteğe bağlı)</label>
                <textarea placeholder="Tahmin gerekçenizi yazın..." value={notlar}
                  onChange={e => setNotlar(e.target.value)} rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setModalAcik(false); resetForm() }}
                className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                İptal
              </button>
              <button onClick={kaydet} disabled={!seciliAraci || !hedefFiyat || !hedefTarih || kaydetYukleniyor}
                className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium">
                {kaydetYukleniyor ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
