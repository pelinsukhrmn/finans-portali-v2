package com.finansportali.backend.service;

import com.finansportali.backend.entity.*;
import com.finansportali.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class DemoDataService implements ApplicationRunner {

    private final YatirimAraciRepository araciRepo;
    private final PiyasaVerisiRepository piyasaRepo;
    private final HaberRepository haberRepo;

    private static final Random RNG = new Random(42);

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        log.info("[DEMO] Veri durumu kontrol ediliyor...");
        try {
            // Seed each type independently based on whether historical data exists
            boolean hisseSeedGerekli = araciRepo.findBySembol("THYAO")
                .map(a -> piyasaRepo.countByYatirimAraciId(a.getId()) < 30)
                .orElse(true);

            boolean dovizSeedGerekli = araciRepo.findByTip(EnstrumanTipi.DOVIZ).stream()
                .filter(a -> a.getSembol().equals("USD/TRY"))
                .findFirst()
                .map(a -> piyasaRepo.countByYatirimAraciId(a.getId()) < 30)
                .orElse(false); // TCMB data is live, don't override

            boolean kriptoSeedGerekli = araciRepo.findBySembol("BTC/TRY")
                .map(a -> piyasaRepo.countByYatirimAraciId(a.getId()) < 30)
                .orElse(false); // CoinGecko data is live, don't override

            boolean tahvilSeedGerekli = araciRepo.findBySembol("TR10Y")
                .map(a -> piyasaRepo.countByYatirimAraciId(a.getId()) < 30)
                .orElse(true);

            boolean fonSeedGerekli = araciRepo.findBySembol("GARPF")
                .map(a -> piyasaRepo.countByYatirimAraciId(a.getId()) < 30)
                .orElse(true);

            boolean viopSeedGerekli = araciRepo.findBySembol("F_XU0300626")
                .map(a -> piyasaRepo.countByYatirimAraciId(a.getId()) < 30)
                .orElse(true);

            if (hisseSeedGerekli) {
                log.info("[DEMO] Hisse verisi eksik, yukleniyor...");
                seedHisseler();
            }
            if (dovizSeedGerekli) {
                log.info("[DEMO] Doviz tarihsel verisi eksik, yukleniyor...");
                seedDovizler();
            }
            if (kriptoSeedGerekli) {
                log.info("[DEMO] Kripto tarihsel verisi eksik, yukleniyor...");
                seedKriptolar();
            }
            if (tahvilSeedGerekli) {
                log.info("[DEMO] Tahvil/bono verisi eksik, yukleniyor...");
                seedTahvilBonolar();
            }
            if (fonSeedGerekli) {
                log.info("[DEMO] Fon verisi eksik, yukleniyor...");
                seedFonlar();
            }
            if (viopSeedGerekli) {
                log.info("[DEMO] VIOP verisi eksik, yukleniyor...");
                seedViop();
            }
            if (haberRepo.count() < 5) {
                log.info("[DEMO] Haber verisi eksik, yukleniyor...");
                seedHaberler();
            }

            if (!hisseSeedGerekli && !dovizSeedGerekli && !kriptoSeedGerekli
                    && !tahvilSeedGerekli && !fonSeedGerekli && !viopSeedGerekli) {
                log.info("[DEMO] Yeterli tarihsel veri mevcut, seed atlaniyor.");
            } else {
                log.info("[DEMO] Demo veri tamamlandi.");
            }
        } catch (Exception e) {
            log.error("[DEMO] Hata: {}", e.getMessage(), e);
        }
    }

    // ── Enstrüman tanımları: {sembol, ad, başlangıç fiyatı, drift, volatilite} ──

    private static final Object[][] HISSELER = {
        {"THYAO", "Türk Hava Yolları",    307.50, 0.0003, 0.018},
        {"GARAN", "Garanti BBVA",         124.50, 0.0002, 0.016},
        {"ASELS", "Aselsan",               87.20, 0.0004, 0.017},
        {"SISE",  "Şişe Cam",              53.80, 0.0003, 0.015},
        {"KCHOL", "Koç Holding",          163.70, 0.0003, 0.014},
        {"BIMAS", "BİM Mağazalar",        412.00, 0.0002, 0.013},
        {"AKBNK", "Akbank",                72.60, 0.0002, 0.015},
        {"TUPRS", "Tüpraş",               198.40, 0.0002, 0.016},
        {"PGSUS", "Pegasus",              621.00, 0.0003, 0.020},
        {"EREGL", "Ereğli Demir Çelik",    61.35, 0.0002, 0.015},
        {"SAHOL", "Sabancı Holding",       118.60, 0.0003, 0.014},
        {"TKFEN", "Tekfen Holding",         89.40, 0.0002, 0.016},
        {"FROTO", "Ford Otosan",          1120.50, 0.0003, 0.015},
        {"TOASO", "Tofaş",                342.80, 0.0002, 0.015},
        {"KOZAL", "Koza Altın",          1478.00, 0.0004, 0.018},
    };

    private static final Object[][] DOVIZLER = {
        {"USD/TRY", "Amerikan Doları / Türk Lirası", 36.82,  0.0003, 0.005},
        {"EUR/TRY", "Euro / Türk Lirası",            38.91,  0.0003, 0.006},
        {"GBP/TRY", "İngiliz Sterlini / Türk Lirası", 46.50, 0.0003, 0.007},
        {"JPY/TRY", "Japon Yeni / Türk Lirası",       0.2432, 0.0002, 0.006},
        {"CHF/TRY", "İsviçre Frangı / Türk Lirası",  41.80, 0.0002, 0.005},
    };

    private static final Object[][] KRIPTOLAR = {
        {"BTC/TRY", "Bitcoin",  2345670.0, 0.0005, 0.035},
        {"ETH/TRY", "Ethereum",  126400.0, 0.0004, 0.030},
        {"BNB/TRY", "BNB",        23580.0, 0.0004, 0.028},
        {"XRP/TRY", "XRP",           87.45, 0.0003, 0.032},
        {"SOL/TRY", "Solana",      7840.0, 0.0005, 0.038},
    };

    private static final Object[][] TAHVIL_BONOLAR = {
        {"TR2Y",       "2 Yıllık Hazine Bonosu",          97.45, 0.0001, 0.004},
        {"TR5Y",       "5 Yıllık Devlet Tahvili",         94.20, 0.0001, 0.005},
        {"TR10Y",      "10 Yıllık Devlet Tahvili",        88.50, 0.0001, 0.006},
        {"KIRA3Y",     "3 Yıllık Kira Sertifikası",       96.10, 0.0001, 0.004},
        {"EUROBOND30", "Türkiye Eurobond 2030",            89.75, 0.0001, 0.005},
    };

    private static final Object[][] FONLAR = {
        {"AKPF1", "Ak Portföy Para Piyasası Fonu",          2.4521, 0.0002, 0.003},
        {"GARPF", "Garanti Portföy Hisse Senedi Fonu",      8.3240, 0.0003, 0.012},
        {"YAPKRE","Yapı Kredi Para Piyasası Fonu",          3.1860, 0.0002, 0.003},
        {"ISGPF", "İş Portföy Karma Fon",                 12.4530, 0.0003, 0.008},
        {"TEBPF", "TEB Portföy Para Piyasası Fonu",         1.8920, 0.0002, 0.003},
    };

    private static final Object[][] VIOP_SOZLESMELERI = {
        {"F_XU0300626",  "BIST30 Haziran 2026 Vadeli",    11240.0, 0.0003, 0.016},
        {"F_USDTRY0626", "USD/TRY Haziran 2026 Vadeli",      37.85, 0.0003, 0.005},
        {"F_EURTRY0626", "EUR/TRY Haziran 2026 Vadeli",      39.95, 0.0003, 0.006},
        {"F_GARAN0626",  "GARAN Haziran 2026 Vadeli",       125.50, 0.0002, 0.015},
        {"F_THYAO0626",  "THYAO Haziran 2026 Vadeli",       310.20, 0.0003, 0.018},
    };

    private static final String[][] HABERLER_DATA = {
        {"BIST 100 Endeksi Rekor Tazeliyor",
         "Borsa İstanbul'da BIST 100 endeksi güçlü seyrine devam ediyor. Yabancı yatırımcıların ilgisi artışı destekliyor.",
         "Borsa İstanbul", "https://www.borsaistanbul.com", "EKONOMI"},
        {"Merkez Bankası Faiz Kararı Açıklandı",
         "TCMB politika faizini beklentiler doğrultusunda sabit tuttu. Enflasyon görünümüne ilişkin değerlendirmeler öne çıktı.",
         "TCMB", "https://www.tcmb.gov.tr", "EKONOMI"},
        {"THY 3. Çeyrek Karını Açıkladı",
         "Türk Hava Yolları, 3. çeyrek net karını önceki yıla göre yüzde 18 artırarak 2,3 milyar TL olarak açıkladı.",
         "Finans Portalı", "https://www.kap.org.tr", "EKONOMI"},
        {"Bitcoin 70.000 Doları Aştı",
         "Kripto para piyasasının öncü varlığı Bitcoin, kurumsal talep ve ETF onaylarının etkisiyle 70.000 dolar seviyesini geçti.",
         "CoinDesk TR", "https://www.coindesk.com", "KRIPTO"},
        {"Dolar/TL Hareketliliği Sürdürüyor",
         "Küresel risk iştahındaki değişimler ve yurt içi gelişmeler Dolar/TL paritesini etkiliyor.",
         "Ekonomi Haberleri", "https://www.ekonomi.gov.tr", "EKONOMI"},
        {"Garanti Bankası Temettü Açıkladı",
         "Garanti BBVA, olağanüstü genel kurulda 2024 yılı için hisse başına 5,80 TL temettü dağıtım kararı aldı.",
         "KAP Bildirimi", "https://www.kap.org.tr", "EKONOMI"},
        {"Aselsan Yeni Savunma Sözleşmesi İmzaladı",
         "Aselsan, Savunma Sanayii Başkanlığı ile 2,1 milyar TL değerinde yeni bir sistem tedarik sözleşmesi imzaladı.",
         "Savunma Sanayi", "https://www.ssb.gov.tr", "EKONOMI"},
        {"Ethereum Güncellemesi Tamamlandı",
         "Ethereum ağının beklenen güncellemesi başarıyla uygulandı. İşlem ücretleri önemli ölçüde düştü.",
         "Kripto Haber", "https://ethereum.org", "KRIPTO"},
        {"İMF Türkiye Büyüme Tahminini Artırdı",
         "Uluslararası Para Fonu, Türkiye'nin yıl sonu büyüme tahminini yüzde 4,2'den 4,7'ye yükseltti.",
         "IMF", "https://www.imf.org", "EKONOMI"},
        {"Tüpraş Rafine Marjları Güçleniyor",
         "Global ham petrol fiyatlarındaki hareketler ve güçlü iç talep Tüpraş'ın marjlarını olumlu etkiliyor.",
         "Enerji Gündem", "https://www.enerji.gov.tr", "EKONOMI"},
        {"BIM Mağaza Sayısını 14.000'e Çıkardı",
         "BİM Birleşik Mağazalar, yurt içi ve yurt dışı açılışlarla toplam mağaza sayısını 14.000'in üzerine taşıdı.",
         "Perakende Haberleri", "https://www.bim.com.tr", "EKONOMI"},
        {"Solana İşlem Hacmi Rekor Kırdı",
         "Solana ağında günlük işlem hacmi 12 milyar doların üzerine çıkarak tarihi rekor kırdı.",
         "Kripto Analiz", "https://solana.com", "KRIPTO"},
        {"Koç Holding Çeyrek Bilançosu Beklentileri Aştı",
         "Koç Holding konsolide net karı analist tahminlerini yüzde 12 oranında aştı.",
         "Hürriyet Ekonomi", "https://www.hurriyet.com.tr", "EKONOMI"},
        {"Türkiye Cari Açık Verileri Açıklandı",
         "TÜİK açıklamasına göre Türkiye'nin aylık cari açığı 3,8 milyar dolar ile beklentilerin altında kaldı.",
         "TÜİK", "https://www.tuik.gov.tr", "EKONOMI"},
        {"Ford Otosan Elektrikli Araç Yatırımını Duyurdu",
         "Ford Otosan, Türkiye'deki elektrikli araç üretim kapasitesini artırmak için 1,5 milyar Euro yatırım yapacağını açıkladı.",
         "Otomotiv Sektörü", "https://www.fordotosan.com.tr", "TEKNOLOJI"},
    };

    // ── Seed metotları ─────────────────────────────────────────────────────────

    private void seedHisseler() {
        for (Object[] h : HISSELER) {
            YatirimAraci araci = getOrCreate((String) h[0], (String) h[1], EnstrumanTipi.HISSE);
            piyasaRepo.saveAll(olusturTarihsel(araci, (double) h[2], (double) h[3], (double) h[4], 365));
        }
        log.info("[DEMO] {} hisse seed edildi.", HISSELER.length);
    }

    private void seedDovizler() {
        for (Object[] d : DOVIZLER) {
            YatirimAraci araci = getOrCreate((String) d[0], (String) d[1], EnstrumanTipi.DOVIZ);
            piyasaRepo.saveAll(olusturTarihsel(araci, (double) d[2], (double) d[3], (double) d[4], 365));
        }
        log.info("[DEMO] {} doviz seed edildi.", DOVIZLER.length);
    }

    private void seedKriptolar() {
        for (Object[] k : KRIPTOLAR) {
            YatirimAraci araci = getOrCreate((String) k[0], (String) k[1], EnstrumanTipi.KRIPTO);
            piyasaRepo.saveAll(olusturTarihsel(araci, (double) k[2], (double) k[3], (double) k[4], 365));
        }
        log.info("[DEMO] {} kripto seed edildi.", KRIPTOLAR.length);
    }

    private void seedTahvilBonolar() {
        for (Object[] t : TAHVIL_BONOLAR) {
            YatirimAraci araci = getOrCreate((String) t[0], (String) t[1], EnstrumanTipi.TAHVIL_BONO);
            piyasaRepo.saveAll(olusturTarihsel(araci, (double) t[2], (double) t[3], (double) t[4], 365));
        }
        log.info("[DEMO] {} tahvil/bono seed edildi.", TAHVIL_BONOLAR.length);
    }

    private void seedFonlar() {
        for (Object[] f : FONLAR) {
            YatirimAraci araci = getOrCreate((String) f[0], (String) f[1], EnstrumanTipi.FON);
            piyasaRepo.saveAll(olusturTarihsel(araci, (double) f[2], (double) f[3], (double) f[4], 365));
        }
        log.info("[DEMO] {} fon seed edildi.", FONLAR.length);
    }

    private void seedViop() {
        for (Object[] v : VIOP_SOZLESMELERI) {
            YatirimAraci araci = getOrCreate((String) v[0], (String) v[1], EnstrumanTipi.VIOP);
            piyasaRepo.saveAll(olusturTarihsel(araci, (double) v[2], (double) v[3], (double) v[4], 365));
        }
        log.info("[DEMO] {} VIOP sozlesmesi seed edildi.", VIOP_SOZLESMELERI.length);
    }

    private void seedHaberler() {
        if (haberRepo.count() > 5) return;
        List<Haber> liste = new ArrayList<>();
        LocalDateTime simdi = LocalDateTime.now();
        for (int i = 0; i < HABERLER_DATA.length; i++) {
            String[] h = HABERLER_DATA[i];
            Haber haber = new Haber();
            haber.setBaslik(h[0]);
            haber.setIcerik(h[1]);
            haber.setKaynak(h[2]);
            haber.setUrl(h[3]);
            haber.setKategori(h[4]);
            haber.setYayinTarihi(simdi.minusHours(i * 3L));
            liste.add(haber);
        }
        haberRepo.saveAll(liste);
        log.info("[DEMO] {} haber seed edildi.", liste.size());
    }

    // ── Yardımcı metodlar ──────────────────────────────────────────────────────

    private YatirimAraci getOrCreate(String sembol, String ad, EnstrumanTipi tip) {
        return araciRepo.findBySembol(sembol).orElseGet(() -> {
            YatirimAraci a = new YatirimAraci();
            a.setSembol(sembol);
            a.setAd(ad);
            a.setTip(tip);
            a.setAktifMi(true);
            return araciRepo.save(a);
        });
    }

    private List<PiyasaVerisi> olusturTarihsel(
            YatirimAraci araci, double baslangic, double drift, double vol, int gunSayisi) {
        List<PiyasaVerisi> liste = new ArrayList<>(gunSayisi + 1);
        LocalDateTime baz = LocalDateTime.now()
                .withHour(16).withMinute(0).withSecond(0).withNano(0);
        double fiyat = baslangic;

        for (int i = gunSayisi; i >= 0; i--) {
            double acilis = fiyat;
            double degisim = drift + vol * RNG.nextGaussian();
            fiyat = Math.max(fiyat * (1 + degisim), 0.0001);
            double yuksek = Math.max(acilis, fiyat) * (1 + Math.abs(RNG.nextGaussian()) * vol * 0.4);
            double dusuk  = Math.min(acilis, fiyat) * (1 - Math.abs(RNG.nextGaussian()) * vol * 0.4);
            long hacim = 500_000L + (long) (RNG.nextDouble() * 9_500_000);

            PiyasaVerisi v = new PiyasaVerisi();
            v.setYatirimAraci(araci);
            v.setFiyat(round(fiyat, araci.getTip()));
            v.setAcilis(round(acilis, araci.getTip()));
            v.setEnYuksek(round(yuksek, araci.getTip()));
            v.setEnDusuk(round(dusuk, araci.getTip()));
            v.setHacim(hacim);
            v.setVeriZamani(baz.minusDays(i));
            liste.add(v);
        }
        return liste;
    }

    private BigDecimal round(double value, EnstrumanTipi tip) {
        int scale;
        if (tip == EnstrumanTipi.KRIPTO) {
            scale = value >= 10000 ? 2 : value >= 1 ? 4 : 6;
        } else if (tip == EnstrumanTipi.DOVIZ) {
            scale = value < 1 ? 6 : 4;
        } else if (tip == EnstrumanTipi.FON) {
            scale = 4;
        } else {
            scale = 2;
        }
        return BigDecimal.valueOf(value).setScale(scale, RoundingMode.HALF_UP);
    }
}
