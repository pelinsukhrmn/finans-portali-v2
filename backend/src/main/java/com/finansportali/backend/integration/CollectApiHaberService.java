package com.finansportali.backend.integration;
import com.finansportali.backend.entity.Haber;
import com.finansportali.backend.repository.HaberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.time.LocalDateTime;
import java.util.*;
@Service @RequiredArgsConstructor @Slf4j
public class CollectApiHaberService {
    private final RestTemplate restTemplate;
    private final HaberRepository haberRepository;
    @Value("${finans.api.collect-api.base-url}") private String baseUrl;
    @Value("${finans.api.collect-api.api-key}") private String apiKey;
    public List<Haber> haberleriGuncelle() {
        List<Haber> kaydedilenler = new ArrayList<>();
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("authorization", apiKey);
            HttpEntity<String> entity = new HttpEntity<>(headers);
            String url = baseUrl + "/news?tag=economy&language=tr";
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            if (response.getBody() == null) return kaydedilenler;
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> result = (List<Map<String, Object>>) response.getBody().get("result");
            if (result == null) return kaydedilenler;
            for (Map<String, Object> item : result) {
                String url2 = (String) item.getOrDefault("url", "");
                if (haberRepository.existsByUrl(url2)) continue;
                Haber haber = new Haber();
                haber.setBaslik((String) item.getOrDefault("title", ""));
                haber.setIcerik((String) item.getOrDefault("description", ""));
                haber.setKaynak((String) item.getOrDefault("source", ""));
                haber.setUrl(url2);
                haber.setKategori("EKONOMI");
                haber.setYayinTarihi(LocalDateTime.now());
                kaydedilenler.add(haberRepository.save(haber));
            }
        } catch (Exception e) { log.error("CollectAPI haber hata: {}", e.getMessage()); }
        return kaydedilenler;
    }
}
