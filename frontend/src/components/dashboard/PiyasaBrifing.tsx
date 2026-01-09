import { useState } from 'react'
import { Sparkles, Loader2, Newspaper } from 'lucide-react'
import { aiAsistan } from '../../services/api'

const PIYASA_OZETI = `BIST 100: +0.82%, USD/TRY: -0.45%, EUR/TRY: +0.32%, Altın: +1.12%, BTC: +1.74%, ETH: -0.58%`

export default function PiyasaBrifing() {
  const [brifing, setBrifing] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [tarih] = useState(() =>
    new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
  )

  const brifingAl = async () => {
    setLoading(true)
    setBrifing(null)
    try {
      const prompt = `Bugün (${tarih}) için kısa bir Türk piyasası brifing yaz. Mevcut göstergeler: ${PIYASA_OZETI}. Bu verilere dayanarak genel piyasa durumunu, öne çıkan hareketleri ve yatırımcıların dikkat etmesi gereken noktaları 3-4 cümleyle özetle. Sade ve anlaşılır Türkçe kullan.`
      const res = await aiAsistan.marketBriefing(prompt)
      setBrifing(res.data.cevap)
    } catch {
      setBrifing('Gemini AI şu anda yanıt veremiyor. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-purple-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-purple-500" />
          <h3 className="text-sm font-semibold text-gray-900">Günlük Piyasa Brifing</h3>
        </div>
        <button onClick={brifingAl} disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
          {loading
            ? <><Loader2 className="w-3 h-3 animate-spin" /> Hazırlanıyor...</>
            : <><Sparkles className="w-3 h-3" /> {brifing ? 'Yenile' : 'Brifing Al'}</>
          }
        </button>
      </div>

      {brifing ? (
        <div className="bg-purple-50 rounded-lg p-3 text-xs text-gray-700 leading-relaxed whitespace-pre-line">
          {brifing}
        </div>
      ) : (
        <p className="text-xs text-gray-400">
          Günün piyasa özetini Gemini AI ile oluşturmak için butona tıklayın.
        </p>
      )}

      <p className="text-[10px] text-gray-400 mt-2">{tarih} · Yatırım tavsiyesi niteliği taşımaz.</p>
    </div>
  )
}
