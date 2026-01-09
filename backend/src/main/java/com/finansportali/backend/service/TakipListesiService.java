package com.finansportali.backend.service;
import com.finansportali.backend.dto.TakipListesiDto;
import com.finansportali.backend.entity.*;
import com.finansportali.backend.exception.*;
import com.finansportali.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;
@Service @RequiredArgsConstructor
public class TakipListesiService {
    private final TakipListesiRepository repository;
    private final KullaniciRepository kullaniciRepository;
    private final YatirimAraciService araciService;
    private final PiyasaVerisiService piyasaVerisiService;
    public List<TakipListesiDto.Response> kullanicininListesi(Long kullaniciId) {
        return repository.findByKullaniciId(kullaniciId).stream().map(this::toResponse).collect(Collectors.toList());
    }
    public TakipListesiDto.Response ekle(Long kullaniciId, TakipListesiDto.Request req) {
        if (repository.existsByKullaniciIdAndYatirimAraciId(kullaniciId, req.getYatirimAraciId()))
            throw new DuplicateResourceException("TakipListesi","araciId",req.getYatirimAraciId());
        Kullanici k = kullaniciRepository.findById(kullaniciId).orElseThrow(() -> new ResourceNotFoundException("Kullanici","id",kullaniciId));
        YatirimAraci a = araciService.findEntityById(req.getYatirimAraciId());
        TakipListesi t = new TakipListesi(); t.setKullanici(k); t.setYatirimAraci(a);
        return toResponse(repository.save(t));
    }
    public void sil(Long kullaniciId, Long araciId) {
        TakipListesi t = repository.findByKullaniciIdAndYatirimAraciId(kullaniciId,araciId)
            .orElseThrow(() -> new ResourceNotFoundException("TakipListesi","araciId",araciId));
        repository.delete(t);
    }
    private TakipListesiDto.Response toResponse(TakipListesi t) {
        return new TakipListesiDto.Response(t.getId(), t.getYatirimAraci().getId(),
            t.getYatirimAraci().getSembol(), t.getYatirimAraci().getAd(), t.getYatirimAraci().getTip(),
            piyasaVerisiService.getGuncelFiyat(t.getYatirimAraci().getId()), null, t.getEklemeTarihi());
    }
}
