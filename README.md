# Finans Portali

32 Bit şirketi başvuru sürecinde hazırladığımız full-stack finansal portal uygulaması. Türk piyasalarını (BİST, TCMB döviz, kripto) gerçek zamanlı takip etmeye, portföy yönetimine ve yapay zeka destekli yatırım danışmanlığına odaklanır.

---

## Özellikler

| Özellik | Açıklama |
|---------|----------|
| **Piyasa Verileri** | BİST hisseleri (Yahoo Finance), döviz (TCMB), kripto (CoinGecko) |
| **Portföy Takibi** | Varlık girişi, anlık kâr/zarar hesaplama, ağırlık dağılımı |
| **Haberler** | RSS + NewsAPI üzerinden finans haberleri |
| **Teknik Analiz** | Grafik görünümü ve geçmiş fiyat analizi |
| **Geri Test** | Strateji tarihsel performans testi (backtesting) |
| **Ekonomik Takvim** | TCMB faiz, enflasyon ve makroekonomik olaylar |
| **AI Asistan** | Google Gemini tabanlı yatırım danışmanı, oturum geçmişi ile |
| **Bildirimler** | AI haber etkisi bildirimleri |
| **Kimlik Doğrulama** | Keycloak OIDC + JWT + 2FA (TOTP) |

---

## Mimari

```
┌─────────────────────────────────────────────────────────────┐
│                        Kullanıcı Tarayıcı                   │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP :3000
              ┌─────────▼─────────┐
              │  Nginx (Frontend) │  React 19 + TypeScript
              │    :3000 → :80    │
              └─────────┬─────────┘
                        │ /api/v1/* proxy
              ┌─────────▼─────────┐
              │  Spring Boot API  │  Java 21 + Spring Boot 3.2.5
              │       :8080       │
              └──┬──┬──┬──┬──┬───┘
                 │  │  │  │  │
    ┌────────────┘  │  │  │  └──────────────┐
    │               │  │  │                 │
┌───▼───┐  ┌────────┘  │  └───────┐  ┌─────▼──────┐
│  PG   │  │  Redis    │  Kafka   │  │  Keycloak  │
│:5434  │  │  :6379    │  :9092   │  │    :8180   │
└───────┘  └───────────┘  └───┬───┘  └────────────┘
                               │
                        ┌──────▼──────┐
                        │  OpenSearch │
                        │    :9200    │
                        └──────┬──────┘
                               │
                   ┌───────────▼───────────┐
                   │ OpenSearch Dashboards │
                   │        :5601          │
                   └───────────────────────┘

Gözlemlenebilirlik:
  OTel Collector :4317/:4318 → Prometheus :9090 → Grafana :3001
  Log4j2 → Kafka → KafkaLogConsumerService → OpenSearch
```

---

## Teknoloji Yığını

| Katman | Teknoloji | Sürüm |
|--------|-----------|-------|
| **Frontend** | React, TypeScript, Vite, Tailwind CSS | React 19, TS 5.9 |
| **Backend** | Spring Boot, Java | 3.2.5 / Java 21 |
| **Logging** | Log4j2 + Kafka Appender | Log4j2 2.23 |
| **Veritabanı** | PostgreSQL | 16 |
| **ORM** | Spring Data JPA / Hibernate | 6.4 |
| **Migration** | Flyway | 9.x |
| **Güvenlik** | Keycloak + JWT + 2FA (TOTP) | Keycloak 24.0 |
| **Gözlemlenebilirlik** | OpenTelemetry | SDK 1.x |
| **İzleme** | Grafana + Prometheus | 10.4 / 2.51 |
| **Log Altyapısı** | OpenSearch + Dashboards | 2.12.0 |
| **Log Pipeline** | Kafka (Log4j2→Kafka→OpenSearch) | 7.6.0 |
| **Cache** | Redis | 7 |
| **API Dok.** | OpenAPI 3.0 / Swagger UI | springdoc 2.5 |
| **Konteyner** | Docker Compose | — |

---

## Ön Koşullar

Sisteminizde yalnızca şunların kurulu olması yeterli:

| Araç | Sürüm | Kontrol |
|------|-------|---------|
| **Docker** | 24+ | `docker --version` |
| **Docker Compose** | 2.x | `docker compose version` |
| **Git** | Herhangi | `git --version` |

> Java, Node.js veya Maven kurmanıza gerek yok; her şey Docker içinde derlenir.

---

## Kurulum ve Çalıştırma

### 1. Repoyu Klonlayın

```bash
git clone https://github.com/pelinsukhrmn/finans-portali-v2.git
cd finans-portali-v2
```

### 2. `.env` Dosyasını Oluşturun

Kök dizinde `.env` adında bir dosya oluşturun ve aşağıdaki değişkenleri kendi API anahtarlarınızla doldurun:

