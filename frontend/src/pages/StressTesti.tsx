import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell
} from 'recharts'
import { ShieldAlert, Play, ChevronRight } from 'lucide-react'
import { portfoyler } from '../services/api'
import { useAuth } from '../context/AuthContext'

interface Portfoy { id: number; ad: string }

interface Senaryo {
  ad: string
  donem: string
  onem: 'Düşük' | 'Orta' | 'Yüksek' | 'Aşırı'
  hisseGetiri: number
  dovizGetiri: number
  kriptoGetiri: number
  fonGetiri: number
}

const SENARYOLAR: Senaryo[] = [
  { ad: '2008 Finansal Krizi', donem: 'Eyl 2008 – Mar 2009', onem: 'Yüksek', hisseGetiri: -0.42, dovizGetiri: 0.38, kriptoGetiri: 0, fonGetiri: -0.30 },
  { ad: '2013 Fed Taper Krizi', donem: 'May 2013 – Oca 2014', onem: 'Orta', hisseGetiri: -0.20, dovizGetiri: 0.18, kriptoGetiri: -0.65, fonGetiri: -0.14 },
  { ad: '2018 Türkiye Döviz Krizi', donem: 'Ağu 2018', onem: 'Yüksek', hisseGetiri: -0.28, dovizGetiri: 0.52, kriptoGetiri: -0.58, fonGetiri: -0.18 },
  { ad: '2020 COVID', donem: 'Mar 2020', onem: 'Yüksek', hisseGetiri: -0.33, dovizGetiri: 0.14, kriptoGetiri: -0.48, fonGetiri: -0.22 },
  { ad: '2021-2022 Kripto Kışı', donem: 'Oca 2022 – Haz 2022', onem: 'Orta', hisseGetiri: -0.14, dovizGetiri: 0.08, kriptoGetiri: -0.72, fonGetiri: -0.09 },
  { ad: 'Aşırı Kötümser', donem: 'Özel Senaryo', onem: 'Aşırı', hisseGetiri: -0.55, dovizGetiri: 0.90, kriptoGetiri: -0.82, fonGetiri: -0.42 },
]

const TIP_GETIRI: Record<string, (s: Senaryo) => number> = {
  HISSE: s => s.hisseGetiri,
  DOVIZ:  s => s.dovizGetiri,
  KRIPTO: s => s.kriptoGetiri,
  FON:    s => s.fonGetiri,
}

const ONEM_RENK: Record<string, string> = {
  'Düşük': 'bg-green-100 text-green-700',
  'Orta': 'bg-yellow-100 text-yellow-700',
  'Yüksek': 'bg-orange-100 text-orange-700',
  'Aşırı': 'bg-red-100 text-red-700',
}

interface SonucSatir {
  ad: string
  donem: string
  onem: string
  stresliDeger: number
  degisimYuzde: number
}

