CREATE TABLE IF NOT EXISTS bildirim_ayarlari (
    id               BIGSERIAL PRIMARY KEY,
    kullanici_id     BIGINT    NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
    aktif            BOOLEAN   DEFAULT FALSE,
    email_aktif      BOOLEAN   DEFAULT TRUE,
    hisse_takip      BOOLEAN   DEFAULT TRUE,
    doviz_takip      BOOLEAN   DEFAULT FALSE,
    kripto_takip     BOOLEAN   DEFAULT FALSE,
    UNIQUE (kullanici_id)
);

CREATE TABLE IF NOT EXISTS ai_bildirimler (
    id                   BIGSERIAL PRIMARY KEY,
    kullanici_id         BIGINT    NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
    haber_id             BIGINT    REFERENCES haberler(id) ON DELETE SET NULL,
    mesaj                TEXT      NOT NULL,
    haber_baslik         VARCHAR(255),
    etkilenen_semboller  VARCHAR(500),
    okundu               BOOLEAN   DEFAULT FALSE,
    olusturma_tarihi     TIMESTAMP DEFAULT NOW(),
    UNIQUE (kullanici_id, haber_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_bildirim_kullanici
    ON ai_bildirimler (kullanici_id, olusturma_tarihi DESC);
