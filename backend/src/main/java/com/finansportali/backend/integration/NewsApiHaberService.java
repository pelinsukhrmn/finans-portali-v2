package com.finansportali.backend.integration;

import com.finansportali.backend.entity.Haber;
import com.finansportali.backend.repository.HaberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service @RequiredArgsConstructor @Slf4j
public class NewsApiHaberService {

    private final RestTemplate restTemplate;
    private final HaberRepository haberRepository;

    @Value("${finans.api.newsapi.api-key}")
    private String apiKey;

    @Value("${finans.api.newsapi.base-url:https://newsapi.org/v2}")
    private String baseUrl;

    @SuppressWarnings("unchecked")
    public List<Haber> haberleriGuncelle() {
        List<Haber> kaydedilenler = new ArrayList<>();
        try {
            // Türkiye ekonomi haberleri
            String url = baseUrl + "/everything?q=borsa+ekonomi+finans+TL&language=tr"
                + "&sortBy=publishedAt&pageSize=20&apiKey=" + apiKey;

            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response == null || !"ok".equals(response.get("status"))) {
                log.warn("[NEWSAPI] Yanit bos veya hata: {}", response);
                return kaydedilenler;
            }

            List<Map<String, Object>> articles = (List<Map<String, Object>>) response.get("articles");
            if (articles == null) return kaydedilenler;

            for (Map<String, Object> article : articles) {
                String articleUrl = (String) article.get("url");
                if (articleUrl == null || articleUrl.isEmpty()) continue;
                if (haberRepository.existsByUrl(articleUrl)) continue;

                String baslik = (String) article.get("title");
                if (baslik == null || baslik.isEmpty() || baslik.contains("[Removed]")) continue;

                Haber haber = new Haber();
                haber.setBaslik(baslik.length() > 255 ? baslik.substring(0, 255) : baslik);
                haber.setUrl(articleUrl);

                String icerik = (String) article.getOrDefault("description", "");
                if (icerik != null && icerik.length() > 500) icerik = icerik.substring(0, 500);
                haber.setIcerik(icerik);

                Map<String, Object> source = (Map<String, Object>) article.get("source");
                String kaynakAdi = source != null ? (String) source.getOrDefault("name", "NewsAPI") : "NewsAPI";
                haber.setKaynak(kaynakAdi);
                haber.setKategori("EKONOMI");

                String publishedAt = (String) article.get("publishedAt");
                if (publishedAt != null) {
                    try {
                        haber.setYayinTarihi(LocalDateTime.parse(
                            publishedAt, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'")));
                    } catch (Exception e) {
                        haber.setYayinTarihi(LocalDateTime.now());
                    }
                } else {
                    haber.setYayinTarihi(LocalDateTime.now());
                }

                kaydedilenler.add(haberRepository.save(haber));
            }

            log.info("[NEWSAPI] {} haber kaydedildi.", kaydedilenler.size());

        } catch (Exception e) {
            log.error("[NEWSAPI] Hata: {}", e.getMessage());
        }
        return kaydedilenler;
    }
}
