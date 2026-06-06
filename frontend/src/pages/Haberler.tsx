import { useEffect, useState } from 'react'
import { haberler, bildirimler as bildirimApi } from '../services/api'
import { ExternalLink, Clock, TrendingUp, TrendingDown, Minus, BrainCircuit, Newspaper } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface Haber {
  id: number
  baslik: string
  icerik: string
  kaynak: string
  url: string
  kategori: string
  yayinTarihi: string
}

interface HaberEtki {
  etkiYonu: 'POZITIF' | 'NEGATIF' | 'KARISIK'
  etkilenenSemboller: string
  mesaj: string
}

const DEMO_HABERLER: Haber[] = [
  { id:1, baslik:'BIST 100 Endeksi Rekor Tazeliyor', icerik:'Borsa İstanbul\'da BIST 100 endeksi güçlü seyrine devam ediyor. Yabancı yatırımcıların ilgisi artışı destekliyor.', kaynak:'Borsa İstanbul', url:'#', kategori:'EKONOMI', yayinTarihi: new Date(Date.now()-1*3600000).toISOString() },
  { id:2, baslik:'Merkez Bankası Faiz Kararı Açıklandı', icerik:'TCMB politika faizini beklentiler doğrultusunda sabit tuttu. Enflasyon görünümüne ilişkin değerlendirmeler öne çıktı.', kaynak:'TCMB', url:'#', kategori:'EKONOMI', yayinTarihi: new Date(Date.now()-4*3600000).toISOString() },
  { id:3, baslik:'THY 3. Çeyrek Karını Açıkladı', icerik:'Türk Hava Yolları, 3. çeyrek net karını önceki yıla göre %18 artırarak 2,3 milyar TL olarak açıkladı.', kaynak:'KAP', url:'#', kategori:'EKONOMI', yayinTarihi: new Date(Date.now()-7*3600000).toISOString() },
  { id:4, baslik:'Bitcoin 70.000 Doları Aştı', icerik:'Kripto para piyasasının öncü varlığı Bitcoin, kurumsal talep ve ETF onaylarının etkisiyle 70.000 dolar seviyesini geçti.', kaynak:'CoinDesk TR', url:'#', kategori:'KRIPTO', yayinTarihi: new Date(Date.now()-10*3600000).toISOString() },
  { id:5, baslik:'Dolar/TL Hareketliliği Sürdürüyor', icerik:'Küresel risk iştahındaki değişimler ve yurt içi gelişmeler Dolar/TL paritesini etkiliyor.', kaynak:'Ekonomi Haberleri', url:'#', kategori:'EKONOMI', yayinTarihi: new Date(Date.now()-13*3600000).toISOString() },
  { id:6, baslik:'Garanti Bankası Temettü Açıkladı', icerik:'Garanti BBVA, olağanüstü genel kurulda 2024 yılı için hisse başına 5,80 TL temettü dağıtım kararı aldı.', kaynak:'KAP Bildirimi', url:'#', kategori:'EKONOMI', yayinTarihi: new Date(Date.now()-16*3600000).toISOString() },
  { id:7, baslik:'Aselsan Yeni Savunma Sözleşmesi İmzaladı', icerik:'Aselsan, Savunma Sanayii Başkanlığı ile 2,1 milyar TL değerinde yeni bir sistem tedarik sözleşmesi imzaladı.', kaynak:'SSB', url:'#', kategori:'EKONOMI', yayinTarihi: new Date(Date.now()-20*3600000).toISOString() },
  { id:8, baslik:'Ethereum Güncellemesi Tamamlandı', icerik:'Ethereum ağının beklenen güncellemesi başarıyla uygulandı. İşlem ücretleri önemli ölçüde düştü.', kaynak:'Kripto Haber', url:'#', kategori:'KRIPTO', yayinTarihi: new Date(Date.now()-24*3600000).toISOString() },
  { id:9, baslik:'IMF Türkiye Büyüme Tahminini Artırdı', icerik:'Uluslararası Para Fonu, Türkiye\'nin yıl sonu büyüme tahminini %4,2\'den %4,7\'ye yükseltti.', kaynak:'IMF', url:'#', kategori:'EKONOMI', yayinTarihi: new Date(Date.now()-28*3600000).toISOString() },
  { id:10, baslik:'Ford Otosan Elektrikli Araç Yatırımını Duyurdu', icerik:'Ford Otosan, Türkiye\'deki elektrikli araç üretim kapasitesini artırmak için 1,5 milyar Euro yatırım yapacağını açıkladı.', kaynak:'Otomotiv Sektörü', url:'#', kategori:'TEKNOLOJI', yayinTarihi: new Date(Date.now()-32*3600000).toISOString() },
]

