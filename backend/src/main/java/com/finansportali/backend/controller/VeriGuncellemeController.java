package com.finansportali.backend.controller;

import com.finansportali.backend.integration.*;
import com.finansportali.backend.scheduler.DataScheduler;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

/**
 * Veri güncelleme admin endpoint'leri. Manuel tetikleme için kullanılır.
 */
@RestController
@RequestMapping("/api/v1/veri-guncelleme")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Veri Güncelleme", description = "TCMB, kripto, hisse ve haber verilerini manuel güncelle")
public class VeriGuncellemeController {

    private final TcmbDovizService tcmbDovizService;
    private final CoinGeckoService coinGeckoService;
    private final CollectApiHisseService collectApiHisseService;
    private final CollectApiHaberService collectApiHaberService;
    private final YahooFinanceService yahooFinanceService;
    private final RssHaberService rssHaberService;
    private final DataScheduler dataScheduler;

    @PostMapping("/tcmb")
    public ResponseEntity<Map<String,Object>> tcmb() {
        var s = tcmbDovizService.kurlariGuncelle();
        return ResponseEntity.ok(Map.of("mesaj","TCMB guncellendi","sayi",s.size()));
    }

    @PostMapping("/kripto")
    public ResponseEntity<Map<String,Object>> kripto() {
        var s = coinGeckoService.kriptoGuncelle();
        return ResponseEntity.ok(Map.of("mesaj","Kripto guncellendi","sayi",s.size()));
    }

    /** Yahoo Finance ile BIST hisseleri - ucretsiz, key gerektirmez */
    @PostMapping("/hisse")
    public ResponseEntity<Map<String,Object>> hisse() {
        var s = yahooFinanceService.hisseleriGuncelle();
        return ResponseEntity.ok(Map.of("mesaj","Yahoo Finance hisse guncellendi","sayi",s.size()));
    }

    /** CollectAPI hisse (yedek) */
    @PostMapping("/hisse-collect")
    public ResponseEntity<Map<String,Object>> hisseCollect() {
        var s = collectApiHisseService.hisseGuncelle();
        return ResponseEntity.ok(Map.of("mesaj","CollectAPI hisse guncellendi","sayi",s.size()));
    }

    /** RSS ile haberler */
    @PostMapping("/haberler")
    public ResponseEntity<Map<String,Object>> haberler() {
        var s = rssHaberService.haberleriGuncelle();
        return ResponseEntity.ok(Map.of("mesaj","RSS haberler guncellendi","sayi",s.size()));
    }

    /** CollectAPI haberler (yedek) */
    @PostMapping("/haberler-collect")
    public ResponseEntity<Map<String,Object>> haberlerCollect() {
        var s = collectApiHaberService.haberleriGuncelle();
        return ResponseEntity.ok(Map.of("mesaj","CollectAPI haberler guncellendi","sayi",s.size()));
    }

    /** AI analiz tetikle — mevcut haberleri portföylerle karşılaştır */
    @PostMapping("/analiz-tetikle")
    public ResponseEntity<Map<String,Object>> analizTetikle() {
        dataScheduler.analizTetikle();
        return ResponseEntity.ok(Map.of("mesaj", "AI haber analizi tetiklendi (arka planda çalışıyor)"));
    }

    /** Tum verileri guncelle */
    @PostMapping("/tumu")
    public ResponseEntity<Map<String,Object>> tumu() {
        var doviz   = tcmbDovizService.kurlariGuncelle();
        var kripto  = coinGeckoService.kriptoGuncelle();
        var hisse   = yahooFinanceService.hisseleriGuncelle();
        var haberler = rssHaberService.haberleriGuncelle();
        return ResponseEntity.ok(Map.of(
            "mesaj", "Tum veriler guncellendi",
            "doviz",  doviz.size(),
            "kripto", kripto.size(),
            "hisse",  hisse.size(),
            "haberler", haberler.size()
        ));
    }
}
