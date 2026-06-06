import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { portfoyler, yatirimAraclari } from '../services/api'
import { useAuth } from '../context/AuthContext'
import {
  PlusCircle, Trash2, TrendingUp, TrendingDown,
  Briefcase, BarChart2, X, Wallet, ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react'
import AiAsistan from '../components/AiAsistan'

interface Varlik {
  id: number
  yatirimAraciId: number
  sembol: string
  enstrumanAdi: string
  miktar: number
  ortalamaMaliyet: number
  guncelFiyat: number
  nominalKarZarar: number
  agirlik: number
  gunlukDegisimYuzde: number | null
  tip: string
}

interface Portfoy {
  id: number
  ad: string
  toplamDeger: number
  toplamMaliyet: number
  nominalGetiri: number
  nominalGetiriYuzde: number
  varlikSayisi: number
}

interface PortfoyDetay extends Portfoy {
  varliklar: Varlik[]
}

interface Araci { id: number; sembol: string; ad: string; tip: string }

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#84cc16']
const fmt = (n: number, d = 2) => n?.toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d }) ?? '—'

export default function Portfoy() {
  const { userId } = useAuth()
  const [portfoyListesi, setPortfoyListesi] = useState<Portfoy[]>([])
  const [seciliPortfoy, setSeciliPortfoy] = useState<PortfoyDetay | null>(null)
  const [loading, setLoading] = useState(true)
  const [yeniPortfoyModal, setYeniPortfoyModal] = useState(false)
  const [varlikModal, setVarlikModal] = useState(false)
  const [yeniAd, setYeniAd] = useState('')
  const [aracilar, setAracilar] = useState<Araci[]>([])
  const [seciliAraciId, setSeciliAraciId] = useState('')
  const [miktar, setMiktar] = useState('')
  const [maliyet, setMaliyet] = useState('')

  useEffect(() => {
    if (!userId) return
    portfoylerYukle()
    yatirimAraclari.tumunu().then(r => setAracilar(r.data)).catch(() => {})
  }, [userId])

  const portfoylerYukle = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await portfoyler.kullanicinin(userId)
      setPortfoyListesi(res.data)
      if (res.data.length > 0 && !seciliPortfoy) {
        await portfoySecildi(res.data[0].id)
      }
    } catch { setPortfoyListesi([]) }
    finally { setLoading(false) }
  }

  const portfoySecildi = async (id: number) => {
    try {
      const res = await portfoyler.detay(id)
      setSeciliPortfoy(res.data)
    } catch {}
  }

  const portfoyOlustur = async () => {
    if (!yeniAd.trim() || !userId) return
    try {
      await portfoyler.olustur(userId, { ad: yeniAd })
      setYeniAd('')
      setYeniPortfoyModal(false)
      portfoylerYukle()
    } catch (e: any) { alert(e?.response?.data?.message ?? 'Portföy oluşturulamadı.') }
  }

  const varlikEkle = async () => {
    if (!seciliPortfoy || !seciliAraciId || !miktar || !maliyet) return
    try {
      await portfoyler.varlikEkle(seciliPortfoy.id, {
        yatirimAraciId: Number(seciliAraciId),
        miktar: Number(miktar),
        ortalamaMaliyet: Number(maliyet),
        alisTarihi: new Date().toISOString(),
      })
      setSeciliAraciId(''); setMiktar(''); setMaliyet('')
      setVarlikModal(false)
      portfoySecildi(seciliPortfoy.id)
      portfoylerYukle()
    } catch (e: any) { alert(e?.response?.data?.message ?? 'Varlık eklenemedi.') }
  }

  const varlikSil = async (varlikId: number) => {
    if (!window.confirm('Bu varlığı portföyden çıkarmak istiyor musunuz?')) return
    try {
      await portfoyler.varlikSil(varlikId)
      if (seciliPortfoy) portfoySecildi(seciliPortfoy.id)
      portfoylerYukle()
    } catch {}
  }

  const pastaVerisi = seciliPortfoy?.varliklar?.map(v => ({
    name: v.sembol,
    value: Number((v.agirlik ?? 0).toFixed(2)),
  })) ?? []

  if (loading) return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 animate-pulse space-y-4">
      <div className="h-8 bg-gray-100 rounded w-48" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{[...Array(4)].map((_,i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}</div>
    </div>
  )

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Portföy Yönetimi</h2>
        <button onClick={() => setYeniPortfoyModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
          <PlusCircle className="w-4 h-4" />Yeni Portföy
        </button>
      </div>

      {portfoyListesi.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Briefcase className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-600 font-medium mb-1">Henüz portföy oluşturmadınız</p>
          <p className="text-sm text-gray-400 mb-6">Yatırımlarınızı takip etmek için ilk portföyünüzü oluşturun.</p>
          <button onClick={() => setYeniPortfoyModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            <PlusCircle className="w-4 h-4" />Portföy Oluştur
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sol: Portföy listesi */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Portföylerim</p>
            {portfoyListesi.map(p => {
              const pozitif = (p.nominalGetiriYuzde ?? 0) >= 0
              return (
                <button key={p.id} onClick={() => portfoySecildi(p.id)} className={`w-full text-left p-4 rounded-xl border transition-all ${seciliPortfoy?.id === p.id ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 bg-white hover:border-blue-300'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Briefcase className={`w-4 h-4 ${seciliPortfoy?.id === p.id ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">{p.ad}</span>
                    </div>
                    <span className="text-xs text-gray-400">{p.varlikSayisi} varlık</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">₺{fmt(p.toplamDeger)}</div>
                  <div className={`text-xs font-medium mt-0.5 flex items-center gap-1 ${pozitif ? 'text-green-600' : 'text-red-500'}`}>
                    {pozitif ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {pozitif ? '+' : '-'}₺{fmt(Math.abs(p.nominalGetiri))} ({pozitif ? '+' : ''}{fmt(p.nominalGetiriYuzde)}%)
                  </div>
                </button>
              )
            })}
          </div>

          {/* Sağ: Portföy detayı */}
          <div className="lg:col-span-3 space-y-6">
            {seciliPortfoy ? (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Wallet className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <span className="text-xs text-gray-500">Toplam Değer</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">₺{fmt(seciliPortfoy.toplamDeger)}</p>
                    <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-1 bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (seciliPortfoy.toplamDeger / (seciliPortfoy.toplamMaliyet || 1)) * 50)}%` }} />
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                        <Activity className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <span className="text-xs text-gray-500">Toplam Maliyet</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">₺{fmt(seciliPortfoy.toplamMaliyet)}</p>
                    <p className="text-xs text-gray-400 mt-1">{seciliPortfoy.varlikSayisi ?? seciliPortfoy.varliklar?.length ?? 0} varlık</p>
                  </div>
                  <div className={`rounded-xl border p-4 ${seciliPortfoy.nominalGetiri >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${seciliPortfoy.nominalGetiri >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                        {seciliPortfoy.nominalGetiri >= 0
                          ? <ArrowUpRight className="w-3.5 h-3.5 text-green-700" />
                          : <ArrowDownRight className="w-3.5 h-3.5 text-red-600" />}
                      </div>
                      <span className={`text-xs ${seciliPortfoy.nominalGetiri >= 0 ? 'text-green-700' : 'text-red-600'}`}>Nominal Getiri</span>
                    </div>
                    <p className={`text-lg font-bold ${seciliPortfoy.nominalGetiri >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {seciliPortfoy.nominalGetiri >= 0 ? '+' : '-'}₺{fmt(Math.abs(seciliPortfoy.nominalGetiri))}
                    </p>
                    <p className={`text-xs mt-1 font-medium ${seciliPortfoy.nominalGetiri >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {seciliPortfoy.nominalGetiri >= 0 ? '▲' : '▼'} kar/zarar
                    </p>
                  </div>
                  <div className={`rounded-xl border p-4 ${seciliPortfoy.nominalGetiriYuzde >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${seciliPortfoy.nominalGetiriYuzde >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                        {seciliPortfoy.nominalGetiriYuzde >= 0
                          ? <TrendingUp className="w-3.5 h-3.5 text-green-700" />
                          : <TrendingDown className="w-3.5 h-3.5 text-red-600" />}
                      </div>
                      <span className={`text-xs ${seciliPortfoy.nominalGetiriYuzde >= 0 ? 'text-green-700' : 'text-red-600'}`}>Getiri %</span>
                    </div>
                    <p className={`text-2xl font-bold ${seciliPortfoy.nominalGetiriYuzde >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {seciliPortfoy.nominalGetiriYuzde >= 0 ? '+' : ''}{fmt(seciliPortfoy.nominalGetiriYuzde)}%
                    </p>
                    <div className="mt-1.5 h-1.5 bg-white/60 rounded-full overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${seciliPortfoy.nominalGetiriYuzde >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(100, Math.abs(seciliPortfoy.nominalGetiriYuzde) * 2)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {pastaVerisi.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <div className="flex items-center gap-2 mb-4"><BarChart2 className="w-4 h-4 text-gray-400" /><h3 className="text-sm font-semibold text-gray-900">Dağılım</h3></div>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={pastaVerisi} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                            {pastaVerisi.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v: number) => [`%${fmt(v)}`, 'Ağırlık']} contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                          <Legend iconSize={8} formatter={(v) => <span className="text-xs text-gray-700">{v}</span>} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${pastaVerisi.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-900">Varlıklar</h3>
                      <button onClick={() => setVarlikModal(true)} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"><PlusCircle className="w-3 h-3" />Varlık Ekle</button>
                    </div>
                    {!seciliPortfoy.varliklar?.length ? (
                      <div className="text-center py-10 text-sm text-gray-400">Henüz varlık eklenmemiş.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead><tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-100 bg-gray-50">
                            <th className="px-4 py-2">Sembol</th><th className="px-4 py-2 text-right">Miktar</th><th className="px-4 py-2 text-right">Ort.Maliyet</th><th className="px-4 py-2 text-right">Güncel</th><th className="px-4 py-2 text-right">Günlük %</th><th className="px-4 py-2 text-right">K/Z</th><th className="px-4 py-2 text-right">Ağırlık</th><th className="px-4 py-2"></th>
                          </tr></thead>
                          <tbody className="divide-y divide-gray-50">
                            {seciliPortfoy.varliklar.map(v => {
                              const poz = v.nominalKarZarar >= 0
                              const gdp = v.gunlukDegisimYuzde
                              const gdpPoz = gdp !== null && gdp !== undefined ? gdp >= 0 : null
                              return (
                                <tr key={v.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3"><div className="font-medium text-sm text-blue-600">{v.sembol}</div><div className="text-xs text-gray-400 truncate max-w-[100px]">{v.enstrumanAdi}</div></td>
                                  <td className="px-4 py-3 text-right text-sm text-gray-700">{fmt(v.miktar, 4)}</td>
                                  <td className="px-4 py-3 text-right text-sm text-gray-700">₺{fmt(v.ortalamaMaliyet)}</td>
                                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">₺{fmt(v.guncelFiyat)}</td>
                                  <td className="px-4 py-3 text-right text-sm font-medium">
                                    {gdp !== null && gdp !== undefined ? (
                                      <span className={`inline-flex items-center gap-0.5 justify-end ${gdpPoz ? 'text-green-600' : 'text-red-500'}`}>
                                        {gdpPoz ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                        {gdpPoz ? '+' : ''}{fmt(gdp)}%
                                      </span>
                                    ) : <span className="text-gray-300 text-right block">—</span>}
                                  </td>
                                  <td className={`px-4 py-3 text-right text-sm font-medium ${poz ? 'text-green-600' : 'text-red-500'}`}>{poz ? '+' : '-'}₺{fmt(Math.abs(v.nominalKarZarar))}</td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <div className="w-16 bg-gray-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${Math.min(v.agirlik, 100)}%` }} /></div>
                                      <span className="text-xs text-gray-500 w-10 text-right">{fmt(v.agirlik)}%</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3"><button onClick={() => varlikSil(v.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button></td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Sol taraftan bir portföy seçin.</div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Yeni Portföy */}
      {yeniPortfoyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-semibold text-gray-900">Yeni Portföy Oluştur</h3><button onClick={() => setYeniPortfoyModal(false)}><X className="w-4 h-4 text-gray-400" /></button></div>
            <input type="text" placeholder="Portföy adı" value={yeniAd} onChange={e => setYeniAd(e.target.value)} onKeyDown={e => e.key === 'Enter' && portfoyOlustur()} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4" autoFocus />
            <div className="flex justify-end gap-2">
              <button onClick={() => setYeniPortfoyModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">İptal</button>
              <button onClick={portfoyOlustur} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Oluştur</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Yatırım Asistanı */}
      <AiAsistan portfoy={seciliPortfoy ? {
        ad: seciliPortfoy.ad,
        toplamDeger: seciliPortfoy.toplamDeger,
        toplamMaliyet: seciliPortfoy.toplamMaliyet,
        nominalGetiriYuzde: seciliPortfoy.nominalGetiriYuzde,
        varliklar: (seciliPortfoy.varliklar ?? []).map(v => ({
          sembol: v.sembol,
          enstrumanAdi: v.enstrumanAdi,
          agirlik: v.agirlik,
          nominalKarZarar: v.nominalKarZarar,
        })),
      } : null} />

      {/* Modal: Varlık Ekle */}
      {varlikModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-semibold text-gray-900">Portföye Varlık Ekle</h3><button onClick={() => setVarlikModal(false)}><X className="w-4 h-4 text-gray-400" /></button></div>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Enstrüman</label>
                <select value={seciliAraciId} onChange={e => setSeciliAraciId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">Seçiniz...</option>
                  {aracilar.map(a => <option key={a.id} value={a.id}>{a.sembol} — {a.ad}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-500 mb-1 block">Miktar</label><input type="number" min="0" step="any" value={miktar} onChange={e => setMiktar(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" /></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Ort. Maliyet (₺)</label><input type="number" min="0" step="any" value={maliyet} onChange={e => setMaliyet(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" /></div>
              </div>
              {miktar && maliyet && <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">Toplam maliyet: <strong>₺{fmt(Number(miktar) * Number(maliyet))}</strong></div>}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setVarlikModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">İptal</button>
              <button onClick={varlikEkle} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Ekle</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
