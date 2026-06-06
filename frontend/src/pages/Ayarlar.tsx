import { useEffect, useState } from 'react'
import { BrainCircuit, Bell, Mail, TrendingUp, DollarSign, Bitcoin, CheckCircle, AlertCircle } from 'lucide-react'
import { bildirimler as bildirimApi } from '../services/api'
import { useAuth } from '../context/AuthContext'

interface Ayarlar {
  aktif: boolean
  emailAktif: boolean
  hisseTakip: boolean
  dovizTakip: boolean
  kriptoTakip: boolean
}

interface Bildirim {
  id: number
  mesaj: string
  haberBaslik: string
  etkilenenSemboller: string
  okundu: boolean
  olusturmaTarihi: string
}

function Toggle({ label, desc, checked, onChange, disabled }: {
  label: string; desc: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean
}) {
  return (
    <div className={`flex items-center justify-between py-4 border-b border-gray-100 last:border-0 ${disabled ? 'opacity-50' : ''}`}>
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      <button
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  )
}

export default function Ayarlar() {
  const { isAuthenticated, userId, login } = useAuth()
  const [ayarlar, setAyarlar] = useState<Ayarlar | null>(null)
  const [liste, setListe] = useState<Bildirim[]>([])
  const [loading, setLoading] = useState(true)
  const [kaydetDurum, setKaydetDurum] = useState<'idle' | 'saving' | 'ok' | 'err'>('idle')

  useEffect(() => {
    if (!isAuthenticated || !userId) { setLoading(false); return }
    Promise.all([
      bildirimApi.ayarlariGetir(userId),
      bildirimApi.listele(userId, 50),
    ]).then(([ar, lr]) => {
      setAyarlar(ar.data)
      setListe(lr.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [isAuthenticated, userId])

  const guncelle = async (patch: Partial<Ayarlar>) => {
    if (!userId || !ayarlar) return
    const yeni = { ...ayarlar, ...patch }
    setAyarlar(yeni)
    setKaydetDurum('saving')
    try {
      await bildirimApi.ayarlariGuncelle(userId, patch as Record<string, boolean>)
      setKaydetDurum('ok')
    } catch {
      setAyarlar(ayarlar)
      setKaydetDurum('err')
    }
    setTimeout(() => setKaydetDurum('idle'), 2000)
  }

  const tarihFmt = (s: string) =>
    new Date(s).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 text-center">
        <BrainCircuit className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Giriş Gerekli</h2>
        <p className="text-sm text-gray-500 mb-6">AI bildirim ayarlarını yönetmek için giriş yapın.</p>
        <button onClick={login} className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          Giriş Yap
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
        <p className="text-sm text-gray-500 mt-1">AI haber analizi ve bildirim tercihlerinizi yönetin.</p>
      </div>

      {/* Save status */}
      {kaydetDurum !== 'idle' && (
        <div className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg ${
          kaydetDurum === 'ok' ? 'bg-green-50 text-green-700' :
          kaydetDurum === 'err' ? 'bg-red-50 text-red-700' :
          'bg-blue-50 text-blue-700'
        }`}>
          {kaydetDurum === 'ok' && <CheckCircle className="w-4 h-4" />}
          {kaydetDurum === 'err' && <AlertCircle className="w-4 h-4" />}
          {kaydetDurum === 'saving' ? 'Kaydediliyor...' : kaydetDurum === 'ok' ? 'Kaydedildi.' : 'Kaydetme hatası.'}
        </div>
      )}

      {/* AI Notification Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <BrainCircuit className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-gray-900">AI Haber Analizi</p>
            <p className="text-xs text-gray-500">Yeni haberler portföyünüzü etkileyebilecekse AI sizi uyarır.</p>
          </div>
        </div>

        <div className="px-6">
          {ayarlar && (
            <>
              <Toggle
                label="AI Analizini Etkinleştir"
                desc="Yeni haberler geldiğinde portföyünüzle otomatik karşılaştırılır."
                checked={ayarlar.aktif}
                onChange={v => guncelle({ aktif: v })}
              />
              <Toggle
                label="E-posta Bildirimleri"
                desc="İlgili haber bulunduğunda e-posta adresinize bildirim gönderilir."
                checked={ayarlar.emailAktif}
                onChange={v => guncelle({ emailAktif: v })}
                disabled={!ayarlar.aktif}
              />
            </>
          )}
        </div>
      </div>

      {/* Asset Type Toggles */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <Bell className="w-5 h-5 text-gray-500" />
          <p className="text-sm font-semibold text-gray-900">Hangi Varlık Türleri İzlensin?</p>
        </div>
        <div className="px-6">
          {ayarlar && (
            <>
              <Toggle
                label="Hisseler"
                desc="THYAO, GARAN, ASELS vb. portföyünüzdeki hisseler."
                checked={ayarlar.hisseTakip}
                onChange={v => guncelle({ hisseTakip: v })}
                disabled={!ayarlar.aktif}
              />
              <Toggle
                label="Döviz"
                desc="USD/TRY, EUR/TRY vb. döviz çiftleri."
                checked={ayarlar.dovizTakip}
                onChange={v => guncelle({ dovizTakip: v })}
                disabled={!ayarlar.aktif}
              />
              <Toggle
                label="Kripto Para"
                desc="BTC/TRY, ETH/TRY vb. kripto varlıklar."
                checked={ayarlar.kriptoTakip}
                onChange={v => guncelle({ kriptoTakip: v })}
                disabled={!ayarlar.aktif}
              />
            </>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-blue-50 rounded-xl border border-blue-100 px-6 py-4 space-y-2">
        <p className="text-sm font-semibold text-blue-900">Nasıl Çalışır?</p>
        <div className="flex items-start gap-2 text-xs text-blue-700">
          <TrendingUp className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Her 30 dakikada bir yeni haberler çekilir ve portföyünüzdeki varlıklarla karşılaştırılır.</span>
        </div>
        <div className="flex items-start gap-2 text-xs text-blue-700">
          <BrainCircuit className="w-4 h-4 shrink-0 mt-0.5" />
          <span>AI, haberin portföyünüzdeki hangi varlığı etkileyebileceğini Türkçe olarak açıklar.</span>
        </div>
        <div className="flex items-start gap-2 text-xs text-blue-700">
          <Mail className="w-4 h-4 shrink-0 mt-0.5" />
          <span>E-posta bildirimleri için sunucu SMTP ayarları gereklidir (sistem yöneticinizle görüşün).</span>
        </div>
        <div className="flex items-start gap-2 text-xs text-blue-700">
          <Bitcoin className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Bildirimler yatırım tavsiyesi niteliği taşımaz. Sadece bilgilendirme amaçlıdır.</span>
        </div>
      </div>

      {/* Notification History */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-gray-500" />
            <p className="text-sm font-semibold text-gray-900">Bildirim Geçmişi</p>
          </div>
          <span className="text-xs text-gray-400">{liste.length} kayıt</span>
        </div>

        {liste.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <CheckCircle className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Henüz bildirim yok.</p>
            <p className="text-xs text-gray-400 mt-1">AI analizi etkinleştirildiğinde bildirimler burada görünür.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {liste.map(b => (
              <div key={b.id} className={`px-6 py-4 ${b.okundu ? '' : 'bg-blue-50/30'}`}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">{b.haberBaslik}</p>
                  <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">{tarihFmt(b.olusturmaTarihi)}</span>
                </div>
                {b.etkilenenSemboller && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {b.etkilenenSemboller.split(',').map(s => (
                      <span key={s} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-sm text-gray-600 leading-relaxed">{b.mesaj}</p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
