import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
})

let isRefreshing = false
let refreshQueue: Array<() => void> = []

// Try to refresh the Keycloak token before reloading on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push(() => resolve(api(error.config)))
        })
      }
      isRefreshing = true
      try {
        const { default: keycloak } = await import('../keycloak')
        if (keycloak.authenticated) {
          await keycloak.updateToken(30)
          if (keycloak.token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${keycloak.token}`
            refreshQueue.forEach((cb) => cb())
            refreshQueue = []
            return api(error.config)
          }
        }
      } catch {
        // Token refresh failed — fall through to reload
      } finally {
        isRefreshing = false
        refreshQueue = []
      }
      window.location.reload()
    }
    return Promise.reject(error)
  }
)

// ── Yatırım Araçları ──────────────────────────────────────────
export const yatirimAraclari = {
  tumunu:    ()             => api.get('/yatirim-araclari'),
  tipeGore:  (tip: string)  => api.get(`/yatirim-araclari?tip=${tip}`),
  ara:       (q: string)    => api.get(`/yatirim-araclari/ara?q=${q}`),
  sembolIle: (s: string)    => api.get(`/yatirim-araclari/sembol/${s}`),
  detay:     (id: number)   => api.get(`/yatirim-araclari/${id}`),
}

// ── Piyasa Verileri ───────────────────────────────────────────
export const piyasaVerileri = {
  guncel:     ()                                           => api.get('/piyasa-verileri/guncel'),
  yukselen:   (limit = 5)                                  => api.get(`/piyasa-verileri/yukselen?limit=${limit}`),
  dusen:      (limit = 5)                                  => api.get(`/piyasa-verileri/dusen?limit=${limit}`),
  sonByAraci: (araciId: number)                            => api.get(`/piyasa-verileri/${araciId}/son`),
  tarihsel:   (araciId: number, bas: string, bit: string)  => api.get(`/piyasa-verileri/${araciId}/tarihsel`, { params: { baslangic: bas, bitis: bit } }),
}

// ── Haberler ──────────────────────────────────────────────────
export const haberler = {
  tumunu:      ()           => api.get('/haberler/son'),
  kategoriIle: (k: string)  => api.get(`/haberler/kategori/${k}`),
  ara:         (q: string)  => api.get(`/haberler/ara?q=${q}`),
}

// ── Portföy ───────────────────────────────────────────────────
export const portfoyler = {
  kullanicinin: (kullaniciId: number) =>
    api.get(`/portfoyler?kullaniciId=${kullaniciId}`),
  detay: (portfoyId: number) =>
    api.get(`/portfoyler/${portfoyId}`),
  olustur: (kullaniciId: number, body: { ad: string }) =>
    api.post(`/portfoyler?kullaniciId=${kullaniciId}`, body),
  guncelle: (portfoyId: number, body: { ad: string }) =>
    api.put(`/portfoyler/${portfoyId}`, body),
  sil: (portfoyId: number) =>
    api.delete(`/portfoyler/${portfoyId}`),
  varlikEkle: (portfoyId: number, body: {
    yatirimAraciId: number
    miktar: number
    ortalamaMaliyet: number
    alisTarihi: string
  }) => api.post(`/portfoyler/${portfoyId}/varliklar`, body),
  varlikSil: (varlikId: number) =>
    api.delete(`/portfoyler/varliklar/${varlikId}`),
}

// ── Kullanıcı ─────────────────────────────────────────────────
export const kullanicilar = {
  sync: (body: { keycloakId: string; eposta: string; adSoyad: string }) =>
    api.post('/kullanicilar/sync', body),
}

// ── Takip Listesi ─────────────────────────────────────────────
export const takipListesi = {
  kullanicinin: (kullaniciId: number) =>
    api.get(`/takip-listesi?kullaniciId=${kullaniciId}`),
  ekle: (kullaniciId: number, araciId: number) =>
    api.post(`/takip-listesi?kullaniciId=${kullaniciId}`, { yatirimAraciId: araciId }),
  sil: (kullaniciId: number, araciId: number) =>
    api.delete(`/takip-listesi?kullaniciId=${kullaniciId}&araciId=${araciId}`),
}

// ── AI Yatırım Asistanı ───────────────────────────────────────
export const aiAsistan = {
  oturumOlustur: (kullaniciId: number, baslik?: string) =>
    api.post(`/ai/sessions/${kullaniciId}`, { baslik: baslik ?? 'Yeni Sohbet' }),

  oturumlariGetir: (kullaniciId: number) =>
    api.get(`/ai/sessions/${kullaniciId}`),

  mesajlariGetir: (seansId: number) =>
    api.get(`/ai/sessions/${seansId}/mesajlar`),

  tavsiyeAl: (seansId: number, soru: string, portfoyOzeti: {
    ad: string
    toplamDeger: number
    toplamMaliyet: number
    nominalGetiriYuzde: number
    varliklar: { sembol: string; enstrumanAdi: string; agirlik: number; nominalKarZarar: number }[]
  }) => api.post('/ai/tavsiye', { seansId, soru, portfoyOzeti }),

  portfolioInsight: (kullaniciId: number) =>
    api.get(`/ai/portfolio-insight/${kullaniciId}`),

  marketBriefing: (prompt: string) =>
    api.post('/ai/market-briefing', { prompt }),

  haberOzeti: (baslik: string, icerik: string) =>
    api.post('/ai/haber-ozeti', { baslik, icerik }),
}

// ── AI Bildirimler ────────────────────────────────────────────
export const bildirimler = {
  ayarlariGetir: (kullaniciId: number) =>
    api.get(`/bildirimler/ayarlar?kullaniciId=${kullaniciId}`),
  ayarlariGuncelle: (kullaniciId: number, body: Record<string, boolean>) =>
    api.put(`/bildirimler/ayarlar?kullaniciId=${kullaniciId}`, body),
  listele: (kullaniciId: number, limit = 20) =>
    api.get(`/bildirimler?kullaniciId=${kullaniciId}&limit=${limit}`),
  okunmamisSayi: (kullaniciId: number) =>
    api.get(`/bildirimler/okunmamis-sayi?kullaniciId=${kullaniciId}`),
  okunduIsaretle: (id: number, kullaniciId: number) =>
    api.put(`/bildirimler/${id}/okundu?kullaniciId=${kullaniciId}`),
  hepsiniOkundu: (kullaniciId: number) =>
    api.put(`/bildirimler/hepsini-okundu?kullaniciId=${kullaniciId}`),
  haberEtkiler: (kullaniciId: number) =>
    api.get(`/bildirimler/haber-etkiler?kullaniciId=${kullaniciId}`),
}

// ── Veri Güncelleme (Admin) ───────────────────────────────────
export const veriGuncelleme = {
  hisse:         () => api.post('/veri-guncelleme/hisse'),
  tcmb:          () => api.post('/veri-guncelleme/tcmb'),
  kripto:        () => api.post('/veri-guncelleme/kripto'),
  haberler:      () => api.post('/veri-guncelleme/haberler'),
  analizTetikle: () => api.post('/veri-guncelleme/analiz-tetikle'),
}

// ── Ekonomik Takvim ───────────────────────────────────────────
export const ekonomikTakvim = {
  listele: (aralik?: string, ulke?: string, onem?: number) =>
    api.get('/ekonomik-takvim', { params: { aralik, ulke, onem } }),
}

// ── Tahmin Defteri ────────────────────────────────────────────
export const tahminler = {
  listele: (kullaniciId: number) =>
    api.get(`/tahminler?kullaniciId=${kullaniciId}`),
  ekle: (kullaniciId: number, body: {
    yatirimAraciId: number
    hedefFiyat: number
    mevcutFiyat?: number
    hedefTarih: string
    notlar?: string
  }) => api.post(`/tahminler?kullaniciId=${kullaniciId}`, body),
  durumGuncelle: (id: number, kullaniciId: number, durum: string) =>
    api.put(`/tahminler/${id}/durum?kullaniciId=${kullaniciId}`, { durum }),
  sil: (id: number, kullaniciId: number) =>
    api.delete(`/tahminler/${id}?kullaniciId=${kullaniciId}`),
}

// ── Geri Test (Backtesting) ───────────────────────────────────
export const geriTest = {
  calistir: (body: {
    araciId: number
    strateji: string
    parametreler: Record<string, number>
    baslangicTarihi: string
    bitisTarihi: string
    baslangicSermayesi: number
  }) => api.post('/backtest', body),
}

export default api
