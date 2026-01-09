package com.finansportali.backend.integration;

import com.finansportali.backend.entity.*;
import com.finansportali.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service @RequiredArgsConstructor @Slf4j
public class CoinGeckoService {

    private final RestTemplate restTemplate;
    private final YatirimAraciRepository yatirimAraciRepository;
    private final PiyasaVerisiRepository piyasaVerisiRepository;

    @Value("${finans.api.coingecko.base-url:https://api.coingecko.com/api/v3}")
    private String baseUrl;

    private static final Map<String, String[]> KRIPTO_MAP = Map.of(
        "bitcoin",      new String[]{"BTC/TRY", "Bitcoin"},
        "ethereum",     new String[]{"ETH/TRY", "Ethereum"},
        "binancecoin",  new String[]{"BNB/TRY", "BNB"},
        "ripple",       new String[]{"XRP/TRY", "XRP"},
        "solana",       new String[]{"SOL/TRY", "Solana"}
    );

    @SuppressWarnings("unchecked")
    public List<PiyasaVerisi> kriptoGuncelle() {
        List<PiyasaVerisi> kaydedilenler = new ArrayList<>();
        try {
            String ids = String.join(",", KRIPTO_MAP.keySet());
            String url = baseUrl + "/simple/price?ids=" + ids
                + "&vs_currencies=try&include_24hr_change=true"
                + "&include_24hr_vol=true&precision=2";

            HttpHeaders headers = new HttpHeaders();
            headers.set("Accept", "application/json");
            headers.set("User-Agent", "FinansPortali/1.0");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> response = new RestTemplate()
                .exchange(url, HttpMethod.GET, entity, Map.class);

            Map<String, Object> data = response.getBody();
            if (data == null) { log.warn("[COINGECKO] Bos yanit"); return kaydedilenler; }

            for (Map.Entry<String, String[]> entry : KRIPTO_MAP.entrySet()) {
                String coinId = entry.getKey();
                String sembol = entry.getValue()[0];
                String ad = entry.getValue()[1];

                Map<String, Object> coinData = (Map<String, Object>) data.get(coinId);
                if (coinData == null) continue;

                Object fiyatObj = coinData.get("try");
                if (fiyatObj == null) continue;

                BigDecimal fiyat = new BigDecimal(fiyatObj.toString());

                // Önceki kapanış hesapla (24sa değişimden)
                BigDecimal acilis = null;
                Object changeObj = coinData.get("try_24h_change");
                if (changeObj != null) {
                    try {
                        double changePct = Double.parseDouble(changeObj.toString());
                        if (changePct != 0) {
                            // fiyat = acilis * (1 + changePct/100)
                            // acilis = fiyat / (1 + changePct/100)
                            double acilisD = fiyat.doubleValue() / (1 + changePct / 100.0);
                            acilis = BigDecimal.valueOf(acilisD);
                        }
                    } catch (Exception ignored) {}
                }

                YatirimAraci araci = yatirimAraciRepository.findBySembol(sembol)
                    .orElseGet(() -> {
                        YatirimAraci yeni = new YatirimAraci();
                        yeni.setSembol(sembol); yeni.setAd(ad);
                        yeni.setTip(EnstrumanTipi.KRIPTO); yeni.setAktifMi(true);
                        return yatirimAraciRepository.save(yeni);
                    });

                PiyasaVerisi veri = new PiyasaVerisi();
                veri.setYatirimAraci(araci);
                veri.setFiyat(fiyat);
                veri.setAcilis(acilis);
                veri.setVeriZamani(LocalDateTime.now());
                kaydedilenler.add(piyasaVerisiRepository.save(veri));
            }

            log.info("[COINGECKO] {} kripto guncellendi.", kaydedilenler.size());

        } catch (Exception e) {
            log.error("[COINGECKO] Hata: {}", e.getMessage());
        }
        return kaydedilenler;
    }
}
