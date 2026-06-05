CREATE TABLE fiyat_tahminleri (
    id                      BIGSERIAL PRIMARY KEY,
    kullanici_id            BIGINT NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
    yatirim_araci_id        BIGINT NOT NULL REFERENCES yatirim_araclari(id) ON DELETE CASCADE,
    hedef_fiyat             DOUBLE PRECISION NOT NULL,
    mevcut_fiyat_olusturma  DOUBLE PRECISION,
    hedef_tarih             DATE NOT NULL,
    notlar                  TEXT,
    durum                   VARCHAR(20) NOT NULL DEFAULT 'BEKLEMEDE',
    olusturma_tarihi        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
