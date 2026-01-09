package com.finansportali.backend.service;

import com.finansportali.backend.dto.BacktestDto;
import com.finansportali.backend.entity.PiyasaVerisi;
import com.finansportali.backend.repository.PiyasaVerisiRepository;
import com.finansportali.backend.repository.YatirimAraciRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BacktestService {

    private final PiyasaVerisiRepository piyasaVerisiRepository;
    private final YatirimAraciRepository yatirimAraciRepository;

    private static final double KOMISYON_ORANI = 0.001;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    public BacktestDto.Response backtest(BacktestDto.Request req) {
        LocalDate baslangic = LocalDate.parse(req.getBaslangicTarihi());
        LocalDate bitis = LocalDate.parse(req.getBitisTarihi());

        String sembol = yatirimAraciRepository.findById(req.getAraciId())
                .map(a -> a.getSembol()).orElse("BILINMIYOR");

        List<PricePoint> fiyatlar = getTarihselFiyatlar(req.getAraciId(), baslangic, bitis);

        if (fiyatlar.size() < 20) {
            throw new IllegalArgumentException("Yeterli tarihsel veri bulunamadı. En az 20 işlem günü gereklidir.");
        }

        List<String> sinyaller = generateSignals(fiyatlar, req.getStrateji(), req.getParametreler());
        return simulateTrades(fiyatlar, sinyaller, req.getBaslangicSermayesi(), sembol, req.getStrateji());
    }

    private List<String> generateSignals(List<PricePoint> fiyatlar, String strateji, Map<String, Double> parametreler) {
        Map<String, Double> params = parametreler != null ? parametreler : new HashMap<>();
        switch (strateji) {
            case "MA_KESISIM": return maKesisimSinyalleri(fiyatlar, params);
            case "RSI":        return rsiSinyalleri(fiyatlar, params);
            case "MACD":       return macdSinyalleri(fiyatlar, params);
            default: throw new IllegalArgumentException("Bilinmeyen strateji: " + strateji);
        }
    }

    private List<String> maKesisimSinyalleri(List<PricePoint> fiyatlar, Map<String, Double> p) {
        int kisaPeriod = p.getOrDefault("kisaPeriod", 20.0).intValue();
        int uzunPeriod = p.getOrDefault("uzunPeriod", 50.0).intValue();
        double[] prices = fiyatlar.stream().mapToDouble(pt -> pt.fiyat).toArray();
        double[] kisaMA = hesaplaMA(prices, kisaPeriod);
        double[] uzunMA = hesaplaMA(prices, uzunPeriod);
        int n = fiyatlar.size();
        List<String> sinyaller = new ArrayList<>(Collections.nCopies(n, "BEKLE"));
        for (int i = 1; i < n; i++) {
            if (kisaMA[i] == 0 || uzunMA[i] == 0 || kisaMA[i-1] == 0 || uzunMA[i-1] == 0) continue;
            if (kisaMA[i] > uzunMA[i] && kisaMA[i-1] <= uzunMA[i-1])      sinyaller.set(i, "AL");
            else if (kisaMA[i] < uzunMA[i] && kisaMA[i-1] >= uzunMA[i-1]) sinyaller.set(i, "SAT");
        }
        return sinyaller;
    }

    private List<String> rsiSinyalleri(List<PricePoint> fiyatlar, Map<String, Double> p) {
        int period     = p.getOrDefault("period", 14.0).intValue();
        double asiriSatis = p.getOrDefault("asiriSatis", 30.0);
        double asiriAlis  = p.getOrDefault("asiriAlis", 70.0);
        double[] prices = fiyatlar.stream().mapToDouble(pt -> pt.fiyat).toArray();
        double[] rsi = hesaplaRSI(prices, period);
        int n = fiyatlar.size();
        List<String> sinyaller = new ArrayList<>(Collections.nCopies(n, "BEKLE"));
        for (int i = 1; i < n; i++) {
            if (rsi[i] == 0 || rsi[i-1] == 0) continue;
            if (rsi[i-1] < asiriSatis && rsi[i] >= asiriSatis)  sinyaller.set(i, "AL");
            else if (rsi[i-1] > asiriAlis && rsi[i] <= asiriAlis) sinyaller.set(i, "SAT");
        }
        return sinyaller;
    }

    private List<String> macdSinyalleri(List<PricePoint> fiyatlar, Map<String, Double> p) {
        int kisaPeriod   = p.getOrDefault("kisaPeriod", 12.0).intValue();
        int uzunPeriod   = p.getOrDefault("uzunPeriod", 26.0).intValue();
        int sinyalPeriod = p.getOrDefault("sinyalPeriod", 9.0).intValue();
        double[] prices  = fiyatlar.stream().mapToDouble(pt -> pt.fiyat).toArray();
        int n = prices.length;
        double[] kisaEMA = hesaplaEMA(prices, kisaPeriod);
        double[] uzunEMA = hesaplaEMA(prices, uzunPeriod);
        double[] macdLine = new double[n];
        for (int i = 0; i < n; i++) macdLine[i] = kisaEMA[i] - uzunEMA[i];
        double[] sinyalLine = hesaplaEMA(macdLine, sinyalPeriod);
        List<String> sinyaller = new ArrayList<>(Collections.nCopies(n, "BEKLE"));
        for (int i = 1; i < n; i++) {
            if (macdLine[i] == 0 || sinyalLine[i] == 0 || macdLine[i-1] == 0 || sinyalLine[i-1] == 0) continue;
            if (macdLine[i] > sinyalLine[i] && macdLine[i-1] <= sinyalLine[i-1])      sinyaller.set(i, "AL");
            else if (macdLine[i] < sinyalLine[i] && macdLine[i-1] >= sinyalLine[i-1]) sinyaller.set(i, "SAT");
        }
        return sinyaller;
    }

    private BacktestDto.Response simulateTrades(
            List<PricePoint> fiyatlar, List<String> sinyaller,
            double baslangicSermayesi, String sembol, String strateji) {

        double nakit = baslangicSermayesi;
        double hisseAdedi = 0;
        double alisFiyati = 0;

        List<BacktestDto.Islem> islemler = new ArrayList<>();
        List<BacktestDto.PortfoyNokta> portfoyDegerleri = new ArrayList<>();
        List<Double> gunlukGetiriler = new ArrayList<>();

        double oncekiPortfoy = baslangicSermayesi;
        double maxPortfoy = baslangicSermayesi;
        double maxDusus = 0;

        for (int i = 0; i < fiyatlar.size(); i++) {
            PricePoint nokta = fiyatlar.get(i);
            String sinyal = sinyaller.get(i);
            double portfoyDegeri = nakit + hisseAdedi * nokta.fiyat;

            maxPortfoy = Math.max(maxPortfoy, portfoyDegeri);
            double dd = maxPortfoy > 0 ? (maxPortfoy - portfoyDegeri) / maxPortfoy * 100 : 0;
            maxDusus = Math.max(maxDusus, dd);

            if (i > 0) gunlukGetiriler.add((portfoyDegeri - oncekiPortfoy) / Math.max(oncekiPortfoy, 1));
            oncekiPortfoy = portfoyDegeri;

            String isaret = null;

            if ("AL".equals(sinyal) && hisseAdedi == 0 && nakit > 0) {
                double komisyon = nakit * KOMISYON_ORANI;
                hisseAdedi = (nakit - komisyon) / nokta.fiyat;
                alisFiyati = nokta.fiyat;
                nakit = 0;
                isaret = "AL";
                islemler.add(new BacktestDto.Islem(nokta.tarih, "AL", round2(nokta.fiyat),
                        round4(hisseAdedi), round2(hisseAdedi * nokta.fiyat), null, null));

            } else if ("SAT".equals(sinyal) && hisseAdedi > 0) {
                double satisDegeri = hisseAdedi * nokta.fiyat;
                double komisyon = satisDegeri * KOMISYON_ORANI;
                double netGelir = satisDegeri - komisyon;
                double karZarar = netGelir - (hisseAdedi * alisFiyati);
                double karZararYuzde = ((nokta.fiyat - alisFiyati) / alisFiyati) * 100;
                nakit = netGelir;
                isaret = "SAT";
                islemler.add(new BacktestDto.Islem(nokta.tarih, "SAT", round2(nokta.fiyat),
                        round4(hisseAdedi), round2(satisDegeri), round2(karZarar), round2(karZararYuzde)));
                hisseAdedi = 0;
            }

            portfoyDegerleri.add(new BacktestDto.PortfoyNokta(nokta.tarih, round2(portfoyDegeri), isaret));
        }

        // Close open position at end
        if (hisseAdedi > 0) {
            double sonFiyat = fiyatlar.get(fiyatlar.size() - 1).fiyat;
            nakit = (hisseAdedi * sonFiyat) * (1 - KOMISYON_ORANI);
        }

        double bitisSermayesi = round2(nakit);
        double toplamGetiriTL = round2(bitisSermayesi - baslangicSermayesi);
        double toplamGetiriYuzde = round2((toplamGetiriTL / baslangicSermayesi) * 100);

        List<BacktestDto.Islem> satislar = islemler.stream()
                .filter(is -> "SAT".equals(is.getTur()) && is.getKarZarar() != null)
                .collect(Collectors.toList());

        int kazanan = (int) satislar.stream().filter(is -> is.getKarZarar() > 0).count();
        int kaybeden = satislar.size() - kazanan;
        double kazanmaOrani = satislar.isEmpty() ? 0 : round2((double) kazanan / satislar.size() * 100);

        double sharpe = 0;
        if (gunlukGetiriler.size() > 1) {
            double ort = gunlukGetiriler.stream().mapToDouble(d -> d).average().orElse(0);
            double std = Math.sqrt(gunlukGetiriler.stream()
                    .mapToDouble(d -> Math.pow(d - ort, 2)).average().orElse(0));
            if (std > 0) sharpe = round2((ort / std) * Math.sqrt(252));
        }

        return new BacktestDto.Response(
                islemler, portfoyDegerleri,
                toplamGetiriYuzde, toplamGetiriTL,
                round2(maxDusus), kazanmaOrani,
                satislar.size(), kazanan, kaybeden,
                sharpe, baslangicSermayesi, bitisSermayesi,
                sembol, strateji);
    }

    private double[] hesaplaMA(double[] prices, int period) {
        double[] ma = new double[prices.length];
        for (int i = period - 1; i < prices.length; i++) {
            double sum = 0;
            for (int j = i - period + 1; j <= i; j++) sum += prices[j];
            ma[i] = sum / period;
        }
        return ma;
    }

    private double[] hesaplaEMA(double[] prices, int period) {
        double[] ema = new double[prices.length];
        if (prices.length < period) return ema;
        double multiplier = 2.0 / (period + 1);
        double sum = 0;
        for (int i = 0; i < period; i++) sum += prices[i];
        ema[period - 1] = sum / period;
        for (int i = period; i < prices.length; i++) {
            ema[i] = (prices[i] - ema[i-1]) * multiplier + ema[i-1];
        }
        return ema;
    }

    private double[] hesaplaRSI(double[] prices, int period) {
        double[] rsi = new double[prices.length];
        if (prices.length <= period) return rsi;
        double avgGain = 0, avgLoss = 0;
        for (int i = 1; i <= period; i++) {
            double change = prices[i] - prices[i-1];
            if (change > 0) avgGain += change; else avgLoss += Math.abs(change);
        }
        avgGain /= period;
        avgLoss /= period;
        for (int i = period; i < prices.length; i++) {
            if (i > period) {
                double change = prices[i] - prices[i-1];
                double gain = change > 0 ? change : 0;
                double loss = change < 0 ? Math.abs(change) : 0;
                avgGain = (avgGain * (period - 1) + gain) / period;
                avgLoss = (avgLoss * (period - 1) + loss) / period;
            }
            rsi[i] = avgLoss == 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
        }
        return rsi;
    }

    private List<PricePoint> getTarihselFiyatlar(Long araciId, LocalDate baslangic, LocalDate bitis) {
        List<PiyasaVerisi> dbData = piyasaVerisiRepository
                .findByYatirimAraciIdAndVeriZamaniBetweenOrderByVeriZamaniAsc(
                        araciId, baslangic.atStartOfDay(), bitis.atTime(23, 59, 59));

        if (dbData.size() >= 30) {
            return dbData.stream()
                    .collect(Collectors.groupingBy(
                            d -> d.getVeriZamani().toLocalDate(),
                            TreeMap::new,
                            Collectors.averagingDouble(d -> d.getFiyat().doubleValue())))
                    .entrySet().stream()
                    .map(e -> new PricePoint(e.getKey().format(DATE_FMT), e.getValue()))
                    .collect(Collectors.toList());
        }

        return generateDemoData(araciId, baslangic, bitis);
    }

    private List<PricePoint> generateDemoData(Long araciId, LocalDate baslangic, LocalDate bitis) {
        double currentFiyat = piyasaVerisiRepository
                .findTopByYatirimAraciIdOrderByVeriZamaniDesc(araciId)
                .map(d -> d.getFiyat().doubleValue())
                .orElse(100.0);

        List<LocalDate> gunler = new ArrayList<>();
        LocalDate tarih = baslangic;
        while (!tarih.isAfter(bitis)) {
            if (tarih.getDayOfWeek() != DayOfWeek.SATURDAY && tarih.getDayOfWeek() != DayOfWeek.SUNDAY) {
                gunler.add(tarih);
            }
            tarih = tarih.plusDays(1);
        }

        int n = gunler.size();
        if (n == 0) return new ArrayList<>();

        // Build price series backward from current price for realistic values
        double[] prices = new double[n];
        Random rand = new Random(araciId * 31L + baslangic.toEpochDay());
        prices[n - 1] = currentFiyat;
        for (int i = n - 2; i >= 0; i--) {
            double pct = rand.nextGaussian() * 0.015 + 0.0002;
            prices[i] = Math.max(prices[i + 1] / (1 + pct), 0.01);
        }

        List<PricePoint> result = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            result.add(new PricePoint(gunler.get(i).format(DATE_FMT), round2(prices[i])));
        }
        return result;
    }

    private static double round2(double v) { return Math.round(v * 100.0) / 100.0; }
    private static double round4(double v) { return Math.round(v * 10000.0) / 10000.0; }

    private static class PricePoint {
        final String tarih;
        final double fiyat;
        PricePoint(String tarih, double fiyat) { this.tarih = tarih; this.fiyat = fiyat; }
    }
}
