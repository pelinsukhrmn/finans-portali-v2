-- Finans Portali - Flyway Migration V1
-- baseline-on-migrate=true oldugu icin bu migration
-- sadece yeni kurulumda calisir, mevcut DB'de atlanir.

CREATE TABLE IF NOT EXISTS kullanicilar (
    id                BIGSERIAL PRIMARY KEY,
    keycloak_id       VARCHAR(255) NOT NULL UNIQUE,
    eposta            VARCHAR(255) NOT NULL UNIQUE,
    ad_soyad          VARCHAR(255),
    rol               VARCHAR(50) DEFAULT 'USER',
    olusturma_tarihi  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS borsalar (
    id              BIGSERIAL PRIMARY KEY,
    kod             VARCHAR(20)  NOT NULL UNIQUE,
    ad              VARCHAR(100),
    acilis_saati    TIME,
    kapanis_saati   TIME,
    timezone        VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS yatirim_araclari (
    id                BIGSERIAL PRIMARY KEY,
    sembol            VARCHAR(20)  NOT NULL UNIQUE,
    ad                VARCHAR(255) NOT NULL,
    tip               VARCHAR(50)  NOT NULL,
    aktif_mi          BOOLEAN      DEFAULT TRUE,
    guncelleme_tarihi TIMESTAMP    DEFAULT NOW(),
    olusturma_tarihi  TIMESTAMP    DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS piyasa_verileri (
    id               BIGSERIAL PRIMARY KEY,
    yatirim_araci_id BIGINT        NOT NULL REFERENCES yatirim_araclari(id),
    fiyat            NUMERIC(19,4) NOT NULL,
    hacim            BIGINT,
    en_yuksek        NUMERIC(19,4),
    en_dusuk         NUMERIC(19,4),
    acilis           NUMERIC(19,4),
    veri_zamani      TIMESTAMP     NOT NULL,
    kayit_tarihi     TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_piyasa_araci_zaman ON piyasa_verileri (yatirim_araci_id, veri_zamani DESC);

CREATE TABLE IF NOT EXISTS haberler (
    id            BIGSERIAL PRIMARY KEY,
    baslik        VARCHAR(255) NOT NULL,
    icerik        TEXT,
    kaynak        VARCHAR(100),
    url           VARCHAR(500),
    kategori      VARCHAR(50),
    yayin_tarihi  TIMESTAMP,
    kayit_tarihi  TIMESTAMP    DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portfoyler (
    id                BIGSERIAL PRIMARY KEY,
    kullanici_id      BIGINT       NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
    ad                VARCHAR(100) NOT NULL,
    olusturma_tarihi  TIMESTAMP    DEFAULT NOW(),
    guncelleme_tarihi TIMESTAMP    DEFAULT NOW(),
    UNIQUE (kullanici_id, ad)
);

CREATE TABLE IF NOT EXISTS portfoy_varliklari (
    id                BIGSERIAL PRIMARY KEY,
    portfoy_id        BIGINT        NOT NULL REFERENCES portfoyler(id) ON DELETE CASCADE,
    yatirim_araci_id  BIGINT        NOT NULL REFERENCES yatirim_araclari(id),
    miktar            NUMERIC(19,4) NOT NULL,
    ortalama_maliyet  NUMERIC(19,4) NOT NULL,
    alis_tarihi       TIMESTAMP,
    olusturma_tarihi  TIMESTAMP     DEFAULT NOW(),
    guncelleme_tarihi TIMESTAMP     DEFAULT NOW(),
    UNIQUE (portfoy_id, yatirim_araci_id)
);

CREATE TABLE IF NOT EXISTS takip_listeleri (
    id               BIGSERIAL PRIMARY KEY,
    kullanici_id     BIGINT    NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
    yatirim_araci_id BIGINT    NOT NULL REFERENCES yatirim_araclari(id),
    ekleme_tarihi    TIMESTAMP DEFAULT NOW(),
    UNIQUE (kullanici_id, yatirim_araci_id)
);

CREATE TABLE IF NOT EXISTS fiyat_alarmlari (
    id               BIGSERIAL PRIMARY KEY,
    kullanici_id     BIGINT        NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
    yatirim_araci_id BIGINT        NOT NULL REFERENCES yatirim_araclari(id),
    hedef_fiyat      NUMERIC(19,4) NOT NULL,
    yon              VARCHAR(10)   NOT NULL,
    aktif_mi         BOOLEAN       DEFAULT TRUE,
    tetiklendi_mi    BOOLEAN       DEFAULT FALSE,
    olusturma_tarihi TIMESTAMP     DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ekonomik_takvim (
    id               BIGSERIAL PRIMARY KEY,
    ulke             VARCHAR(50),
    olay             VARCHAR(255),
    onem_derecesi    INTEGER,
    aciklanan_deger  VARCHAR(50),
    beklenti         VARCHAR(50),
    onceki_deger     VARCHAR(50),
    zaman            TIMESTAMP
);
