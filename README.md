# Finans Portalı

Türk piyasalarını (BİST hisse senetleri, döviz, kripto, tahvil/bono, fonlar, VIOP) gerçek zamanlı takip etmeye, portföy yönetimine ve AI destekli yatırım danışmanlığına odaklanan full-stack finansal portal uygulaması.

---

## Gereksinimler

Bilgisayarınızda yalnızca bunların kurulu olması yeterlidir:

- [Docker Desktop](https://www.docker.com/products/docker-desktop) (24+)
- [Git](https://git-scm.com)

> Java, Node.js veya Maven kurmanıza gerek yoktur. Her şey Docker içinde derlenir.

---

## Kurulum ve Çalıştırma

### 1. Repoyu klonlayın

```bash
git clone https://github.com/pelinsukhrmn/finans-portali-v2.git
cd finans-portali-v2
```

### 2. `.env` dosyası oluşturun

Proje kök dizininde `.env` adında bir dosya oluşturun ve aşağıdaki içeriği yapıştırın:

```env
# Groq AI — ücretsiz key alın: https://console.groq.com
GROQ_API_KEY=your_groq_api_key_here

# CollectAPI — BİST hisse verileri: https://collectapi.com
COLLECT_API_KEY=apikey your_collect_api_key_here

# NewsAPI — haber akışı: https://newsapi.org
NEWSAPI_KEY=your_newsapi_key_here

# E-posta bildirimleri (isteğe bağlı — boş bırakılabilir)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
```

> API anahtarları olmadan da uygulama çalışır. Yalnızca AI analiz ve haber bildirimleri devre dışı kalır.

### 3. Uygulamayı başlatın

```bash
docker compose up --build
```

**İlk çalıştırmada** Docker imajları indirilip derlendiğinden **5–15 dakika** sürebilir. Sonraki başlatmalarda çok daha hızlı açılır.

Terminalde aşağıdaki satırları gördüğünüzde uygulama hazırdır:

```
finans_backend   | Started FinansPortaliBackendApplication
finans_frontend  | /docker-entrypoint.sh: Configuration complete
```

---

## Uygulamaya Erişim

Tarayıcınızdan aşağıdaki adresleri açın:

| Servis | Adres |
|--------|-------|
| **Ana Uygulama** | http://localhost:3000 |
| **Swagger UI (API Docs)** | http://localhost:8080/swagger-ui.html |
| **Keycloak Yönetim Paneli** | http://localhost:8180 |
| **Grafana (İzleme)** | http://localhost:3001 |
| **OpenSearch Dashboards** | http://localhost:5601 |

### Giriş Bilgileri

**Uygulama (http://localhost:3000):**

| Kullanıcı | Şifre | Rol |
|-----------|-------|-----|
| `testuser` | `test123` | Standart kullanıcı |
| `admin` | `admin123` | Yönetici |

**Keycloak Yönetim Paneli (http://localhost:8180):**

| Kullanıcı | Şifre |
|-----------|-------|
| `admin` | `admin` |

**Grafana (http://localhost:3001):**

| Kullanıcı | Şifre |
|-----------|-------|
| `admin` | `admin` |

---

## İki Faktörlü Kimlik Doğrulama (2FA)

Uygulama, Google Authenticator ve Microsoft Authenticator ile TOTP (Time-based One-Time Password) desteklemektedir.

2FA'yı etkinleştirmek için:
1. Uygulamaya giriş yapın
2. Keycloak hesap sayfasını açın: http://localhost:8180/realms/finans-portali/account
3. **Signing In → Two-Factor Authentication** bölümünden Authenticator uygulamanızla QR kodu okutun

---

## Durdurma

```bash
# Servisleri durdur (veriler korunur)
docker compose down

# Servisleri durdur ve tüm verileri sıfırla
docker compose down -v
```

---

## Mimari

Uygulama aşağıdaki 13 Docker container'dan oluşur:

| Container | Teknoloji | Port |
|-----------|-----------|------|
| `finans_frontend` | React + Nginx | 3000 |
| `finans_backend` | Spring Boot 3 / Java 21 | 8080 |
| `finans_db` | PostgreSQL 15 | 5434 |
| `finans_redis` | Redis 7 | 6379 |
| `finans_kafka` | Apache Kafka | 9092 |
| `finans_zookeeper` | Zookeeper | 2181 |
| `finans_keycloak` | Keycloak 23 | 8180 |
| `finans_opensearch` | OpenSearch 2 | 9200 |
| `finans_opensearch_dashboards` | OpenSearch Dashboards | 5601 |
| `finans_otel_collector` | OpenTelemetry Collector | 4317 |
| `finans_prometheus` | Prometheus | 9090 |
| `finans_grafana` | Grafana | 3001 |

**Log akışı:** `Log4j2 → Kafka → KafkaLogConsumerService → OpenSearch`

---

## Sorun Giderme

**Uygulama açılmıyorsa** şu portların başka bir program tarafından kullanılmadığından emin olun:
`3000, 8080, 8180, 5434, 6379, 9092, 9200, 5601`

**Logları incelemek için:**
```bash
docker compose logs backend --tail=50
docker compose logs frontend --tail=20
```

**Kafka başlamıyorsa (stale node hatası):**
```bash
docker compose restart zookeeper
docker compose start kafka
```

**Keycloak giriş sorunu yaşanıyorsa:**
```bash
docker compose restart keycloak
```

**Değişiklik yaptıktan sonra yeniden başlatmak için:**
```bash
docker compose up -d --build backend frontend
```
