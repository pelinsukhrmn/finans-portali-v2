package com.finansportali.backend.integration;

import com.finansportali.backend.entity.*;
import com.finansportali.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service @RequiredArgsConstructor @Slf4j
public class YahooFinanceService {

    private final RestTemplate restTemplate;
    private final YatirimAraciRepository yatirimAraciRepository;
    private final PiyasaVerisiRepository piyasaVerisiRepository;

    private static final List<String[]> BIST_STOCKS = List.of(
        new String[]{"THYAO.IS", "THYAO", "Türk Hava Yolları"},
        new String[]{"GARAN.IS", "GARAN", "Garanti BBVA"},
        new String[]{"ASELS.IS", "ASELS", "Aselsan"},
        new String[]{"SISE.IS",  "SISE",  "Sise Cam"},
        new String[]{"KCHOL.IS", "KCHOL", "Koc Holding"},
        new String[]{"BIMAS.IS", "BIMAS", "BIM Magazalar"},
        new String[]{"AKBNK.IS", "AKBNK", "Akbank"},
        new String[]{"TUPRS.IS", "TUPRS", "Tupras"},
        new String[]{"PGSUS.IS", "PGSUS", "Pegasus"},
        new String[]{"EREGL.IS", "EREGL", "Ereglli Demir Celik"},
        new String[]{"SAHOL.IS", "SAHOL", "Sabanci Holding"},
        new String[]{"TKFEN.IS", "TKFEN", "Tekfen Holding"},
        new String[]{"FROTO.IS", "FROTO", "Ford Otosan"},
        new String[]{"TOASO.IS", "TOASO", "Tofas"},
        new String[]{"KOZAL.IS", "KOZAL", "Koza Altin"}
    );

    @SuppressWarnings("unchecked")
    public List<PiyasaVerisi> hisseleriGuncelle() {
        List<PiyasaVerisi> kaydedilenler = new ArrayList<>();

        for (String[] stock : BIST_STOCKS) {
            try {
                String yahooSymbol = stock[0];
                String sembol = stock[1];
                String ad = stock[2];

                String url = "https://query1.finance.yahoo.com/v8/finance/chart/"
                    + yahooSymbol + "?interval=1d&range=2d";

                Map<String, Object> response = restTemplate.getForObject(url, Map.class);
                if (response == null) continue;

                Map<String, Object> chart = (Map<String, Object>) response.get("chart");
                if (chart == null) continue;
                List<Map<String, Object>> results = (List<Map<String, Object>>) chart.get("result");
                if (results == null || results.isEmpty()) continue;

                Map<String, Object> meta = (Map<String, Object>) results.get(0).get("meta");
                if (meta == null) continue;

                Object priceObj = meta.get("regularMarketPrice");
                if (priceObj == null) continue;

                BigDecimal fiyat = new BigDecimal(priceObj.toString());
                Object highObj  = meta.get("regularMarketDayHigh");
                Object lowObj   = meta.get("regularMarketDayLow");
                Object openObj  = meta.get("regularMarketOpen");
                Object volObj   = meta.get("regularMarketVolume");
                Object prevObj  = meta.get("previousClose");

                YatirimAraci araci = yatirimAraciRepository.findBySembol(sembol)
                    .orElseGet(() -> {
                        YatirimAraci yeni = new YatirimAraci();
                        yeni.setSembol(sembol); yeni.setAd(ad);
                        yeni.setTip(EnstrumanTipi.HISSE); yeni.setAktifMi(true);
                        return yatirimAraciRepository.save(yeni);
                    });

                PiyasaVerisi veri = new PiyasaVerisi();
                veri.setYatirimAraci(araci);
                veri.setFiyat(fiyat);
                if (highObj != null) veri.setEnYuksek(new BigDecimal(highObj.toString()));
                if (lowObj  != null) veri.setEnDusuk(new BigDecimal(lowObj.toString()));
                if (openObj != null) veri.setAcilis(new BigDecimal(openObj.toString()));
                else if (prevObj != null) veri.setAcilis(new BigDecimal(prevObj.toString()));
                if (volObj != null) {
                    try { veri.setHacim(Long.parseLong(volObj.toString().split("\\.")[0])); }
                    catch (NumberFormatException ignored) {}
                }
                veri.setVeriZamani(LocalDateTime.now());
                kaydedilenler.add(piyasaVerisiRepository.save(veri));

                Thread.sleep(200);
            } catch (Exception e) {
                log.warn("[YAHOO] {} hatasi: {}", stock[1], e.getMessage());
            }
        }
        log.info("[YAHOO] {} hisse guncellendi.", kaydedilenler.size());
        return kaydedilenler;
    }
}
