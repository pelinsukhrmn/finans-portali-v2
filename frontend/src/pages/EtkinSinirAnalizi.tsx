import { useEffect, useState } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Line, ComposedChart, ReferenceDot
} from 'recharts'
import { TrendingUp, Play, Info } from 'lucide-react'
import { portfoyler, piyasaVerileri } from '../services/api'
import { useAuth } from '../context/AuthContext'

interface Portfoy { id: number; ad: string }
interface Varlik { sembol: string; agirlik: number }
interface SimNokta { risk: number; getiri: number; sharpe: number; agirliklar?: number[] }

const ARALIK_SECENEKLER = [
  { label: '1H', days: 7 },
  { label: '1A', days: 30 },
  { label: '3A', days: 90 },
  { label: '1Y', days: 365 },
]

const N_SIMULASYON = 1500
const RISK_FREE = 0.0

function gunlukGetiriler(fiyatlar: number[]): number[] {
  const ret: number[] = []
  for (let i = 1; i < fiyatlar.length; i++) {
    ret.push((fiyatlar[i] - fiyatlar[i - 1]) / fiyatlar[i - 1])
  }
  return ret
}

function ortalama(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
}

function stdSapma(arr: number[]): number {
  const ort = ortalama(arr)
  const varyans = arr.reduce((s, x) => s + (x - ort) ** 2, 0) / arr.length
  return Math.sqrt(varyans)
}

