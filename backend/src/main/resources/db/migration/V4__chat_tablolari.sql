CREATE TABLE IF NOT EXISTS chat_sessions (
    id                 BIGSERIAL PRIMARY KEY,
    kullanici_id       BIGINT        NOT NULL,
    portfoy_id         BIGINT,
    baslik             VARCHAR(255)  NOT NULL DEFAULT 'Yeni Sohbet',
    son_mesaj          TEXT,
    durum              VARCHAR(30)   NOT NULL DEFAULT 'ACTIVE',
    has_insights       BOOLEAN       NOT NULL DEFAULT FALSE,
    last_ai_metadata   TEXT,
    olusturma_tarihi   TIMESTAMP,
    guncelleme_tarihi  TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_mesajlari (
    id                 BIGSERIAL PRIMARY KEY,
    seans_id           BIGINT        NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    rol                VARCHAR(20)   NOT NULL,
    icerik             TEXT          NOT NULL,
    grafik_data        TEXT,
    anomalies          TEXT,
    signals            TEXT,
    ai_metadata        TEXT,
    has_chart          BOOLEAN       DEFAULT FALSE,
    has_anomaly        BOOLEAN       DEFAULT FALSE,
    has_insights       BOOLEAN       DEFAULT FALSE,
    olusturma_tarihi   TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_kullanici ON chat_sessions(kullanici_id);
CREATE INDEX IF NOT EXISTS idx_chat_mesajlari_seans    ON chat_mesajlari(seans_id);
