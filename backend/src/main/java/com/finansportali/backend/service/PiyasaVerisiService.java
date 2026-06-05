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
 * <p>
 * Anlık fiyat sorgulama, tarihsel veri getirme ve değişim yüzdesi hesaplama
 * işlemlerini yönetir. Fiyat verileri dış servislerden (TCMB, Yahoo Finance,
 * CoinGecko) {@code DataScheduler} aracılığıyla periyodik olarak güncellenir.
 */
@Service @RequiredArgsConstructor
public class PiyasaVerisiService {

    private final PiyasaVerisiRepository repository;
    private final YatirimAraciRepository araciRepository;

    public List<PiyasaVerisiDto.Response> tumGuncelVeriler() {
        return repository.findLatestForAllAraclar().stream()
            .map(this::toResponse).collect(Collectors.toList());
    }

    public PiyasaVerisiDto.Response sonFiyatGetir(Long araciId) {
        return toResponse(repository.findTopByYatirimAraciIdOrderByVeriZamaniDesc(araciId)
            .orElseThrow(() -> new ResourceNotFoundException("PiyasaVerisi","araciId",araciId)));
    }

    public List<PiyasaVerisiDto.Response> tarihselVeriGetir(Long araciId, LocalDateTime bas, LocalDateTime bit) {
        return repository.findByYatirimAraciIdAndVeriZamaniBetweenOrderByVeriZamaniAsc(araciId, bas, bit)
            .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public Page<PiyasaVerisiDto.Response> sayfaliListele(Long araciId, Pageable pageable) {
        return repository.findByYatirimAraciIdOrderByVeriZamaniDesc(araciId, pageable)
            .map(this::toResponse);
    }

    public PiyasaVerisiDto.Response ekle(PiyasaVerisiDto.Request req) {
        YatirimAraci araci = araciRepository.findById(req.getYatirimAraciId())
            .orElseThrow(() -> new ResourceNotFoundException("YatirimAraci","id",req.getYatirimAraciId()));
        PiyasaVerisi e = new PiyasaVerisi();
        e.setYatirimAraci(araci); e.setFiyat(req.getFiyat()); e.setHacim(req.getHacim());
        e.setEnYuksek(req.getEnYuksek()); e.setEnDusuk(req.getEnDusuk()); e.setAcilis(req.getAcilis());
        e.setVeriZamani(req.getVeriZamani() != null ? req.getVeriZamani() : LocalDateTime.now());
        return toResponse(repository.save(e));
    }

    public List<PiyasaVerisiDto.Response> topluEkle(List<PiyasaVerisiDto.Request> reqs) {
        return reqs.stream().map(this::ekle).collect(Collectors.toList());
    }

    public BigDecimal getGuncelFiyat(Long araciId) {
        return repository.findTopByYatirimAraciIdOrderByVeriZamaniDesc(araciId)
            .map(PiyasaVerisi::getFiyat).orElse(BigDecimal.ZERO);
    }

    public BigDecimal getGunlukDegisimYuzde(Long araciId) {
        return repository.findTopByYatirimAraciIdOrderByVeriZamaniDesc(araciId)
            .filter(p -> p.getAcilis() != null && p.getAcilis().compareTo(BigDecimal.ZERO) > 0)
            .map(p -> p.getFiyat().subtract(p.getAcilis())
                .multiply(BigDecimal.valueOf(100))
                .divide(p.getAcilis(), 2, RoundingMode.HALF_UP))
            .orElse(null);
    }

    /** En çok yükselen hisseler */
    public List<PiyasaVerisiDto.Response> enCokYukselen(int limit) {
        return repository.findLatestByTip(EnstrumanTipi.HISSE).stream()
            .map(this::toResponse)
            .filter(r -> r.getDegisimYuzde() != null)
            .sorted((a, b) -> b.getDegisimYuzde().compareTo(a.getDegisimYuzde()))
            .limit(limit)
            .collect(Collectors.toList());
    }

    /** En çok düşen hisseler */
    public List<PiyasaVerisiDto.Response> enCokDusen(int limit) {
        return repository.findLatestByTip(EnstrumanTipi.HISSE).stream()
            .map(this::toResponse)
            .filter(r -> r.getDegisimYuzde() != null)
            .sorted(Comparator.comparing(PiyasaVerisiDto.Response::getDegisimYuzde))
            .limit(limit)
            .collect(Collectors.toList());
    }

    private PiyasaVerisiDto.Response toResponse(PiyasaVerisi e) {
        BigDecimal degisim = null;
        BigDecimal degisimYuzde = null;

        // Açılış fiyatı varsa değişimi hesapla
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
