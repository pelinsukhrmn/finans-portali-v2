package com.finansportali.backend.service;
import com.finansportali.backend.dto.FiyatAlarmiDto;
import com.finansportali.backend.entity.*;
import com.finansportali.backend.exception.ResourceNotFoundException;
import com.finansportali.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;
@Service @RequiredArgsConstructor
public class FiyatAlarmiService {
    private final FiyatAlarmiRepository repository;
    private final KullaniciRepository kullaniciRepository;
    private final YatirimAraciService araciService;
    private final PiyasaVerisiService piyasaVerisiService;
    public List<FiyatAlarmiDto.Response> kullanicininAlarmlari(Long kullaniciId) {
        return repository.findByKullaniciId(kullaniciId).stream().map(this::toResponse).collect(Collectors.toList());
    }
    public FiyatAlarmiDto.Response olustur(Long kullaniciId, FiyatAlarmiDto.Request req) {
        Kullanici k = kullaniciRepository.findById(kullaniciId).orElseThrow(() -> new ResourceNotFoundException("Kullanici","id",kullaniciId));
        YatirimAraci a = araciService.findEntityById(req.getYatirimAraciId());
        FiyatAlarmi e = new FiyatAlarmi();
        e.setKullanici(k); e.setYatirimAraci(a); e.setHedefFiyat(req.getHedefFiyat()); e.setYon(req.getYon());
        return toResponse(repository.save(e));
    }
    public void iptalEt(Long id) {
        FiyatAlarmi e = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("FiyatAlarmi","id",id));
        e.setAktifMi(false); repository.save(e);
    }
    public void sil(Long id) { repository.deleteById(id); }
    private FiyatAlarmiDto.Response toResponse(FiyatAlarmi e) {
        return new FiyatAlarmiDto.Response(e.getId(), e.getYatirimAraci().getId(),
            e.getYatirimAraci().getSembol(), e.getYatirimAraci().getAd(), e.getHedefFiyat(),
            piyasaVerisiService.getGuncelFiyat(e.getYatirimAraci().getId()),
            e.getYon(), e.getAktifMi(), e.getTetiklendiMi(), e.getOlusturmaTarihi());
    }
}
