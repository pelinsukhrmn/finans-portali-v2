package com.finansportali.backend.service;

import com.finansportali.backend.dto.PiyasaVerisiDto;
import com.finansportali.backend.entity.*;
import com.finansportali.backend.exception.ResourceNotFoundException;
import com.finansportali.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Piyasa verisi iş mantığı.
 *
 * <p>Anlık fiyat sorgulama, tarihsel veri getirme ve değişim yüzdesi hesaplama
 * işlemlerini yönetir. Fiyat verileri dış servislerden (TCMB, CollectAPI, CoinGecko)
 * {@link com.finansportali.backend.scheduler.DataScheduler} aracılığıyla periyodik
 * olarak güncellenir ve PostgreSQL'de saklanır.</p>
 */
@Service
@RequiredArgsConstructor
public class PiyasaVerisiService {

    private final PiyasaVerisiRepository repository;
    private final YatirimAraciRepository araciRepository;

    /**
     * Her enstrüman için en güncel fiyat kaydını tek sorguda döner.
     * Dashboard ve piyasa özeti bileşenleri tarafından kullanılır.
     *
     * @return tüm aktif enstrümanların son fiyat listesi
     */
    public List<PiyasaVerisiDto.Response> tumGuncelVeriler() {
        return repository.findLatestForAllAraclar().stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    /**
     * Belirtilen enstrümanın en son fiyat kaydını döner.
     *
     * @param araciId yatırım aracı ID'si
     * @return son fiyat verisi DTO'su
     * @throws ResourceNotFoundException hiç fiyat kaydı yoksa
     */
    public PiyasaVerisiDto.Response sonFiyatGetir(Long araciId) {
        return toResponse(repository.findTopByYatirimAraciIdOrderByVeriZamaniDesc(araciId)
                .orElseThrow(() -> new ResourceNotFoundException("PiyasaVerisi", "araciId", araciId)));
    }

    /**
     * Belirtilen tarih aralığındaki tüm fiyat kayıtlarını kronolojik sırayla döner.
     * Grafik ve teknik analiz hesaplamaları için kullanılır.
     *
     * @param araciId yatırım aracı ID'si
     * @param bas     başlangıç zamanı (dahil)
     * @param bit     bitiş zamanı (dahil)
     * @return sıralı tarihsel fiyat listesi
     */
    public List<PiyasaVerisiDto.Response> tarihselVeriGetir(Long araciId, LocalDateTime bas, LocalDateTime bit) {
        return repository.findByYatirimAraciIdAndVeriZamaniBetweenOrderByVeriZamaniAsc(araciId, bas, bit)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /**
     * Belirtilen enstrümanın fiyat geçmişini sayfalı ve sıralı döner.
     *
     * @param araciId  yatırım aracı ID'si
     * @param pageable sayfalama ve sıralama bilgisi
     * @return sayfalı fiyat verisi
     */
    public Page<PiyasaVerisiDto.Response> sayfaliListele(Long araciId, Pageable pageable) {
        return repository.findByYatirimAraciIdOrderByVeriZamaniDesc(araciId, pageable)
                .map(this::toResponse);
    }

    /**
     * Tek fiyat kaydı ekler. Açılış fiyatı verilmemişse zaman damgası olarak
     * şu anki UTC zamanı kullanılır.
     *
     * @param req enstrüman ID, fiyat, hacim, en yüksek/düşük ve açılış bilgisi
     * @return oluşturulan fiyat kaydı DTO'su
     * @throws ResourceNotFoundException geçersiz {@code yatirimAraciId} ise
     */
    public PiyasaVerisiDto.Response ekle(PiyasaVerisiDto.Request req) {
        YatirimAraci araci = araciRepository.findById(req.getYatirimAraciId())
                .orElseThrow(() -> new ResourceNotFoundException("YatirimAraci", "id", req.getYatirimAraciId()));
        PiyasaVerisi e = new PiyasaVerisi();
        e.setYatirimAraci(araci);
        e.setFiyat(req.getFiyat());
        e.setHacim(req.getHacim());
        e.setEnYuksek(req.getEnYuksek());
        e.setEnDusuk(req.getEnDusuk());
        e.setAcilis(req.getAcilis());
        e.setVeriZamani(req.getVeriZamani() != null ? req.getVeriZamani() : LocalDateTime.now());
        return toResponse(repository.save(e));
    }

    /**
     * Birden fazla fiyat kaydını tek işlemde kaydeder.
     * Scheduler'ın toplu veri yazma işlemleri için kullanılır.
     *
     * @param reqs fiyat verisi istek listesi
     * @return oluşturulan kayıtların DTO listesi
     */
    public List<PiyasaVerisiDto.Response> topluEkle(List<PiyasaVerisiDto.Request> reqs) {
        return reqs.stream().map(this::ekle).collect(Collectors.toList());
    }

    /**
     * Portföy hesaplamalarında kullanmak üzere bir enstrümanın anlık fiyatını döner.
     * Fiyat verisi yoksa {@link BigDecimal#ZERO} döner.
     *
     * @param araciId yatırım aracı ID'si
     * @return anlık fiyat; bulunamazsa sıfır
     */
    public BigDecimal getGuncelFiyat(Long araciId) {
        return repository.findTopByYatirimAraciIdOrderByVeriZamaniDesc(araciId)
                .map(PiyasaVerisi::getFiyat).orElse(BigDecimal.ZERO);
    }

    /**
     * Açılış fiyatına göre günlük değişim yüzdesini hesaplar.
     * Açılış fiyatı sıfır veya kayıt yoksa {@code null} döner.
     *
     * @param araciId yatırım aracı ID'si
     * @return değişim yüzdesi (örn. 2.35 → %2.35) veya null
     */
    public BigDecimal getGunlukDegisimYuzde(Long araciId) {
        return repository.findTopByYatirimAraciIdOrderByVeriZamaniDesc(araciId)
                .filter(p -> p.getAcilis() != null && p.getAcilis().compareTo(BigDecimal.ZERO) > 0)
                .map(p -> p.getFiyat().subtract(p.getAcilis())
                        .multiply(BigDecimal.valueOf(100))
                        .divide(p.getAcilis(), 2, RoundingMode.HALF_UP))
                .orElse(null);
    }

    /**
     * Günlük değişim yüzdesine göre en çok yükselen HISSE enstrümanlarını döner.
     *
     * @param limit maksimum sonuç sayısı
     * @return azalan sıralı yükselen listesi
     */
    public List<PiyasaVerisiDto.Response> enCokYukselen(int limit) {
        return repository.findLatestByTip(EnstrumanTipi.HISSE).stream()
                .map(this::toResponse)
                .filter(r -> r.getDegisimYuzde() != null)
                .sorted((a, b) -> b.getDegisimYuzde().compareTo(a.getDegisimYuzde()))
                .limit(limit)
                .collect(Collectors.toList());
    }

    /**
     * Günlük değişim yüzdesine göre en çok düşen HISSE enstrümanlarını döner.
     *
     * @param limit maksimum sonuç sayısı
     * @return artan sıralı düşen listesi
     */
    public List<PiyasaVerisiDto.Response> enCokDusen(int limit) {
        return repository.findLatestByTip(EnstrumanTipi.HISSE).stream()
                .map(this::toResponse)
                .filter(r -> r.getDegisimYuzde() != null)
                .sorted(Comparator.comparing(PiyasaVerisiDto.Response::getDegisimYuzde))
                .limit(limit)
                .collect(Collectors.toList());
    }

    /**
     * JPA entity'yi API yanıt DTO'suna dönüştürür.
     * Açılış fiyatı mevcutsa değişim ve değişim yüzdesi hesaplanır.
     *
     * @param e kaynak fiyat verisi entity'si
     * @return doldurulmuş DTO
     */
    private PiyasaVerisiDto.Response toResponse(PiyasaVerisi e) {
        BigDecimal degisim = null;
        BigDecimal degisimYuzde = null;

        if (e.getAcilis() != null && e.getAcilis().compareTo(BigDecimal.ZERO) > 0) {
            degisim = e.getFiyat().subtract(e.getAcilis());
            degisimYuzde = degisim
                    .multiply(BigDecimal.valueOf(100))
                    .divide(e.getAcilis(), 2, RoundingMode.HALF_UP);
        }

        return new PiyasaVerisiDto.Response(
                e.getId(),
                e.getYatirimAraci().getId(),
                e.getYatirimAraci().getSembol(),
                e.getYatirimAraci().getAd(),
                e.getFiyat(),
                e.getHacim(),
                e.getEnYuksek(),
                e.getEnDusuk(),
                e.getAcilis(),
                degisim,
                degisimYuzde,
                e.getVeriZamani()
        );
    }
}
