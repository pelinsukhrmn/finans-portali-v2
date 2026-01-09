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
public class CollectApiHisseService {
    private final RestTemplate restTemplate;
    private final YatirimAraciRepository yatirimAraciRepository;
    private final PiyasaVerisiRepository piyasaVerisiRepository;
    @Value("${finans.api.collect-api.base-url}") private String baseUrl;
    @Value("${finans.api.collect-api.api-key}") private String apiKey;
    public List<PiyasaVerisi> hisseGuncelle() {
        List<PiyasaVerisi> kaydedilenler = new ArrayList<>();
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("authorization", apiKey);
            HttpEntity<String> entity = new HttpEntity<>(headers);
            String url = baseUrl + "/hisseSenedi";
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            if (response.getBody() == null) return kaydedilenler;
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> result = (List<Map<String, Object>>) response.getBody().get("result");
            if (result == null) return kaydedilenler;
            for (Map<String, Object> item : result) {
                String sembol = (String) item.get("code");
                String ad = (String) item.getOrDefault("text", sembol);
                Object lastPrice = item.get("lastprice");
                if (sembol == null || lastPrice == null) continue;
                try {
                    BigDecimal fiyat = new BigDecimal(lastPrice.toString());
                    YatirimAraci araci = yatirimAraciRepository.findBySembol(sembol).orElseGet(() -> {
                        YatirimAraci yeni = new YatirimAraci();
                        yeni.setSembol(sembol); yeni.setAd(ad); yeni.setTip(EnstrumanTipi.HISSE); yeni.setAktifMi(true);
                        return yatirimAraciRepository.save(yeni);
                    });
                    PiyasaVerisi veri = new PiyasaVerisi();
                    veri.setYatirimAraci(araci); veri.setFiyat(fiyat); veri.setVeriZamani(LocalDateTime.now());
                    kaydedilenler.add(piyasaVerisiRepository.save(veri));
                } catch (Exception e) { log.warn("Hisse parse hata: {}", sembol); }
            }
        } catch (Exception e) { log.error("CollectAPI hisse hata: {}", e.getMessage()); }
        return kaydedilenler;
    }
}