```bash
# Google Gemini AI (https://aistudio.google.com/app/apikey)
GEMINI_CHAT_KEY=your_gemini_key
GEMINI_PORTFOLIO_KEY=your_gemini_key
GEMINI_DASHBOARD_KEY=your_gemini_key
GEMINI_NEWS_KEY=your_gemini_key

# CollectAPI - BİST hisse verileri (https://collectapi.com)
COLLECT_API_KEY=apikey your_collect_api_key

# NewsAPI - Haber akışı (https://newsapi.org)
NEWSAPI_KEY=your_newsapi_key

# E-posta bildirimleri (isteğe bağlı)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_gmail_app_password
```

> **Not:** API anahtarları olmadan da uygulama çalışır; yalnızca AI tavsiye, BİST hisse verileri ve haber özeti özellikleri devre dışı kalır.

### 3. Tüm Servisleri Başlatın

```bash
docker compose up --build
```

İlk başlatmada Docker image'ları indirilip derleneceği için **5–10 dakika** sürebilir. Sonraki çalıştırmalarda çok daha hızlı açılır.

### 4. Sistemin Hazır Olduğunu Doğrulayın

Terminalde şu çıktıları gördüğünüzde her şey hazırdır:

```
finans_backend    | Started FinansPortaliBackendApplication
finans_frontend   | /docker-entrypoint.sh: Configuration complete
finans_keycloak   | Running the server in development mode
```

Kontrol için:

```bash
docker compose ps
```

Tüm servisler `Up` durumunda görünmeli.

### 5. Tarayıcıda Açın

| Servis | URL | Giriş |
|--------|-----|-------|
| **Uygulama** | http://localhost:3000 | testuser / test123 |
| **Swagger UI** | http://localhost:8080/swagger-ui/index.html | — |
| **Grafana** | http://localhost:3001 | admin / admin |
| **Prometheus** | http://localhost:9090 | — |
| **OpenSearch Dashboards** | http://localhost:5601 | — |
| **Keycloak Admin** | http://localhost:8180 | admin / admin |

---

## Demo Giriş Bilgileri

Uygulamaya (http://localhost:3000) giriş için:

| Kullanıcı | Şifre | Rol |
|-----------|-------|-----|
| `testuser` | `test123` | Standart kullanıcı |
| `admin` | `admin123` | Yönetici |

**2FA (İki Faktörlü Doğrulama):** Keycloak giriş ekranında "Authenticator App Kur" seçeneğiyle Google Authenticator veya FreeOTP ile etkinleştirilebilir. Zorunlu değil, atlanabilir.

---

## API Dokümantasyonu

Tüm endpoint'ler Swagger UI üzerinden doğrudan test edilebilir:

```
http://localhost:8080/swagger-ui/index.html
```

Temel endpoint'ler (`/api/v1/` prefix'i ile):

| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| `/api/v1/piyasa-verileri/guncel` | GET | Tüm güncel fiyatlar |
| `/api/v1/yatirim-araclari` | GET | Yatırım araçları listesi |
| `/api/v1/portfoyler?kullaniciId=1` | GET | Kullanıcı portföyleri |
| `/api/v1/haberler/son` | GET | Son haberler |
| `/api/v1/ekonomik-takvim` | GET | Ekonomik takvim |
| `/api/v1/backtest` | POST | Strateji geri testi |
| `/api/v1/ai/tavsiye` | POST | AI yatırım tavsiyesi |
| `/api/v1/ai/sessions/{kullaniciId}` | GET | Chat oturumları |
| `/api/v1/it-tickets` | GET/POST | IT destek talepleri |
| `/api/v1/veri-guncelleme/tumu` | POST | Tüm verileri yenile |

JWT ile istek göndermek için:

```bash
# Token al
TOKEN=$(curl -s -X POST http://localhost:8180/realms/finans-portali/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=finans-portali-frontend&username=testuser&password=test123" \
  | jq -r '.access_token')

# API çağrısı yap
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v1/piyasa-verileri/guncel
```

---

## İzleme Araçları

### Grafana (http://localhost:3001)

Giriş: `admin / admin`

Prometheus veri kaynağı otomatik yapılandırılmıştır. Yeni dashboard için: **+** → **New Dashboard**.

### Prometheus (http://localhost:9090)

Spring Boot Actuator metrikleri `/actuator/prometheus` üzerinden toplanır.

```promql
# JVM bellek kullanımı
jvm_memory_used_bytes{application="finans-portali-backend"}

# HTTP istek sayısı
http_server_requests_seconds_count

# Aktif DB bağlantıları
hikaricp_connections_active
```

### OpenSearch Dashboards (http://localhost:5601)

Log indeksleri: `finans-portali-logs-YYYY.MM.DD`

Log akışı: `Log4j2 KafkaAppender → Kafka topic "application-logs" → KafkaLogConsumerService → OpenSearch`

---

## Geliştirme Ortamı

### Sadece Altyapıyı Başlatıp Backend'i Lokalde Çalıştırma

```bash
# Önce altyapı servislerini başlat
docker compose up db redis kafka keycloak opensearch -d

# Backend'i lokalde çalıştır
cd backend
mvn spring-boot:run
```

### Frontend Hot Reload

