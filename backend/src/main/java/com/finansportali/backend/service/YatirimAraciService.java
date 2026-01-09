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
 * Sembol benzersizliği zorunludur; duplicate girişimlerinde {@link com.finansportali.backend.exception.DuplicateResourceException} fırlatılır.
 */
@Service @RequiredArgsConstructor
public class YatirimAraciService {
    private final YatirimAraciRepository repository;
    public List<YatirimAraciDto.Response> tumunuGetir() {
        return repository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }
    public List<YatirimAraciDto.Response> tipeGoreGetir(EnstrumanTipi tip) {
        return repository.findByTip(tip).stream().map(this::toResponse).collect(Collectors.toList());
    }
    public YatirimAraciDto.Response idIleGetir(Long id) {
        return toResponse(findEntityById(id));
    }
    public YatirimAraciDto.Response sembolIleGetir(String sembol) {
        return toResponse(repository.findBySembol(sembol).orElseThrow(() -> new ResourceNotFoundException("YatirimAraci","sembol",sembol)));
    }
    public List<YatirimAraciDto.Response> aramaYap(String q) {
        return repository.findBySembolContainingIgnoreCaseOrAdContainingIgnoreCase(q,q).stream().map(this::toResponse).collect(Collectors.toList());
    }
    public YatirimAraciDto.Response ekle(YatirimAraciDto.Request req) {
        if (repository.existsBySembol(req.getSembol())) throw new DuplicateResourceException("YatirimAraci","sembol",req.getSembol());
        YatirimAraci e = new YatirimAraci();
        e.setSembol(req.getSembol()); e.setAd(req.getAd()); e.setTip(req.getTip()); e.setAktifMi(req.getAktifMi() != null ? req.getAktifMi() : true);
        return toResponse(repository.save(e));
    }
    public YatirimAraciDto.Response guncelle(Long id, YatirimAraciDto.Request req) {
        YatirimAraci e = findEntityById(id);
        e.setAd(req.getAd()); e.setTip(req.getTip()); if(req.getAktifMi()!=null) e.setAktifMi(req.getAktifMi());
        return toResponse(repository.save(e));
    }
    public void sil(Long id) { repository.delete(findEntityById(id)); }
    public YatirimAraci findEntityById(Long id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("YatirimAraci","id",id));
    }
    private YatirimAraciDto.Response toResponse(YatirimAraci e) {
        return new YatirimAraciDto.Response(e.getId(),e.getSembol(),e.getAd(),e.getTip(),e.getAktifMi(),e.getGuncellemeTarihi());
    }
}
