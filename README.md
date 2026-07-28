# Finans Portalı

A full-stack finance portal for tracking Turkish markets (BIST stocks, forex, crypto, bonds, funds, VIOP) in real time, managing a portfolio, and getting AI-assisted investment advice.

---

## What it does

- **Market data** — BIST stocks, FX rates (TCMB), crypto (CoinGecko), and global indices, refreshed on a schedule by the backend.
- **Portfolio management** — track holdings, cost basis, P&L, and asset weights.
- **Portfolio analytics** — efficient frontier analysis, stress testing, and strategy backtesting.
- **Price alerts and predictions** — set price alarms and keep a journal of price forecasts.
- **AI investment advisor** — a chat-based advisor (Groq, running Llama 3.3 70B) that can discuss your portfolio, summarize news, and produce a daily market briefing.
- **News and economic calendar** — aggregated news (NewsAPI, CollectAPI, RSS) with AI-generated summaries, plus an economic calendar.
- **Notifications** — in-app and email notifications (e.g. for price alarms).
- **Authentication** — login and two-factor authentication (TOTP) via Keycloak.

## Tech stack

**Backend** — Java 21, Spring Boot 3.2 (Web, Security, OAuth2 Resource Server, Data JPA, Cache, Mail), PostgreSQL, Flyway, Redis, Kafka, Log4j2 (JSON layout), springdoc-openapi (Swagger UI).

**Frontend** — React 19 + TypeScript, Vite, Tailwind CSS, React Router, Recharts, keycloak-js, Axios.

**Infrastructure** — Docker Compose, Keycloak, PostgreSQL, Redis, Kafka + Zookeeper, OpenSearch + OpenSearch Dashboards, OpenTelemetry Collector, Prometheus, Grafana, Nginx.

## Architecture

Everything runs as a set of Docker containers wired together by `docker-compose.yml`:

- **backend** (Spring Boot, port 8080) — the API. Talks to Postgres for persistence, Redis for caching, and Kafka to ship logs.
- **frontend** (React, served by Nginx on port 3000) — the SPA. Nginx proxies `/api/` and `/actuator/` to the backend so the browser only ever talks to one origin.
- **db** (PostgreSQL) — primary datastore, schema managed with Flyway migrations. Also backs Keycloak's own storage.
- **redis** — caching layer for the backend.
- **keycloak** — identity provider. Handles login and TOTP-based 2FA for the app; its realm (`finans-portali`) is imported automatically from `keycloak/finans-portali-realm.json` on startup.
- **kafka** / **zookeeper** — log pipeline. The backend emits structured JSON logs (Log4j2) that a Kafka consumer service forwards into OpenSearch.
- **opensearch** / **opensearch-dashboards** — log storage and search/visualization.
- **otel-collector** (OpenTelemetry Collector) — receives traces/metrics from the backend over OTLP and re-exports metrics for Prometheus to scrape.
- **prometheus** — scrapes `/actuator/prometheus` on the backend as well as the OTel collector's exporter.
- **grafana** — dashboards on top of the Prometheus data source, provisioned automatically from `grafana/provisioning`.

External data providers integrated by the backend: TCMB (FX rates), CoinGecko (crypto), CollectAPI (BIST stock data and news), NewsAPI and RSS feeds (news), and Groq (AI advisor).

## Requirements

Only two things need to be installed locally:

- [Docker Desktop](https://www.docker.com/products/docker-desktop) (24+)
- [Git](https://git-scm.com)

Java, Node.js, and Maven are not required — everything is built inside Docker.

## Setup and running

### 1. Clone the repository

```bash
git clone https://github.com/pelinsukhrmn/finans-portali-v2.git
cd finans-portali-v2
```

### 2. Create a `.env` file

Create a file named `.env` in the project root with the following content:

```env
# Groq — free key at https://console.groq.com
GROQ_API_KEY=your_groq_api_key_here

# CollectAPI — BIST stock data: https://collectapi.com
COLLECT_API_KEY=apikey your_collect_api_key_here

# NewsAPI — news feed: https://newsapi.org
NEWSAPI_KEY=your_newsapi_key_here

# Email notifications (optional — can be left blank)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
```

The app runs fine without these keys — only AI analysis and news notifications will be disabled.

### 3. Start the app

```bash
docker compose up --build
```

The first run can take **5–15 minutes** while Docker images are pulled and built. Subsequent starts are much faster.

The app is ready once you see these lines in the terminal:

```
finans_backend   | Started FinansPortaliBackendApplication
finans_frontend  | /docker-entrypoint.sh: Configuration complete
```

## Accessing the app

| Service | URL |
|---|---|
| Main application | http://localhost:3000 |
| Swagger UI (API docs) | http://localhost:8080/swagger-ui.html |
| Keycloak admin console | http://localhost:8180 |
| Grafana (monitoring) | http://localhost:3001 |
| OpenSearch Dashboards | http://localhost:5601 |

### Credentials

**Application (http://localhost:3000):**

| User | Password | Role |
|---|---|---|
| `testuser` | `test123` | Standard user |
| `admin` | `admin123` | Admin |

**Keycloak admin console (http://localhost:8180):**

| User | Password |
|---|---|
| `admin` | `admin` |

**Grafana (http://localhost:3001):**

| User | Password |
|---|---|
| `admin` | `admin` |

## Two-factor authentication (2FA)

The app supports TOTP-based 2FA with Google Authenticator or Microsoft Authenticator.

To enable it:
1. Log in to the app.
2. Open the Keycloak account console: http://localhost:8180/realms/finans-portali/account
3. Under **Signing In → Two-Factor Authentication**, scan the QR code with your authenticator app.

## Stopping

```bash
# Stop services (data is kept)
docker compose down

# Stop services and wipe all data
docker compose down -v
```

## Troubleshooting

**App doesn't come up** — make sure these ports aren't already in use by something else:
`3000, 8080, 8180, 5434, 6379, 9092, 9200, 5601`

**Checking logs:**
```bash
docker compose logs backend --tail=50
docker compose logs frontend --tail=20
```

**Kafka won't start (stale node error):**
```bash
docker compose restart zookeeper
docker compose start kafka
```

**Keycloak login issues:**
```bash
docker compose restart keycloak
```

**Rebuilding after a code change:**
```bash
docker compose up -d --build backend frontend
```
