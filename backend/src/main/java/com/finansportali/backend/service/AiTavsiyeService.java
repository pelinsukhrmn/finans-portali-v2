package com.finansportali.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.finansportali.backend.dto.AnomalyDTO;
import com.finansportali.backend.dto.ChatMesajDTO;
import com.finansportali.backend.dto.ChatSessionDTO;
import com.finansportali.backend.controller.AiTavsiyeController.PortfoyOzeti;
import com.finansportali.backend.controller.AiTavsiyeController.VarlikOzeti;
import com.finansportali.backend.entity.ChatMesaj;
import com.finansportali.backend.entity.ChatSession;
import com.finansportali.backend.entity.PortfoyVarligi;
import com.finansportali.backend.repository.ChatMesajRepository;
import com.finansportali.backend.repository.ChatSessionRepository;
import com.finansportali.backend.repository.PortfoyVarligiRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiTavsiyeService {

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;
    private final ChatSessionRepository chatSessionRepository;
    private final ChatMesajRepository chatMesajRepository;
    private final PortfoyVarligiRepository portfoyVarligiRepository;
    private final PiyasaVerisiService piyasaVerisiService;

    @Value("${finans.api.gemini.chat-key}")
    private String chatApiKey;

    @Value("${finans.api.gemini.portfolio-key}")
    private String portfolioApiKey;

    @Value("${finans.api.gemini.dashboard-key}")
    private String dashboardApiKey;

    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    public record TavsiyeSonuc(
            String cevap,
            Map<String, Object> grafikData,
            List<AnomalyDTO> anomalies,
            List<String> secenekler) {}

    // ─── Session yönetimi ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ChatSessionDTO> kullanicininOturumlari(Long kullaniciId) {
        return chatSessionRepository
                .findByKullaniciIdOrderByGuncellemeTarihiDesc(kullaniciId)
                .stream()
                .map(s -> {
                    String sonMesaj = (s.getMesajlar() != null && !s.getMesajlar().isEmpty())
                            ? s.getMesajlar().get(s.getMesajlar().size() - 1).getIcerik()
                            : null;
                    return new ChatSessionDTO(
                            s.getId(), s.getBaslik(),
                            s.getOlusturmaTarihi(), s.getGuncellemeTarihi(),
                            sonMesaj, "ACTIVE", false);
                })
                .toList();
    }

    @Transactional
    public ChatSessionDTO yeniOturumOlustur(Long kullaniciId, String baslik) {
        ChatSession s = new ChatSession();
        s.setKullaniciId(kullaniciId);
        s.setBaslik(baslik != null && !baslik.isBlank() ? baslik : "Yeni Sohbet");
        ChatSession saved = chatSessionRepository.save(s);
        return new ChatSessionDTO(
                saved.getId(), saved.getBaslik(),
                saved.getOlusturmaTarihi(), saved.getGuncellemeTarihi(),
                null, "ACTIVE", false);
    }

    @Transactional(readOnly = true)
    public List<ChatMesajDTO> gecmisMesajlariGetir(Long seansId) {
        if (!chatSessionRepository.existsById(seansId)) return Collections.emptyList();
        return chatMesajRepository
                .findTop50BySession_IdOrderByOlusturmaTarihiAsc(seansId)
                .stream()
                .map(m -> new ChatMesajDTO(
                        m.getId(), m.getRol(), m.getIcerik(),
                        m.getGrafikData(), parseAnomaliesSafe(m.getAnomalies()),
                        m.getOlusturmaTarihi(),
                        m.getHasChart(), m.getHasAnomaly(), m.getHasInsights(),
                        m.getSignals(), m.getAiMetadata()))
                .toList();
    }

    // ─── Ana tavsiye metodu ──────────────────────────────────────────────────

    @Transactional
    public TavsiyeSonuc tavsiyeAl(Long seansId, String soru, PortfoyOzeti portfoy) {
        if (chatApiKey == null || chatApiKey.isBlank()) {
            return new TavsiyeSonuc(
                    "AI asistanı şu anda kullanılabilir değil. Lütfen sistem yöneticinizle iletişime geçin.",
                    null, null, null);
        }

        ChatSession session = chatSessionRepository.findById(seansId)
                .orElseThrow(() -> new RuntimeException("Seans bulunamadı: " + seansId));

        try {
            long mesajSayisi = chatMesajRepository.countBySession_Id(seansId);
            if (mesajSayisi == 0) {
                session.setBaslik(soru.length() > 50 ? soru.substring(0, 50) + "…" : soru);
            }

            ChatMesaj kullaniciMesaji = ChatMesaj.builder()
                    .session(session).rol("user").icerik(soru).build();
            chatMesajRepository.save(kullaniciMesaji);

            List<ChatMesaj> gecmisMesajlar = chatMesajRepository
                    .findTop20BySession_IdOrderByOlusturmaTarihiDesc(seansId);
            Collections.reverse(gecmisMesajlar);

            String sistemMesaji = sistemPromptOlustur(portfoy);
            String aiHamCevap = geminiCagir(sistemMesaji, gecmisMesajlar, chatApiKey);

            AiYanit ayriklanmis = aiYanitAyikla(aiHamCevap);

            String grafikJson = null;
            try {
                if (ayriklanmis.grafikData() != null && !ayriklanmis.grafikData().isEmpty()) {
                    grafikJson = objectMapper.writeValueAsString(ayriklanmis.grafikData());
                }
            } catch (Exception e) {
                log.error("[AI] Grafik JSON serialize hatası", e);
            }

            String anomaliesJson = null;
            try {
                if (ayriklanmis.anomalies() != null && !ayriklanmis.anomalies().isEmpty()) {
                    anomaliesJson = objectMapper.writeValueAsString(ayriklanmis.anomalies());
                }
            } catch (Exception e) {
                log.error("[AI] Anomaly JSON serialize hatası", e);
            }

            ChatMesaj aiMesaji = ChatMesaj.builder()
                    .session(session).rol("model").icerik(ayriklanmis.cevap())
                    .grafikData(grafikJson).anomalies(anomaliesJson).build();
            chatMesajRepository.save(aiMesaji);
            chatSessionRepository.save(session);

            return new TavsiyeSonuc(
                    ayriklanmis.cevap(),
                    ayriklanmis.grafikData(),
                    ayriklanmis.anomalies(),
                    seceneklerOlustur(soru, ayriklanmis.cevap()));

        } catch (Exception e) {
            log.error("[AI] Hata: {}", e.getMessage());
            return new TavsiyeSonuc(
                    "Şu anda yanıt alınamıyor. Lütfen tekrar deneyin.",
                    null, null, null);
        }
    }

    // ─── Market briefing ────────────────────────────────────────────────────

    public String marketBriefing(String prompt) {
        List<ChatMesaj> fakeMessages = List.of(
                ChatMesaj.builder().rol("user").icerik("Piyasa brifingi oluştur").build());
        return geminiCagir(prompt, fakeMessages, dashboardApiKey);
    }

    // ─── Portfolio insight ───────────────────────────────────────────────────

    public Map<String, Object> portfolioInsight(Long kullaniciId) {
        try {
            List<PortfoyVarligi> varliklar = portfoyVarligiRepository.findByKullaniciId(kullaniciId);
            if (varliklar.isEmpty()) {
                return Map.of("healthScore", 0, "riskLevel", "Bilinmiyor",
                        "insight", "Henüz analiz edilecek portföy bulunmuyor.", "warnings", List.of());
            }

            StringBuilder portfoyText = new StringBuilder();
            for (PortfoyVarligi v : varliklar) {
                String sembol = v.getYatirimAraci().getSembol();
                BigDecimal guncelFiyat = piyasaVerisiService.getGuncelFiyat(v.getYatirimAraci().getId());
                BigDecimal toplamDeger = v.getMiktar().multiply(guncelFiyat);
                BigDecimal maliyet = v.getMiktar().multiply(v.getOrtalamaMaliyet());
                BigDecimal karZarar = toplamDeger.subtract(maliyet);
                portfoyText.append("- ").append(sembol)
                        .append(" | Miktar: ").append(v.getMiktar())
                        .append(" | Ort. Maliyet: ").append(v.getOrtalamaMaliyet())
                        .append(" | Güncel Değer: ").append(toplamDeger)
                        .append(" | K/Z: ").append(karZarar).append("\n");
            }

            String prompt = """
                    Sen profesyonel bir yatırım analisti yapay zekasısın.
                    Kullanıcının yatırım portföyünü analiz et ve SADECE JSON dön:
                    {
                      "healthScore": 0-100,
                      "riskLevel": "Düşük/Orta/Yüksek",
                      "insight": "Profesyonel yatırım yorumu",
                      "warnings": ["uyarı 1", "uyarı 2"]
                    }
                    Portföy:
                    %s
                    """.formatted(portfoyText);

            List<ChatMesaj> fakeMessages = List.of(
                    ChatMesaj.builder().rol("user").icerik("Portföyümü analiz et").build());
            String response = geminiCagir(prompt, fakeMessages, portfolioApiKey);
            response = response.replace("```json", "").replace("```", "").trim();

            return objectMapper.readValue(response, new TypeReference<Map<String, Object>>() {});

        } catch (Exception e) {
            log.error("[Portfolio Insight Error]", e);
            return Map.of("healthScore", 0, "riskLevel", "Bilinmiyor",
                    "insight", "AI portföy analizi şu anda oluşturulamıyor.", "warnings", List.of());
        }
    }

    // ─── Sistem promptu ──────────────────────────────────────────────────────

    private String sistemPromptOlustur(PortfoyOzeti portfoy) {
        StringBuilder sb = new StringBuilder();
        sb.append("Sen bir Türk finansal yatırım asistanısın. ");
        sb.append("Kullanıcının portföy verilerini analiz ederek kısa, net ve anlaşılır Türkçe yanıtlar veriyorsun. ");
        sb.append("Bir finansal yatırım koçu gibi davran. Yanıtın doğal, profesyonel ve insan gibi olsun. ");
        sb.append("Yanıt verirken 'NovArIs Yorumu:' şeklinde kısa bir analiz bölümü ekle. ");
        sb.append("Her zaman 'Bu bilgi yatırım tavsiyesi niteliği taşımaz.' uyarısını cevabının sonuna ekle.\n\n");
        sb.append("Sadece finans, yatırım, ekonomi, borsa ve kripto alanlarında yardımcı ol.\n\n");

        sb.append("GRAFİK VE ANOMALİ ÇIKTISI KURALLARI:\n");
        sb.append("Eğer soru portföy, varlık dağılımı, kar/zarar veya risk içeriyorsa yanıtının SONUNA JSON bloğu EKLE.\n");
        sb.append("```json ile başlayıp ``` ile bitmeli. GRAFİK TİPLERİ:\n");
        sb.append("- PIE: dağılım soruları — {sembol, isim, agirlik}\n");
        sb.append("- BAR: kar/zarar soruları — {sembol, isim, karZarar}\n");
        sb.append("- RISK_BAR: risk soruları — {sembol, isim, agirlik, karZarar}\n");
        sb.append("ANOMALİ TİPLERİ: CONCENTRATION, UNDERPERFORMANCE, HIGH_RISK_PORTFOLIO\n");
        sb.append("Grafik gerekmiyorsa JSON bloğu ekleme.\n\n");

        if (portfoy != null) {
            sb.append("Kullanıcının portföyü (").append(portfoy.ad()).append("):\n");
            sb.append("- Toplam Değer: ₺").append(String.format("%.2f", portfoy.toplamDeger())).append("\n");
            sb.append("- Toplam Maliyet: ₺").append(String.format("%.2f", portfoy.toplamMaliyet())).append("\n");
            sb.append("- Getiri: %").append(String.format("%.2f", portfoy.nominalGetiriYuzde())).append("\n");
            if (portfoy.varliklar() != null && !portfoy.varliklar().isEmpty()) {
                sb.append("- Varlıklar:\n");
                for (VarlikOzeti v : portfoy.varliklar()) {
                    String kz = v.nominalKarZarar() >= 0
                            ? "+₺" + String.format("%.2f", v.nominalKarZarar())
                            : "-₺" + String.format("%.2f", Math.abs(v.nominalKarZarar()));
                    sb.append("  * ").append(v.sembol())
                            .append(" (").append(v.enstrumanAdi()).append(")")
                            .append(" — Ağırlık: %").append(String.format("%.1f", v.agirlik()))
                            .append(", K/Z: ").append(kz).append("\n");
                }
            }
        }
        return sb.toString();
    }

    // ─── AI yanıt ayrıştırma ─────────────────────────────────────────────────

    private record AiYanit(String cevap, Map<String, Object> grafikData, List<AnomalyDTO> anomalies) {}

    @SuppressWarnings("unchecked")
    private AiYanit aiYanitAyikla(String hamYanit) {
        if (hamYanit == null || hamYanit.isBlank()) return new AiYanit(hamYanit, null, List.of());

        String temizMetin = hamYanit;
        Map<String, Object> grafikData = null;
        List<AnomalyDTO> anomalies = List.of();

        try {
            Pattern pattern = Pattern.compile("```(?:json|JSON)?\\s*(\\{.*?\\})\\s*```", Pattern.DOTALL);
            Matcher matcher = pattern.matcher(hamYanit);
            if (matcher.find()) {
                String jsonBlok = matcher.group(1);
                temizMetin = hamYanit.replace(matcher.group(0), "").trim();
                JsonNode root = objectMapper.readTree(jsonBlok);

                JsonNode grafikNode = root.get("grafikData");
                if (grafikNode != null && grafikNode.isObject()) {
                    grafikData = objectMapper.convertValue(grafikNode, new TypeReference<Map<String, Object>>() {});
                    Object tip = grafikData.get("tip");
                    if (tip != null && !Set.of("PIE", "BAR", "RISK_BAR").contains(tip.toString())) {
                        grafikData = null;
                    }
                }

                JsonNode anomaliesNode = root.get("anomalies");
                if (anomaliesNode != null && anomaliesNode.isArray()) {
                    anomalies = objectMapper.convertValue(anomaliesNode, new TypeReference<List<AnomalyDTO>>() {});
                }
            }
        } catch (Exception e) {
            log.warn("[AI] JSON parse edilemedi: {}", e.getMessage());
        }
        return new AiYanit(temizMetin, grafikData, anomalies);
    }

    // ─── Öneri seçenekleri ────────────────────────────────────────────────────

    private List<String> seceneklerOlustur(String soru, String cevap) {
        String birlesik = (soru + " " + cevap).toLowerCase(java.util.Locale.forLanguageTag("tr"));
        if (icerir(birlesik, "dağılım", "ağırlık", "pasta", "allocation"))
            return List.of("Çeşitlendirme için ne önerirsin?", "Hangi varlığın payını artırmalıyım?", "Portföyümün risk seviyesi nedir?");
        if (icerir(birlesik, "kar", "zarar", "getiri", "kazanç", "kayıp"))
            return List.of("Zarar eden varlıklarım için ne yapmalıyım?", "En iyi performanslı varlığımı analiz eder misin?", "Portföy getirim piyasayla nasıl karşılaştırılır?");
        if (icerir(birlesik, "risk", "riskli", "volatil"))
            return List.of("Riski nasıl azaltabilirim?", "Düşük riskli alternatif varlıklar nelerdir?", "Portföyüme altın veya tahvil eklemeli miyim?");
        if (icerir(birlesik, "al", "sat", "işlem", "pozisyon"))
            return List.of("Bu işlemin risklerini açıklar mısın?", "Hangi fiyat seviyesinde almalıyım?", "Stop-loss nerede olmalı?");
        return List.of("Portföyümün genel durumu nasıl?", "En riskli varlığım hangisi?", "Çeşitlendirme önerir misin?");
    }

    private boolean icerir(String metin, String... kelimeler) {
        for (String k : kelimeler) if (metin.contains(k)) return true;
        return false;
    }

    private List<AnomalyDTO> parseAnomaliesSafe(String json) {
        try {
            if (json == null || json.isBlank()) return List.of();
            return objectMapper.readValue(json, new TypeReference<List<AnomalyDTO>>() {});
        } catch (Exception e) {
            log.warn("[AI] Anomaly parse error: {}", e.getMessage());
            return List.of();
        }
    }

    // ─── Gemini API çağrısı ───────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private String geminiCagir(String sistemMesaji, List<ChatMesaj> kronolojikMesajlar, String apiKey) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String url = GEMINI_URL + "?key=" + apiKey;

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("systemInstruction", Map.of("parts", List.of(Map.of("text", sistemMesaji))));

        List<Map<String, Object>> contentsList = new ArrayList<>();
        for (ChatMesaj msg : kronolojikMesajlar) {
            String role = msg.getRol();
            if (!role.equals("user") && !role.equals("model"))
                role = role.equals("assistant") ? "model" : "user";
            contentsList.add(Map.of("role", role, "parts", List.of(Map.of("text", msg.getIcerik()))));
        }
        if (contentsList.isEmpty()) {
            contentsList.add(Map.of("role", "user", "parts", List.of(Map.of("text", "Merhaba"))));
        }
        body.put("contents", contentsList);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
            Map<String, Object> responseBody = response.getBody();
            if (responseBody == null) return "Yanıt alınamadı.";

            List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");
            if (candidates == null || candidates.isEmpty()) return "Yanıt yok.";

            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            if (content == null) return "İçerik yok.";

            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            if (parts == null || parts.isEmpty()) return "Parts yok.";

            StringBuilder sb = new StringBuilder();
            for (Map<String, Object> part : parts) {
                Object txt = part.get("text");
                if (txt != null) sb.append(txt);
            }
            return sb.toString();

        } catch (Exception e) {
            log.error("[AI] API hatası: {}", e.getMessage());
            return "Şu anda yanıt alınamıyor. Lütfen tekrar deneyin.";
        }
    }
}