export default function StressTesti() {
  const { userId } = useAuth()
  const [portfoyListesi, setPortfoyListesi] = useState<Portfoy[]>([])
  const [seciliPortfoy, setSeciliPortfoy] = useState<number | null>(null)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [mevcutDeger, setMevcutDeger] = useState(0)
  const [sonuclar, setSonuclar] = useState<SonucSatir[]>([])
  const [graficVeri, setGraficVeri] = useState<{ ad: string; degisim: number }[]>([])

  useEffect(() => {
    if (!userId) return
    portfoyler.kullanicinin(userId).then(r => {
      setPortfoyListesi(r.data)
      if (r.data.length > 0) setSeciliPortfoy(r.data[0].id)
    })
  }, [userId])

  const testCalistir = async () => {
    if (!seciliPortfoy) return
    setYukleniyor(true)

    const detay = await portfoyler.detay(seciliPortfoy)
    const varliklar: any[] = detay.data.varliklar ?? []
    const toplamDeger: number = varliklar.reduce((s: number, v: any) => s + ((v.guncelFiyat ?? 0) * (v.miktar ?? 0)), 0)
    setMevcutDeger(toplamDeger)

    const hesaplananSonuclar: SonucSatir[] = SENARYOLAR.map(senaryo => {
      let stresliDeger = 0
      varliklar.forEach((v: any) => {
        const tip: string = v.tip ?? 'HISSE'
        const getiriFn = TIP_GETIRI[tip] ?? TIP_GETIRI['HISSE']
        const getiri = getiriFn(senaryo)
        stresliDeger += ((v.guncelFiyat ?? 0) * (v.miktar ?? 0)) * (1 + getiri)
      })
      const degisimYuzde = toplamDeger > 0 ? ((stresliDeger - toplamDeger) / toplamDeger) * 100 : 0
      return {
        ad: senaryo.ad,
        donem: senaryo.donem,
        onem: senaryo.onem,
        stresliDeger,
        degisimYuzde: parseFloat(degisimYuzde.toFixed(1)),
      }
    })

    setSonuclar(hesaplananSonuclar)
    setGraficVeri(hesaplananSonuclar.map(s => ({
      ad: s.ad.replace('Türkiye ', 'TR ').replace('Finansal ', ''),
      degisim: s.degisimYuzde,
    })))
    setYukleniyor(false)
  }

  const enKotu = sonuclar.length ? sonuclar.reduce((a, b) => b.degisimYuzde < a.degisimYuzde ? b : a) : null
  const portfoyAdi = portfoyListesi.find(p => p.id === seciliPortfoy)?.ad ?? ''

  const formatPara = (v: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'decimal', maximumFractionDigits: 3 }).format(v) + ' TL'

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-6">
      <div className="flex items-center gap-3 mb-6">
        <ShieldAlert className="w-5 h-5 text-orange-500" />
        <h1 className="text-xl font-semibold text-gray-900">Kriz Stres Testi</h1>
        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">Eğitim amaçlı</span>
      </div>

      {/* Kontroller */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Portföy:</span>
          <select value={seciliPortfoy ?? ''} onChange={e => setSeciliPortfoy(Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500">
            {portfoyListesi.map(p => <option key={p.id} value={p.id}>{p.ad}</option>)}
          </select>
        </div>
        <button onClick={testCalistir} disabled={yukleniyor || !seciliPortfoy}
          className="flex items-center gap-2 px-4 py-1.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors">
          <Play className="w-4 h-4" />
          {yukleniyor ? 'Hesaplanıyor...' : 'Stres Testini Çalıştır'}
        </button>
      </div>

      {sonuclar.length > 0 && (
        <>
          {/* Özet */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 mb-6 grid grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-orange-600 mb-1">Portföy</p>
              <p className="font-semibold text-gray-900">{portfoyAdi}</p>
            </div>
            <div>
              <p className="text-xs text-orange-600 mb-1">Mevcut Değer</p>
              <p className="font-semibold text-gray-900">{formatPara(mevcutDeger)}</p>
            </div>
            <div>
              <p className="text-xs text-orange-600 mb-1">En Kötü Senaryo</p>
              <p className="font-semibold text-red-600">
                {enKotu ? `${enKotu.degisimYuzde.toFixed(1)}% (${formatPara(enKotu.stresliDeger)})` : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-orange-600 mb-1">Senaryolar</p>
              <p className="font-semibold text-gray-900">{sonuclar.length} senaryo</p>
            </div>
          </div>

          {/* Grafik */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Senaryo Bazında Portföy Değer Değişimi</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={graficVeri} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="ad" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                <ReferenceLine y={0} stroke="#d1d5db" />
                <Tooltip formatter={(v: any) => [`${Number(v).toFixed(1)}%`, 'Değişim']} />
                <Bar dataKey="degisim" radius={[4, 4, 0, 0]}>
                  {graficVeri.map((entry, i) => (
                    <Cell key={i} fill={entry.degisim >= 0 ? '#22c55e' : '#f97316'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Senaryo Kartları */}
          <div className="space-y-3">
            {sonuclar.map((s, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center gap-4">
                <div className={`w-1.5 h-10 rounded-full ${s.degisimYuzde >= 0 ? 'bg-green-400' : 'bg-orange-400'}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-900">{s.ad}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ONEM_RENK[s.onem]}`}>{s.onem}</span>
                  </div>
                  <p className="text-xs text-gray-500">{s.donem}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatPara(s.stresliDeger)}</p>
                  <p className={`text-sm font-semibold ${s.degisimYuzde >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {s.degisimYuzde > 0 ? '+' : ''}{s.degisimYuzde.toFixed(1)}%
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            ))}
          </div>
        </>
      )}

      {sonuclar.length === 0 && !yukleniyor && (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <ShieldAlert className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Portföy seçip "Stres Testini Çalıştır" butonuna tıklayın.</p>
          <p className="text-xs text-gray-400 mt-1">Tarihsel kriz senaryolarında portföyünüzün nasıl etkileneceğini görün.</p>
        </div>
      )}
    </div>
  )
}
