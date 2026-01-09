import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.response.use(
  (r) => r,
  (e) => { if (e.response?.status === 401) window.location.reload(); return Promise.reject(e) }
)

export const yatirimAraclari = {
  tumunu:    ()            => api.get('/yatirim-araclari'),
  tipeGore:  (tip: string) => api.get(`/yatirim-araclari?tip=${tip}`),
  ara:       (q: string)   => api.get(`/yatirim-araclari/ara?q=${q}`),
  sembolIle: (s: string)   => api.get(`/yatirim-araclari/sembol/${s}`),
  detay:     (id: number)  => api.get(`/yatirim-araclari/${id}`),
}

export const piyasaVerileri = {
  guncel:     ()                                           => api.get('/piyasa-verileri/guncel'),
  yukselen:   (limit = 5)                                 => api.get(`/piyasa-verileri/yukselen?limit=${limit}`),
  dusen:      (limit = 5)                                 => api.get(`/piyasa-verileri/dusen?limit=${limit}`),
  sonByAraci: (araciId: number)                           => api.get(`/piyasa-verileri/${araciId}/son`),
  tarihsel:   (araciId: number, bas: string, bit: string) => api.get(`/piyasa-verileri/${araciId}/tarihsel`, { params: { baslangic: bas, bitis: bit } }),
}

export const haberler = {
  tumunu:      ()           => api.get('/haberler/son'),
  kategoriIle: (k: string)  => api.get(`/haberler/kategori/${k}`),
  ara:         (q: string)  => api.get(`/haberler/ara?q=${q}`),
}

export const portfoyler = {
  kullanicinin: (id: number)   => api.get(`/portfoyler?kullaniciId=${id}`),
  detay:        (id: number)   => api.get(`/portfoyler/${id}`),
  olustur:      (kulId: number, body: { ad: string }) => api.post(`/portfoyler?kullaniciId=${kulId}`, body),
  guncelle:     (id: number, body: { ad: string })    => api.put(`/portfoyler/${id}`, body),
  sil:          (id: number)   => api.delete(`/portfoyler/${id}`),
  varlikEkle:   (portfoyId: number, body: { yatirimAraciId: number; miktar: number; ortalamaMaliyet: number; alisTarihi: string }) =>
    api.post(`/portfoyler/${portfoyId}/varliklar`, body),
  varlikSil:    (varlikId: number) => api.delete(`/portfoyler/varliklar/${varlikId}`),
}

export const kullanicilar = {
  sync: (body: { keycloakId: string; eposta: string; adSoyad: string }) =>
    api.post('/kullanicilar/sync', body),
}

export const takipListesi = {
  kullanicinin: (id: number)                   => api.get(`/takip-listesi?kullaniciId=${id}`),
  ekle:         (kulId: number, araciId: number) => api.post(`/takip-listesi?kullaniciId=${kulId}`, { yatirimAraciId: araciId }),
  sil:          (kulId: number, araciId: number) => api.delete(`/takip-listesi?kullaniciId=${kulId}&araciId=${araciId}`),
}

export const veriGuncelleme = {
  tumu:    () => api.post('/veri-guncelleme/tumu'),
  hisse:   () => api.post('/veri-guncelleme/hisse'),
  tcmb:    () => api.post('/veri-guncelleme/tcmb'),
  kripto:  () => api.post('/veri-guncelleme/kripto'),
  haberler: () => api.post('/veri-guncelleme/haberler'),
}

export default api
