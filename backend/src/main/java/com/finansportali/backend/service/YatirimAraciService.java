package com.finansportali.backend.service;

import com.finansportali.backend.dto.YatirimAraciDto;
import com.finansportali.backend.entity.*;
import com.finansportali.backend.exception.*;
import com.finansportali.backend.repository.YatirimAraciRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Yatırım aracı CRUD iş mantığı.
 *
 * <p>Sembol benzersizliği zorunludur; aynı sembolle ikinci bir kayıt oluşturulmaya
 * çalışıldığında {@link DuplicateResourceException} fırlatılır.
 * Desteklenen enstrüman tipleri: HISSE, DOVIZ, KRIPTO, FON, TAHVIL_BONO, VIOP.</p>
 */
@Service
@RequiredArgsConstructor
public class YatirimAraciService {

    private final YatirimAraciRepository repository;

    /**
     * Veritabanındaki tüm aktif ve pasif yatırım araçlarını döner.
     *
     * @return tüm enstrümanların DTO listesi
     */
    public List<YatirimAraciDto.Response> tumunuGetir() {
        return repository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    /**
     * Belirtilen enstrüman tipine ait yatırım araçlarını döner.
     *
     * @param tip enstrüman tipi (HISSE, DOVIZ, KRIPTO, FON, TAHVIL_BONO, VIOP)
     * @return filtrelenmiş enstrüman listesi
     */
    public List<YatirimAraciDto.Response> tipeGoreGetir(EnstrumanTipi tip) {
        return repository.findByTip(tip).stream().map(this::toResponse).collect(Collectors.toList());
    }

    /**
     * Birincil anahtar ile tek enstrüman döner.
     *
     * @param id yatırım aracı ID'si
     * @return bulunan enstrüman DTO'su
     * @throws ResourceNotFoundException kayıt bulunamazsa
     */
    public YatirimAraciDto.Response idIleGetir(Long id) {
        return toResponse(findEntityById(id));
    }

    /**
     * Borsa sembolü ile tek enstrüman döner (büyük/küçük harf duyarlı).
     *
     * @param sembol örn. "THYAO", "BTC/TRY"
     * @return eşleşen enstrüman DTO'su
     * @throws ResourceNotFoundException sembol kayıtlı değilse
     */
    public YatirimAraciDto.Response sembolIleGetir(String sembol) {
        return toResponse(repository.findBySembol(sembol)
                .orElseThrow(() -> new ResourceNotFoundException("YatirimAraci", "sembol", sembol)));
    }

    /**
     * Sembol veya ad alanında büyük/küçük harf duyarsız arama yapar.
     *
     * @param q arama terimi
     * @return eşleşen enstrüman listesi
     */
    public List<YatirimAraciDto.Response> aramaYap(String q) {
        return repository.findBySembolContainingIgnoreCaseOrAdContainingIgnoreCase(q, q)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /**
     * Yeni yatırım aracı oluşturur ve kaydeder.
     *
     * @param req sembol, ad, tip ve aktiflik bilgisi
     * @return oluşturulan enstrüman DTO'su
     * @throws DuplicateResourceException aynı sembol zaten mevcutsa
     */
    public YatirimAraciDto.Response ekle(YatirimAraciDto.Request req) {
        if (repository.existsBySembol(req.getSembol())) {
            throw new DuplicateResourceException("YatirimAraci", "sembol", req.getSembol());
        }
        YatirimAraci e = new YatirimAraci();
        e.setSembol(req.getSembol());
        e.setAd(req.getAd());
        e.setTip(req.getTip());
        e.setAktifMi(req.getAktifMi() != null ? req.getAktifMi() : true);
        return toResponse(repository.save(e));
    }

    /**
     * Mevcut enstrümanın ad, tip veya aktiflik alanlarını günceller.
     * Sembol değiştirilmez (birincil kimlik olarak kabul edilir).
     *
     * @param id  güncellenecek kayıt ID'si
     * @param req güncel değerler
     * @return güncellenmiş enstrüman DTO'su
     */
    public YatirimAraciDto.Response guncelle(Long id, YatirimAraciDto.Request req) {
        YatirimAraci e = findEntityById(id);
        e.setAd(req.getAd());
        e.setTip(req.getTip());
        if (req.getAktifMi() != null) e.setAktifMi(req.getAktifMi());
        return toResponse(repository.save(e));
    }

    /**
     * Enstrümanı veritabanından kalıcı olarak siler.
     *
     * @param id silinecek kayıt ID'si
     * @throws ResourceNotFoundException kayıt bulunamazsa
     */
    public void sil(Long id) {
        repository.delete(findEntityById(id));
    }

    /**
     * ID ile entity döner; bulunamazsa exception fırlatır.
     * Controller katmanından da çağrılabilir.
     *
     * @param id yatırım aracı ID'si
     * @return JPA entity nesnesi
     * @throws ResourceNotFoundException kayıt bulunamazsa
     */
    public YatirimAraci findEntityById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("YatirimAraci", "id", id));
    }

    /**
     * JPA entity'yi API yanıt DTO'suna dönüştürür.
     *
     * @param e kaynak entity
     * @return doldurulmuş DTO
     */
    private YatirimAraciDto.Response toResponse(YatirimAraci e) {
        return new YatirimAraciDto.Response(
                e.getId(), e.getSembol(), e.getAd(), e.getTip(),
                e.getAktifMi(), e.getGuncellemeTarihi());
    }
}