```bash
cd frontend
npm install
npm run dev
# http://localhost:5173 adresinde açılır
```

### Servisleri Durdurma

```bash
# Servisleri durdur
docker compose down

# Servisleri durdur ve tüm veriyi sıfırla
docker compose down -v
```

---

## Proje Yapısı

```
finans-portali-v2/
├── backend/
│   ├── src/main/java/com/finansportali/backend/
│   │   ├── config/          # Güvenlik, OpenAPI, RestTemplate konfigürasyonları
│   │   ├── controller/      # REST endpoint'leri (/api/v1/*)
│   │   ├── service/         # İş mantığı
│   │   ├── repository/      # Spring Data JPA repository'leri
│   │   ├── entity/          # JPA entity sınıfları
│   │   ├── dto/             # API request/response modelleri
│   │   ├── integration/     # Dış API entegrasyonları (Yahoo, TCMB, CoinGecko)
│   │   ├── scheduler/       # Periyodik veri güncelleme görevleri
│   │   └── exception/       # Global hata yönetimi
│   └── src/main/resources/
│       ├── application.yml
│       ├── log4j2-spring.xml
│       └── db/migration/    # Flyway migration'ları (V1–V4)
│
├── frontend/
│   ├── src/
│   │   ├── pages/           # Dashboard, Portföy, Haberler, Takvim, Backtest, AI vb.
│   │   ├── components/      # Yeniden kullanılabilir UI bileşenleri
│   │   ├── services/api.ts  # Axios tabanlı API istemcisi
│   │   └── context/         # Keycloak auth context
│   └── nginx.conf           # Nginx + /api proxy yönlendirmesi
│
├── keycloak/
│   └── finans-portali-realm.json   # Realm, kullanıcılar ve 2FA ayarları
│
├── prometheus/
│   └── prometheus.yml       # Scrape konfigürasyonu
│
├── grafana/provisioning/    # Datasource ve dashboard otomatik kurulumu
│
├── otel/
│   └── otel-collector-config.yaml
│
└── docker-compose.yml       # 13 servis: DB, Keycloak, Redis, Kafka, OpenSearch,
                             # OTel, Prometheus, Grafana, Frontend, Backend
```

---

## Flyway Migration'ları

| Sürüm | Dosya | İçerik |
|-------|-------|--------|
| V1 | `V1__init.sql` | Temel tablolar (kullanıcılar, yatırım araçları, piyasa verileri, portföyler, haberler) |
| V2 | `V2__bildirim_tablolari.sql` | AI bildirim tabloları |
| V3 | `V3__bildirim_etki_yonu.sql` | Bildirim etki yönü kolonu |
| V4 | `V4__chat_tablolari.sql` | AI chat oturum ve mesaj tabloları |

---

## Sorun Giderme

**Backend başlamıyor:**
```bash
docker compose logs backend --tail=50
```

**Keycloak realm yüklenmiyor:**
```bash
docker compose restart keycloak
```

**Veritabanı bağlantısı kurulamıyor:**
```bash
docker compose ps db
docker compose logs db --tail=20
```

**Port çakışması varsa** şu portların boş olduğundan emin olun:
`3000, 5434, 6379, 8080, 8180, 9090, 9092, 9200, 3001, 5601, 4317, 4318`

---

## Ortam Değişkenleri

`.env` dosyasına eklenmesi gereken değişkenler:

| Değişken | Açıklama | Zorunlu |
|----------|----------|---------|
| `GEMINI_CHAT_KEY` | Google Gemini — AI sohbet asistanı | Hayır |
| `GEMINI_PORTFOLIO_KEY` | Google Gemini — Portföy analizi | Hayır |
| `GEMINI_DASHBOARD_KEY` | Google Gemini — Dashboard brifing | Hayır |
| `GEMINI_NEWS_KEY` | Google Gemini — Haber analizi | Hayır |
| `COLLECT_API_KEY` | CollectAPI — BİST hisse verileri | Hayır |
| `NEWSAPI_KEY` | NewsAPI — Haber akışı | Hayır |
| `MAIL_HOST` | SMTP sunucusu (varsayılan: smtp.gmail.com) | Hayır |
| `MAIL_USERNAME` | Bildirim e-postası gönderici adresi | Hayır |
| `MAIL_PASSWORD` | Gmail uygulama şifresi | Hayır |

> **`.env` dosyası git'e eklenmez** (`.gitignore` ile korunur). Her geliştirici kendi anahtarlarıyla kendi `.env` dosyasını oluşturur.

---

## Test

Unit testleri çalıştırmak için:

```bash
cd backend
mvn test
```

| Test Sınıfı | Kapsam |
|-------------|--------|
| `YatirimAraciServiceTest` | CRUD işlemleri, duplicate kontrolü |
| `PiyasaVerisiServiceTest` | Fiyat sorgulama, değişim hesaplama |
| `PortfoyServiceTest` | Portföy yönetimi, varlık değerleme |
| `GlobalExceptionHandlerTest` | HTTP hata kodları ve mesaj formatları |
