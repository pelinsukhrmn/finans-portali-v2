package com.finansportali.backend.controller;

import com.finansportali.backend.dto.ChatMesajDTO;
import com.finansportali.backend.dto.ChatSessionDTO;
import com.finansportali.backend.service.AiTavsiyeService;
import com.finansportali.backend.service.HaberAnalizService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "AI Tavsiye", description = "Gemini AI tabanlı yatırım danışmanı")
public class AiTavsiyeController {

    private final AiTavsiyeService aiTavsiyeService;
    private final HaberAnalizService haberAnalizService;

    @Operation(summary = "Kullanıcının chat oturumlarını listele")
    @GetMapping("/sessions/{kullaniciId}")
    public ResponseEntity<List<ChatSessionDTO>> oturumlariGetir(@PathVariable Long kullaniciId) {
        return ResponseEntity.ok(aiTavsiyeService.kullanicininOturumlari(kullaniciId));
    }

    @Operation(summary = "Yeni chat oturumu oluştur")
    @PostMapping("/sessions/{kullaniciId}")
    public ResponseEntity<ChatSessionDTO> yeniOturumOlustur(
            @PathVariable Long kullaniciId,
            @RequestBody(required = false) Map<String, String> body) {
        String baslik = body != null ? body.getOrDefault("baslik", "Yeni Sohbet") : "Yeni Sohbet";
        return ResponseEntity.ok(aiTavsiyeService.yeniOturumOlustur(kullaniciId, baslik));
    }

    @Operation(summary = "Oturumun geçmiş mesajlarını getir")
    @GetMapping("/sessions/{seansId}/mesajlar")
    public ResponseEntity<List<ChatMesajDTO>> mesajlariGetir(@PathVariable Long seansId) {
        return ResponseEntity.ok(aiTavsiyeService.gecmisMesajlariGetir(seansId));
    }

    @Operation(summary = "AI portföy sağlık skoru ve insight")
    @GetMapping("/portfolio-insight/{kullaniciId}")
    public ResponseEntity<Map<String, Object>> portfolioInsight(@PathVariable Long kullaniciId) {
        return ResponseEntity.ok(aiTavsiyeService.portfolioInsight(kullaniciId));
    }

    @Operation(summary = "Günlük piyasa brifing")
    @PostMapping("/market-briefing")
    public ResponseEntity<Map<String, String>> marketBriefing(@RequestBody Map<String, String> body) {
        String prompt = body.getOrDefault("prompt", "");
        return ResponseEntity.ok(Map.of("cevap", aiTavsiyeService.marketBriefing(prompt)));
    }

    @Operation(summary = "Haber AI özeti")
    @PostMapping("/haber-ozeti")
    public ResponseEntity<Map<String, String>> haberOzeti(@RequestBody Map<String, String> body) {
        String baslik = body.getOrDefault("baslik", "");
        String icerik = body.getOrDefault("icerik", "");
        return ResponseEntity.ok(Map.of("ozet", haberAnalizService.haberOzetiOlustur(baslik, icerik)));
    }

    @Operation(summary = "AI'ya soru sor (chat session tabanlı)")
    @PostMapping("/tavsiye")
    public ResponseEntity<Map<String, Object>> tavsiyeAl(@RequestBody TavsiyeIstek istek) {
        AiTavsiyeService.TavsiyeSonuc sonuc = aiTavsiyeService.tavsiyeAl(
                istek.seansId(), istek.soru(), istek.portfoyOzeti());
        return ResponseEntity.ok(Map.of(
                "cevap", sonuc.cevap(),
                "grafikData", sonuc.grafikData() != null ? sonuc.grafikData() : Map.of(),
                "anomalies", sonuc.anomalies() != null ? sonuc.anomalies() : List.of(),
                "secenekler", sonuc.secenekler() != null ? sonuc.secenekler() : List.of()));
    }

    public record TavsiyeIstek(Long seansId, String soru, PortfoyOzeti portfoyOzeti) {}

    public record PortfoyOzeti(
            String ad,
            double toplamDeger,
            double toplamMaliyet,
            double nominalGetiriYuzde,
            List<VarlikOzeti> varliklar) {}

    public record VarlikOzeti(
            String sembol,
            String enstrumanAdi,
            double agirlik,
            double nominalKarZarar) {}
}