export default function EtkinSinirAnalizi() {
  const { userId } = useAuth()
  const [portfoyListesi, setPortfoyListesi] = useState<Portfoy[]>([])
  const [seciliPortfoy, setSeciliPortfoy] = useState<number | null>(null)
  const [aralik, setAralik] = useState(90)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [noktalar, setNoktalar] = useState<SimNokta[]>([])
  const [mevcutPortfoy, setMevcutPortfoy] = useState<SimNokta | null>(null)
  const [minRisk, setMinRisk] = useState<SimNokta | null>(null)
  const [maxSharpe, setMaxSharpe] = useState<SimNokta | null>(null)
  const [hata, setHata] = useState('')

  useEffect(() => {
    if (!userId) return
    portfoyler.kullanicinin(userId).then(r => {
      setPortfoyListesi(r.data)
      if (r.data.length > 0) setSeciliPortfoy(r.data[0].id)
    })
  }, [userId])

  const analizeEt = async () => {
    if (!seciliPortfoy) return
    setYukleniyor(true)
    setHata('')
    setNoktalar([])

    try {
      const detay = await portfoyler.detay(seciliPortfoy)
      const varliklar: any[] = detay.data.varliklar ?? []
      if (varliklar.length < 2) {
        setHata('Etkin sınır analizi için portföyde en az 2 varlık olmalıdır.')
        setYukleniyor(false)
        return
      }

      const bitis = new Date()
      const baslangic = new Date()
      baslangic.setDate(bitis.getDate() - aralik)
      const bas = baslangic.toISOString().replace('Z', '').split('.')[0]
      const bit = bitis.toISOString().replace('Z', '').split('.')[0]

      const fiyatVerileri = await Promise.all(
        varliklar.map(v => piyasaVerileri.tarihsel(v.yatirimAraciId, bas, bit))
      )

      const getiriDizileri = fiyatVerileri.map(r => {
        const fiyatlar = (r.data as any[]).map((d: any) => d.kapanisFiyati ?? d.fiyat ?? 0)
        return gunlukGetiriler(fiyatlar)
      })

      const minLen = Math.min(...getiriDizileri.map(g => g.length))
      if (minLen < 5) {
        setHata('Yeterli tarihsel veri bulunamadı.')
        setYukleniyor(false)
        return
      }

      const kesilen = getiriDizileri.map(g => g.slice(g.length - minLen))
      const yillikOrt = kesilen.map(g => ortalama(g) * 252)
      const yillikStd = kesilen.map(g => stdSapma(g) * Math.sqrt(252))

      // Mevcut portföy ağırlıkları
      const toplamDeger = varliklar.reduce((s, v) => s + ((v.guncelFiyat ?? 0) * (v.miktar ?? 0)), 0)
      const mevcutAg = toplamDeger > 0
        ? varliklar.map(v => ((v.guncelFiyat ?? 0) * (v.miktar ?? 0)) / toplamDeger)
        : varliklar.map(() => 1 / varliklar.length)

      const n = varliklar.length
      const simNoktalar: SimNokta[] = []

      for (let s = 0; s < N_SIMULASYON; s++) {
        const raw = Array.from({ length: n }, () => Math.random())
        const toplam = raw.reduce((a, b) => a + b, 0)
        const ag = raw.map(r => r / toplam)

        const getiri = ag.reduce((sum, w, i) => sum + w * yillikOrt[i], 0)
        let varyans = 0
        for (let i = 0; i < n; i++) {
          varyans += ag[i] ** 2 * yillikStd[i] ** 2
        }
        const risk = Math.sqrt(Math.max(varyans, 0))
        const sharpe = risk > 0 ? (getiri - RISK_FREE) / risk : 0
        simNoktalar.push({ risk: parseFloat((risk * 100).toFixed(2)), getiri: parseFloat((getiri * 100).toFixed(2)), sharpe: parseFloat(sharpe.toFixed(2)), agirliklar: ag })
      }

      const mevcutGetiri = mevcutAg.reduce((s, w, i) => s + w * yillikOrt[i], 0)
      let mevcutVaryans = 0
      for (let i = 0; i < n; i++) mevcutVaryans += mevcutAg[i] ** 2 * yillikStd[i] ** 2
      const mevcutRisk = Math.sqrt(Math.max(mevcutVaryans, 0))
      setMevcutPortfoy({ risk: parseFloat((mevcutRisk * 100).toFixed(2)), getiri: parseFloat((mevcutGetiri * 100).toFixed(2)), sharpe: 0 })

      const minR = simNoktalar.reduce((a, b) => b.risk < a.risk ? b : a)
      const maxS = simNoktalar.reduce((a, b) => b.sharpe > a.sharpe ? b : a)
      setMinRisk(minR)
      setMaxSharpe(maxS)
      setNoktalar(simNoktalar)
    } catch {
      setHata('Veri yüklenirken hata oluştu.')
    }
    setYukleniyor(false)
  }

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props
    if (!payload) return null
    const s = payload.sharpe ?? 0
    const alpha = Math.min(0.8, Math.max(0.15, (s + 2) / 4))
    return <circle cx={cx} cy={cy} r={3} fill={`rgba(99,102,241,${alpha})`} />
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-6">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <h1 className="text-xl font-semibold text-gray-900">Etkin Sınır Analizi</h1>
        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">Modern Portföy Teorisi</span>
        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">Demo</span>
      </div>

      {/* Kontroller */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Portföy:</span>
          <select
            value={seciliPortfoy ?? ''}
            onChange={e => setSeciliPortfoy(Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {portfoyListesi.map(p => <option key={p.id} value={p.id}>{p.ad}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-500 mr-1">Veri:</span>
          {ARALIK_SECENEKLER.map(a => (
            <button key={a.days} onClick={() => setAralik(a.days)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${aralik === a.days ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {a.label}
            </button>
          ))}
        </div>
        <button onClick={analizeEt} disabled={yukleniyor || !seciliPortfoy}
          className="flex items-center gap-2 px-4 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
          <Play className="w-4 h-4" />
          {yukleniyor ? 'Hesaplanıyor...' : 'Analiz Et'}
        </button>
      </div>

      {/* Açıklama */}
      {noktalar.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex gap-3">
          <Info className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
          <div className="text-sm text-green-800 space-y-0.5">
            <p><span className="font-medium">Monte Carlo Simülasyonu:</span> {N_SIMULASYON.toLocaleString()} rastgele ağırlık kombinasyonu için risk-getiri çifti hesaplanır.</p>
            <p><span className="font-medium">Etkin Sınır:</span> Her risk seviyesinde mümkün olan en yüksek getiriyi gösteren eğri.</p>
            <p><span className="font-medium">Maksimum Sharpe:</span> Risk başına en yüksek fazla getiriyi sağlayan portföy (yıldız).</p>
          </div>
        </div>
      )}

      {hata && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">{hata}</div>
      )}

      {/* Grafik */}
      {noktalar.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Monte Carlo Portföy Uzayı</h2>
          <p className="text-xs text-gray-400 mb-4">Her nokta bir portföy kombinasyonunu temsil eder. Renkli Sharpe oranını gösterir.</p>
          <ResponsiveContainer width="100%" height={420}>
            <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="risk" name="Risk (%)" type="number" domain={['auto', 'auto']}
                label={{ value: 'Yıllık Risk Standart Sapması (%)', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#9ca3af' }}
                tickFormatter={(v) => `${v.toFixed(0)}%`} tick={{ fontSize: 11 }} />
              <YAxis dataKey="getiri" name="Getiri (%)" type="number" domain={['auto', 'auto']}
                label={{ value: 'Yıllık Beklenen Getiri (%)', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#9ca3af' }}
                tickFormatter={(v) => `${v.toFixed(0)}%`} tick={{ fontSize: 11 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }}
                formatter={(v: any, name: string) => [`${Number(v).toFixed(2)}%`, name]}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  return (
                    <div className="bg-white border border-gray-200 rounded-lg shadow p-2 text-xs">
                      <p>Risk: <span className="font-medium">{d.risk}%</span></p>
                      <p>Getiri: <span className="font-medium">{d.getiri}%</span></p>
                      <p>Sharpe: <span className="font-medium">{d.sharpe}</span></p>
                    </div>
                  )
                }} />
              <Scatter name="Portföyler" data={noktalar} shape={<CustomDot />} />
              {mevcutPortfoy && (
                <Scatter name="Mevcut Portföy" data={[mevcutPortfoy]}
                  shape={(p: any) => <circle cx={p.cx} cy={p.cy} r={7} fill="#3b82f6" stroke="white" strokeWidth={2} />} />
              )}
              {minRisk && (
                <Scatter name="Min. Risk Portföy" data={[minRisk]}
                  shape={(p: any) => (
                    <polygon points={`${p.cx},${p.cy - 9} ${p.cx - 8},${p.cy + 6} ${p.cx + 8},${p.cy + 6}`}
                      fill="#eab308" stroke="white" strokeWidth={2} />
                  )} />
              )}
              {maxSharpe && (
                <Scatter name="Max Sharpe Portföy" data={[maxSharpe]}
                  shape={(p: any) => (
                    <polygon points={`${p.cx},${p.cy - 9} ${p.cx - 8},${p.cy + 6} ${p.cx + 8},${p.cy + 6}`}
                      fill="#f97316" stroke="white" strokeWidth={2} />
                  )} />
              )}
              <Legend verticalAlign="bottom" height={36} iconSize={10}
                wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
            </ScatterChart>
          </ResponsiveContainer>

          {/* Özet kartlar */}
          {(minRisk || maxSharpe) && (
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
              {mevcutPortfoy && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-xs font-medium text-blue-800">Mevcut Portföy</span>
                  </div>
                  <p className="text-sm text-blue-900">Risk: <span className="font-semibold">{mevcutPortfoy.risk}%</span></p>
                  <p className="text-sm text-blue-900">Getiri: <span className="font-semibold">{mevcutPortfoy.getiri}%</span></p>
                </div>
              )}
              {minRisk && (
                <div className="bg-yellow-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-yellow-400" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
                    <span className="text-xs font-medium text-yellow-800">Min. Risk Portföy</span>
                  </div>
                  <p className="text-sm text-yellow-900">Risk: <span className="font-semibold">{minRisk.risk}%</span></p>
                  <p className="text-sm text-yellow-900">Getiri: <span className="font-semibold">{minRisk.getiri}%</span></p>
                </div>
              )}
              {maxSharpe && (
                <div className="bg-orange-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-orange-500" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
                    <span className="text-xs font-medium text-orange-800">Max Sharpe Portföy</span>
                  </div>
                  <p className="text-sm text-orange-900">Risk: <span className="font-semibold">{maxSharpe.risk}%</span></p>
                  <p className="text-sm text-orange-900">Sharpe: <span className="font-semibold">{maxSharpe.sharpe}</span></p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {noktalar.length === 0 && !yukleniyor && !hata && (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Portföy seçip "Analiz Et" butonuna tıklayın.</p>
        </div>
      )}
    </div>
  )
}
