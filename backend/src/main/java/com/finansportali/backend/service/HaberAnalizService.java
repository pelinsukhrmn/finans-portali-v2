package com.finansportali.backend.service;

import com.finansportali.backend.entity.*;
import com.finansportali.backend.entity.EnstrumanTipi;
import com.finansportali.backend.repository.*;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class HaberAnalizService {

    private final BildirimAyariRepository bildirimAyariRepository;
    private final AiBildirimRepository aiBildirimRepository;
    private final PortfoyVarligiRepository portfoyVarligiRepository;
    private final KullaniciRepository kullaniciRepository;
    private final RestTemplate restTemplate;
    private final Optional<JavaMailSender> mailSender;

    @Value("${finans.api.gemini.news-key}")
    private String apiKey;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    public String haberOzetiOlustur(String baslik, String icerik) {
        try {
            String prompt = String.format("""
                    Sen profesyonel bir finans analistisin.
                    Bu finans haberini analiz et:
                    - kısa özet çıkar
                    - piyasa etkisini değerlendir
                    - yatırımcı psikolojisini yorumla
                    Maksimum 2 kısa cümle yaz. Profesyonel ve premium görünmeli.
                    Başlık: %s
                    İçerik: %s
                    """, baslik, icerik != null ? icerik : "");
            return geminiCagir(prompt);
        } catch (Exception e) {
            log.error("[HABER OZETI HATASI]", e);
            return "AI özeti şu anda oluşturulamıyor.";
        }
    }

    @Async
    public void analizEt(List<Haber> yeniHaberler) {
        if (yeniHaberler == null || yeniHaberler.isEmpty()) return;
        if (apiKey == null || apiKey.isBlank()) {
            log.debug("[HABER_ANALIZ] API key yok, analiz atlanıyor.");
            return;
        }

        List<BildirimAyari> aktifAyarlar = bildirimAyariRepository.findByAktifTrueWithKullanici();
        if (aktifAyarlar.isEmpty()) return;

        log.info("[HABER_ANALIZ] {} kullanici icin {} haber analiz ediliyor.", aktifAyarlar.size(), yeniHaberler.size());

        for (BildirimAyari ayar : aktifAyarlar) {
            try {
                kullaniciyaAnalizEt(ayar, yeniHaberler);
            } catch (Exception e) {
                log.error("[HABER_ANALIZ] Kullanici {} hatasi: {}", ayar.getKullanici().getId(), e.getMessage());
            }
        }
    }

    private void kullaniciyaAnalizEt(BildirimAyari ayar, List<Haber> haberler) {
        List<String> takipSemboller = portfoyTakipSemboller(ayar);
        if (takipSemboller.isEmpty()) return;

        // Skip already-notified news
        List<Haber> yeniHaberler = haberler.stream()
            .filter(h -> h.getId() != null &&
                aiBildirimRepository.findByKullaniciIdAndHaberId(ayar.getKullanici().getId(), h.getId()).isEmpty())
            .collect(Collectors.toList());

        if (yeniHaberler.isEmpty()) return;

        // Build indexed news list for the prompt
        StringBuilder haberListesi = new StringBuilder();
        for (int i = 0; i < yeniHaberler.size(); i++) {
            Haber h = yeniHaberler.get(i);
            haberListesi.append(i).append(". ").append(h.getBaslik());
            if (h.getIcerik() != null && !h.getIcerik().isBlank()) {
                String ozet = h.getIcerik().length() > 100 ? h.getIcerik().substring(0, 100) : h.getIcerik();
                haberListesi.append(" — ").append(ozet);
            }
            haberListesi.append("\n");
        }

        String prompt = String.format(
            "Portföy varlıkları: %s\n\nHaberler:\n%s\n" +
            "Yukarıdaki haberlerden hangisi portföydeki varlıkları ETKİLEYEBİLİR?\n" +
            "Her ilgili haber için TAM OLARAK şu 4 alanı | ile ayır:\n" +
            "INDEKS|ETKILENEN_SEMBOLLER|ETKI_YONU|KISA_ACIKLAMA\n" +
            "ETKI_YONU sadece şu üç değerden biri olabilir: POZITIF, NEGATIF, KARISIK\n" +
            "Örnek: 2|THYAO,GARAN|POZITIF|THY karının artması hisse değerini olumlu etkileyebilir.\n" +
            "Eğer hiçbiri ilgili değilse sadece YOK yaz. Türkçe yanıtla.",
            String.join(", ", takipSemboller),
            haberListesi
        );

        String yanit = geminiCagir(prompt);
        if (yanit == null || yanit.isBlank() || yanit.trim().equalsIgnoreCase("YOK")) return;

        for (String satir : yanit.split("\n")) {
            satir = satir.trim();
            if (satir.isEmpty() || satir.equalsIgnoreCase("YOK")) continue;

            String[] parcalar = satir.split("\\|", 4);
            if (parcalar.length < 4) continue;

            try {
                int idx = Integer.parseInt(parcalar[0].trim());
                if (idx < 0 || idx >= yeniHaberler.size()) continue;

                String semboller = parcalar[1].trim();
                String etkiYonu  = normalizeEtkiYonu(parcalar[2].trim());
                String aciklama  = parcalar[3].trim();
                Haber haber = yeniHaberler.get(idx);

                AiBildirimi bildirim = new AiBildirimi();
                bildirim.setKullanici(ayar.getKullanici());
                bildirim.setHaber(haber);
                bildirim.setHaberBaslik(haber.getBaslik());
                bildirim.setMesaj(aciklama);
                bildirim.setEtkilenenSemboller(semboller);
                bildirim.setEtkiYonu(etkiYonu);
                bildirim.setOkundu(false);
                aiBildirimRepository.save(bildirim);

                log.info("[HABER_ANALIZ] Bildirim olusturuldu: kullanici={} haber='{}' etki={}",
                    ayar.getKullanici().getId(), haber.getBaslik(), etkiYonu);

                if (ayar.isEmailAktif()) {
                    emailGonder(ayar.getKullanici().getEposta(), haber.getBaslik(), semboller, etkiYonu, aciklama);
                }

            } catch (NumberFormatException e) {
                log.debug("[HABER_ANALIZ] Parse hatasi: {}", satir);
            }
        }
    }

    private static String normalizeEtkiYonu(String raw) {
        String upper = raw.toUpperCase(java.util.Locale.ROOT);
        if (upper.contains("POZITIF") || upper.contains("POZİTİF") || upper.contains("POSITIVE")) return "POZITIF";
        if (upper.contains("NEGATIF") || upper.contains("NEGATİF") || upper.contains("NEGATIVE")) return "NEGATIF";
        return "KARISIK";
    }

    @Transactional(readOnly = true)
    List<String> portfoyTakipSemboller(BildirimAyari ayar) {
        // Use direct JOIN FETCH query to avoid lazy-load in @Async thread
        List<PortfoyVarligi> varliklar = portfoyVarligiRepository.findByKullaniciId(ayar.getKullanici().getId());
        Set<String> semboller = new LinkedHashSet<>();
        for (PortfoyVarligi v : varliklar) {
            EnstrumanTipi tip = v.getYatirimAraci().getTip();
            if ((ayar.isHisseTakip() && tip == EnstrumanTipi.HISSE) ||
                (ayar.isDovizTakip() && tip == EnstrumanTipi.DOVIZ) ||
                (ayar.isKriptoTakip() && tip == EnstrumanTipi.KRIPTO)) {
                semboller.add(v.getYatirimAraci().getSembol());
            }
        }
        return new ArrayList<>(semboller);
    }

    @SuppressWarnings("unchecked")
    private String geminiCagir(String mesaj) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String url = GEMINI_URL + "?key=" + apiKey;

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("systemInstruction",
                    Map.of("parts", List.of(Map.of("text",
                            "Sen bir Türk finans analistisin. Sadece istenen formatta kısa yanıtlar ver."))));
            body.put("contents", List.of(
                    Map.of("role", "user", "parts", List.of(Map.of("text", mesaj)))));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> resp = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);

            if (resp.getBody() == null) return null;
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) resp.getBody().get("candidates");
            if (candidates == null || candidates.isEmpty()) return null;
            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            return (String) parts.get(0).get("text");

        } catch (Exception e) {
            log.warn("[HABER_ANALIZ] Gemini API hatasi: {}", e.getMessage());
            return null;
        }
    }

    private void emailGonder(String eposta, String haberBasligi, String semboller, String etkiYonu, String aciklama) {
        if (mailSender.isEmpty() || mailFrom == null || mailFrom.isBlank()) return;
        try {
            String etkiSimge = "POZITIF".equals(etkiYonu) ? "📈 POZİTİF" : "NEGATIF".equals(etkiYonu) ? "📉 NEGATİF" : "↔ KARIŞIK";
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(mailFrom);
            msg.setTo(eposta);
            msg.setSubject("📊 Portföy Uyarısı [" + etkiSimge + "]: " + haberBasligi);
            msg.setText(
                "Finans Portalı AI Haber Analizi\n\n" +
                "Haber: " + haberBasligi + "\n" +
                "Etki: " + etkiSimge + "\n" +
                "Etkilenen varlıklar: " + semboller + "\n\n" +
                "Analiz: " + aciklama + "\n\n" +
                "Bu bilgi yatırım tavsiyesi niteliği taşımaz.\n" +
                "Finans Portalı - http://localhost:3000"
            );
            mailSender.get().send(msg);
            log.info("[HABER_ANALIZ] Email gonderildi: {}", eposta);
        } catch (Exception e) {
            log.warn("[HABER_ANALIZ] Email hatasi ({}): {}", eposta, e.getMessage());
        }
    }
}
