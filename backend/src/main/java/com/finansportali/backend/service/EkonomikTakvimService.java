package com.finansportali.backend.service;

import com.finansportali.backend.dto.EkonomikTakvimDto;
import com.finansportali.backend.entity.EkonomikTakvim;
import com.finansportali.backend.repository.EkonomikTakvimRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EkonomikTakvimService {

    private final EkonomikTakvimRepository repository;

    private static final DateTimeFormatter TARIH_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final DateTimeFormatter SAAT_FMT  = DateTimeFormatter.ofPattern("HH:mm");

    public List<EkonomikTakvimDto.Response> listele(String aralik, String ulke, Integer onem) {
        LocalDateTime now = LocalDateTime.now();
        List<EkonomikTakvim> liste;

        switch (aralik == null ? "tumu" : aralik) {
            case "bugun":
                liste = repository.findByZamanBetweenOrderByZamanAsc(
                        now.toLocalDate().atStartOfDay(),
                        now.toLocalDate().atTime(23, 59, 59));
                break;
            case "bu-hafta":
                LocalDate haftaBasi = now.toLocalDate().with(DayOfWeek.MONDAY);
                liste = repository.findByZamanBetweenOrderByZamanAsc(
                        haftaBasi.atStartOfDay(),
                        haftaBasi.plusDays(6).atTime(23, 59, 59));
                break;
            case "bu-ay":
                liste = repository.findByZamanBetweenOrderByZamanAsc(
                        now.toLocalDate().withDayOfMonth(1).atStartOfDay(),
                        now.toLocalDate().withDayOfMonth(
                                now.toLocalDate().lengthOfMonth()).atTime(23, 59, 59));
                break;
            default:
                liste = repository.findAllByOrderByZamanAsc();
        }

        return liste.stream()
                .filter(e -> ulke == null || ulke.equals("TUMU") || ulke.equals(e.getUlke()))
                .filter(e -> onem == null || e.getOnemDerecesi() == onem)
                .map(e -> toResponse(e, now))
                .collect(Collectors.toList());
    }

    public EkonomikTakvimDto.Response ekle(EkonomikTakvimDto.Request req) {
        EkonomikTakvim e = new EkonomikTakvim();
        e.setUlke(req.getUlke());
        e.setOlay(req.getOlay());
        e.setOnemDerecesi(req.getOnemDerecesi());
        e.setAciklananDeger(req.getAciklananDeger());
        e.setBeklenti(req.getBeklenti());
        e.setOncekiDeger(req.getOncekiDeger());
        e.setZaman(req.getZaman());
        return toResponse(repository.save(e), LocalDateTime.now());
    }

    public void demoDataSeed() {
        if (repository.count() > 0) return;

        LocalDate bugun = LocalDate.now();

        Object[][] olaylar = {
            // { ulke, olay, onem, beklenti, onceki, gunOffset, saat }
            { "TR", "TCMB Faiz Kararı",              3, "%45,00", "%47,50", -14, "14:00" },
            { "TR", "TÜİK TÜFE Enflasyon (Aylık)",   3, "%2,8",   "%3,2",  -7,  "10:00" },
            { "TR", "TÜİK ÜFE (Aylık)",               2, "%2,1",   "%2,4",  -7,  "10:00" },
            { "TR", "Türkiye Cari Açık",               2, "-6,2B$", "-5,8B$",-10, "10:00" },
            { "TR", "Türkiye Sanayi Üretimi (Yıllık)", 1, "%4,5",   "%3,8",  -5,  "10:00" },
            { "TR", "TÜİK GSYİH Büyüme (Yıllık)",     3, "%3,2",   "%2,9",   3,  "10:00" },
            { "TR", "TCMB Faiz Kararı",                3, null,     "%45,00", 21, "14:00" },
            { "TR", "TÜİK TÜFE Enflasyon (Aylık)",    3, "%2,5",   null,     35, "10:00" },
            { "TR", "Türkiye İşsizlik Oranı",          2, "%8,4",   null,     14, "10:00" },
            { "US", "Fed Faiz Kararı (FOMC)",          3, "%4,25",  "%4,50", -21, "21:00" },
            { "US", "ABD Tarım Dışı İstihdam (NFP)",   3, "185B",   "228B",  -18, "15:30" },
            { "US", "ABD TÜFE (Aylık)",                3, "%0,3",   "%0,4",  -11, "15:30" },
            { "US", "ABD Çekirdek TÜFE (Yıllık)",      3, "%3,5",   "%3,8",  -11, "15:30" },
            { "US", "ABD GSYİH (Q1 İlk Tahmin)",       3, "%2,1",   "%2,4",   -4, "15:30" },
            { "US", "Michigan Tüketici Güveni",         2, "73,0",   "77,2",   -4, "17:00" },
            { "US", "ABD Haftalık İstihdam Talepleri",  1, "215B",   null,      2, "15:30" },
            { "US", "ABD ISM İmalat PMI",               2, "49,8",   null,      4, "17:00" },
            { "US", "Fed Faiz Kararı (FOMC)",           3, null,     "%4,25",  35, "21:00" },
            { "US", "ABD Tarım Dışı İstihdam (NFP)",    3, null,     null,     20, "15:30" },
            { "EU", "ECB Faiz Kararı",                  3, "%2,25",  "%2,50", -28, "15:15" },
            { "EU", "Almanya İmalat PMI",               2, "45,2",   "44,1",  -15, "10:00" },
            { "EU", "Euro Bölgesi TÜFE (Yıllık)",       3, "%2,2",   "%2,4",  -10, "12:00" },
            { "EU", "Euro Bölgesi GSYİH (Yıllık)",      3, "%1,2",   "%0,9",   -3, "12:00" },
            { "EU", "ECB Faiz Kararı",                  3, null,     "%2,25",  21, "15:15" },
            { "EU", "Almanya İş Güveni (IFO)",          1, "87,5",   null,     10, "11:00" },
        };

        for (Object[] o : olaylar) {
            EkonomikTakvim e = new EkonomikTakvim();
            e.setUlke((String) o[0]);
            e.setOlay((String) o[1]);
            e.setOnemDerecesi((Integer) o[2]);
            e.setBeklenti((String) o[3]);
            e.setOncekiDeger((String) o[4]);

            int gunOffset = (Integer) o[5];
            String[] saatParcalari = ((String) o[6]).split(":");
            LocalDateTime zaman = bugun.plusDays(gunOffset)
                    .atTime(Integer.parseInt(saatParcalari[0]), Integer.parseInt(saatParcalari[1]));
            e.setZaman(zaman);

            // Geçmiş olaylar için gerçekleşen değer ata
            if (gunOffset < 0 && o[3] != null) {
                String beklenti = (String) o[3];
                // Gerçekleşen ≈ beklentiye yakın ama küçük sapma
                e.setAciklananDeger(beklenti);
            }

            repository.save(e);
        }
    }

    private EkonomikTakvimDto.Response toResponse(EkonomikTakvim e, LocalDateTime now) {
        boolean gerceklesti = e.getZaman().isBefore(now);
        String sonucDurumu = null;

        if (gerceklesti && e.getAciklananDeger() != null && e.getBeklenti() != null) {
            try {
                double aciklanan = parseDouble(e.getAciklananDeger());
                double beklenti  = parseDouble(e.getBeklenti());
                if (aciklanan > beklenti)      sonucDurumu = "YUKARI";
                else if (aciklanan < beklenti) sonucDurumu = "ASAGI";
                else                           sonucDurumu = "NÖTR";
            } catch (Exception ignored) {}
        }

        return new EkonomikTakvimDto.Response(
                e.getId(), e.getUlke(), e.getOlay(), e.getOnemDerecesi(),
                e.getAciklananDeger(), e.getBeklenti(), e.getOncekiDeger(),
                e.getZaman().format(TARIH_FMT),
                e.getZaman().format(SAAT_FMT),
                gerceklesti, sonucDurumu);
    }

    private double parseDouble(String s) {
        return Double.parseDouble(s.replaceAll("[^0-9.,\\-]", "").replace(",", "."));
    }
}
