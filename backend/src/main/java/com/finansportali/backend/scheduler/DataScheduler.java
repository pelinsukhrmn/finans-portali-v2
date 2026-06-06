package com.finansportali.backend.scheduler;
import com.finansportali.backend.entity.Haber;
import com.finansportali.backend.integration.*;
import com.finansportali.backend.repository.HaberRepository;
import com.finansportali.backend.service.HaberAnalizService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.util.List;

@Component @EnableScheduling @RequiredArgsConstructor @Slf4j
public class DataScheduler {
    private final TcmbDovizService tcmbDovizService;
    private final CoinGeckoService coinGeckoService;
    private final CollectApiHisseService collectApiHisseService;
    private final CollectApiHaberService collectApiHaberService;
    private final YahooFinanceService yahooFinanceService;
    private final RssHaberService rssHaberService;
    private final HaberAnalizService haberAnalizService;
    private final HaberRepository haberRepository;

    @Scheduled(cron = "${finans.scheduler.tcmb-cron:0 31 15 * * MON-FRI}")
    @CacheEvict(value = "piyasaVerileri", allEntries = true)
    public void tcmbGuncelle() { try { var s = tcmbDovizService.kurlariGuncelle(); log.info("[SCHEDULER] TCMB: {} kur", s.size()); } catch (Exception e) { log.error("[SCHEDULER] TCMB hata: {}", e.getMessage()); } }

    @Scheduled(cron = "${finans.scheduler.kripto-cron:0 0 */2 * * *}")
    @CacheEvict(value = "piyasaVerileri", allEntries = true)
    public void kriptoGuncelle() { try { var s = coinGeckoService.kriptoGuncelle(); log.info("[SCHEDULER] Kripto: {} kayit", s.size()); } catch (Exception e) { log.error("[SCHEDULER] Kripto hata: {}", e.getMessage()); } }

    @Scheduled(cron = "${finans.scheduler.hisse-cron:0 0 */3 * * MON-FRI}")
    @CacheEvict(value = "piyasaVerileri", allEntries = true)
    public void hisseGuncelle() {
        try {
            var s = yahooFinanceService.hisseleriGuncelle();
            log.info("[SCHEDULER] Yahoo hisse: {} kayit", s.size());
            if (s.isEmpty()) throw new RuntimeException("Yahoo bos liste dondu");
        } catch (Exception e) {
            log.warn("[SCHEDULER] Yahoo hata, CollectAPI deneniyor: {}", e.getMessage());
            try { var s = collectApiHisseService.hisseGuncelle(); log.info("[SCHEDULER] CollectAPI hisse: {} kayit", s.size()); }
            catch (Exception e2) { log.error("[SCHEDULER] Hisse hata: {}", e2.getMessage()); }
        }
    }

    @Scheduled(cron = "${finans.scheduler.haber-cron:0 */30 * * * *}")
    @CacheEvict(value = "haberler", allEntries = true)
    public void haberleriGuncelle() {
        try {
            List<Haber> yeniHaberler = rssHaberService.haberleriGuncelle();
            log.info("[SCHEDULER] RSS haberler: {} yeni kayit", yeniHaberler.size());
        } catch (Exception e) {
            try { collectApiHaberService.haberleriGuncelle(); }
            catch (Exception e2) { log.error("[SCHEDULER] Haber hata: {}", e2.getMessage()); }
        }
        // Always analyze recent news for any user who hasn't been notified yet.
        // HaberAnalizService skips already-notified (haberId, kullaniciId) pairs.
        List<Haber> sonHaberler = haberRepository.findTop50ByOrderByYayinTarihiDesc();
        if (!sonHaberler.isEmpty()) {
            log.info("[SCHEDULER] AI analiz tetikleniyor: {} haber", sonHaberler.size());
            haberAnalizService.analizEt(sonHaberler);
        }
    }

    /** Manual trigger — called from VeriGuncellemeController */
    public void analizTetikle() {
        List<Haber> sonHaberler = haberRepository.findTop50ByOrderByYayinTarihiDesc();
        log.info("[SCHEDULER] Manuel AI analiz: {} haber", sonHaberler.size());
        haberAnalizService.analizEt(sonHaberler);
    }

    @Scheduled(initialDelay = 60_000, fixedDelay = Long.MAX_VALUE)
    public void ilkYukleme() {
        log.info("[SCHEDULER] Ilk yukleme basliyor...");
        try {
            tcmbGuncelle();
            Thread.sleep(2000);
            kriptoGuncelle();
            Thread.sleep(2000);
            // Yahoo dene, bos gelirse direkt CollectAPI kullan
            try {
                var s = yahooFinanceService.hisseleriGuncelle();
                log.info("[SCHEDULER] Yahoo hisse: {} kayit", s.size());
                if (s.isEmpty()) throw new RuntimeException("Yahoo bos liste dondu");
            } catch (Exception e) {
                log.warn("[SCHEDULER] Yahoo hata, CollectAPI ile devam: {}", e.getMessage());
                var s = collectApiHisseService.hisseGuncelle();
                log.info("[SCHEDULER] CollectAPI hisse: {} kayit", s.size());
            }
            Thread.sleep(2000);
            haberleriGuncelle();
            log.info("[SCHEDULER] Ilk yukleme tamamlandi.");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } catch (Exception e) {
            log.error("[SCHEDULER] Ilk yukleme hata: {}", e.getMessage());
        }
    }
}