function EtkiBadge({ etki }: { etki: HaberEtki }) {
  if (etki.etkiYonu === 'POZITIF') {
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 bg-green-50 border border-green-200 rounded-full shrink-0" title={etki.mesaj}>
        <TrendingUp className="w-3 h-3 text-green-600" />
        <span className="text-[11px] font-semibold text-green-700 max-w-[120px] truncate">
          {etki.etkilenenSemboller}
        </span>
      </div>
    )
  }
  if (etki.etkiYonu === 'NEGATIF') {
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 bg-red-50 border border-red-200 rounded-full shrink-0" title={etki.mesaj}>
        <TrendingDown className="w-3 h-3 text-red-500" />
        <span className="text-[11px] font-semibold text-red-600 max-w-[120px] truncate">
          {etki.etkilenenSemboller}
        </span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-50 border border-yellow-200 rounded-full shrink-0" title={etki.mesaj}>
      <Minus className="w-3 h-3 text-yellow-600" />
      <span className="text-[11px] font-semibold text-yellow-700 max-w-[120px] truncate">
        {etki.etkilenenSemboller}
      </span>
    </div>
  )
}

export default function Haberler() {
  const { isAuthenticated, userId } = useAuth()
  const [liste, setListe] = useState<Haber[]>([])
  const [etkiMap, setEtkiMap] = useState<Record<string, HaberEtki>>({})
  const [loading, setLoading] = useState(true)
  const [kat, setKat] = useState('TUMU')

  useEffect(() => {
    haberler.tumunu()
      .then(r => setListe(r.data?.length > 0 ? r.data : DEMO_HABERLER))
      .catch(() => setListe(DEMO_HABERLER))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !userId) return
    bildirimApi.haberEtkiler(userId)
      .then(r => setEtkiMap(r.data ?? {}))
      .catch(() => {})
  }, [isAuthenticated, userId])

  const kategoriler = ['TUMU', 'EKONOMI', 'TEKNOLOJI', 'KRIPTO']
  const filtered = kat === 'TUMU' ? liste : liste.filter(h => h.kategori === kat)

  const fmt = (t: string) => {
    const s = Math.floor((Date.now() - new Date(t).getTime()) / 3600000)
    return s < 1 ? 'Az önce' : s < 24 ? `${s} saat önce` : `${Math.floor(s / 24)} gün önce`
  }

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Finansal Haberler</h2>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{liste.length} haber · {filtered.length} gösteriliyor</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {kategoriler.map(k => (
            <button
              key={k}
              onClick={() => setKat(k)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors font-medium ${
                kat === k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {k === 'TUMU' ? 'Tümü' : k.charAt(0) + k.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* AI impact legend (authenticated) */}
      {isAuthenticated && Object.keys(etkiMap).length > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl">
          <BrainCircuit className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-xs font-medium text-blue-700">AI Portföy Analizi:</span>
          <span className="flex items-center gap-1 text-xs text-green-700"><TrendingUp className="w-3 h-3" /> Olumlu etki</span>
          <span className="flex items-center gap-1 text-xs text-red-600"><TrendingDown className="w-3 h-3" /> Olumsuz etki</span>
          <span className="flex items-center gap-1 text-xs text-yellow-700"><Minus className="w-3 h-3" /> Karışık etki</span>
          <span className="ml-auto text-xs text-blue-500 font-medium">{Object.keys(etkiMap).length} haber analiz edildi</span>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(h => {
          const etki = etkiMap[String(h.id)]
          return (
            <a
              key={h.id}
              href={h.url}
              target="_blank"
              rel="noreferrer"
              className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Category + time */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 text-xs rounded-full shrink-0">
                      {h.kategori}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />{fmt(h.yayinTarihi)}
                    </span>
                  </div>

                  {/* Headline + AI impact badge */}
                  <div className="flex items-start gap-2 flex-wrap mb-1">
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 leading-snug">
                      {h.baslik}
                    </h3>
                    {etki && <EtkiBadge etki={etki} />}
                  </div>

                  {/* AI analysis text */}
                  {etki && (
                    <p className={`text-xs mb-1.5 leading-relaxed font-medium ${
                      etki.etkiYonu === 'POZITIF' ? 'text-green-700'
                      : etki.etkiYonu === 'NEGATIF' ? 'text-red-600'
                      : 'text-yellow-700'
                    }`}>
                      {etki.mesaj}
                    </p>
                  )}

                  <p className="text-xs text-gray-500 line-clamp-2">{h.icerik}</p>
                  <div className="mt-2 text-xs text-gray-400">{h.kaynak}</div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-500 shrink-0 mt-0.5" />
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}
