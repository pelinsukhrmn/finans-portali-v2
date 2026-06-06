# Finans Portali

Türk piyasalarını (BİST, döviz, kripto) gerçek zamanlı takip etmeye, portföy yönetimine ve AI destekli yatırım danışmanlığına odaklanan full-stack finansal portal uygulaması.

---

## Gereksinimler

Bilgisayarınızda yalnızca bunların kurulu olması yeterli:

- [Docker](https://www.docker.com/products/docker-desktop) (24+)
- Git

> Java, Node.js veya Maven kurmanıza gerek yok; her şey Docker içinde derlenir.

---

## Kurulum

### 1. Repoyu klonlayın

```bash
git clone https://github.com/pelinsukhrmn/finans-portali-v2.git
cd finans-portali-v2
```

### 2. `.env` dosyası oluşturun

Proje kök dizininde `.env` adında bir dosya oluşturun:

```bash
# Groq AI — ücretsiz key: https://console.groq.com
GROQ_API_KEY=your_groq_api_key

# CollectAPI — BİST hisse verileri: https://collectapi.com
COLLECT_API_KEY=apikey your_collect_api_key

# NewsAPI — haber akışı: https://newsapi.org
NEWSAPI_KEY=your_newsapi_key

# E-posta bildirimleri (isteğe bağlı)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
```

> API anahtarları olmadan da uygulama çalışır; yalnızca AI ve haber özellikleri devre dışı kalır.

### 3. Uygulamayı başlatın

```bash
docker compose up --build
```

İlk çalıştırmada Docker imajları indirilip derleneceği için **5–10 dakika** sürebilir. Sonraki başlatmalarda çok daha hızlı açılır.

Terminalde şu satırları gördüğünüzde uygulama hazırdır:

```
finans_backend   | Started FinansPortaliBackendApplication
finans_frontend  | /docker-entrypoint.sh: Configuration complete
```

---

## Uygulamaya Giriş

Tarayıcıdan **http://localhost:3000** adresini açın.

| Kullanıcı | Şifre | Rol |
|-----------|-------|-----|
| `testuser` | `test123` | Standart kullanıcı |
| `admin` | `admin123` | Yönetici |

---

## Durdurma

```bash
# Servisleri durdur
docker compose down

# Servisleri durdur ve tüm veriyi sıfırla
docker compose down -v
```

---

## Sorun Giderme

**Uygulama açılmıyorsa** şu portların başka bir program tarafından kullanılmadığından emin olun:
`3000, 8080, 8180, 5434, 6379, 9092, 9200`

**Logları incelemek için:**
```bash
docker compose logs backend --tail=50
docker compose logs frontend --tail=20
```

**Keycloak giriş sorunu yaşanıyorsa:**
```bash
docker compose restart keycloak
```
