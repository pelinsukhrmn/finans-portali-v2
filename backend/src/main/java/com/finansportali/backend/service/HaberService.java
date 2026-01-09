package com.finansportali.backend.service;
import com.finansportali.backend.dto.HaberDto;
import com.finansportali.backend.entity.Haber;
import com.finansportali.backend.exception.ResourceNotFoundException;
import com.finansportali.backend.repository.HaberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;
@Service @RequiredArgsConstructor
public class HaberService {
    private final HaberRepository repository;
    public Page<HaberDto.Response> tumHaberler(Pageable pageable) {
        return repository.findAll(pageable).map(this::toResponse);
    }
    public List<HaberDto.Response> sonHaberler() {
        return repository.findTop50ByOrderByYayinTarihiDesc().stream().map(this::toResponse).collect(Collectors.toList());
    }
    public HaberDto.Response detayGetir(Long id) {
        return toResponse(repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Haber","id",id)));
    }
    public Page<HaberDto.Response> kategoriIleGetir(String kategori, Pageable pageable) {
        return repository.findByKategoriOrderByYayinTarihiDesc(kategori,pageable).map(this::toResponse);
    }
    public List<HaberDto.Response> aramaYap(String q) {
        return repository.findByBaslikContainingIgnoreCase(q).stream().map(this::toResponse).collect(Collectors.toList());
    }
    public HaberDto.Response ekle(HaberDto.Request req) {
        Haber e = new Haber();
        e.setBaslik(req.getBaslik()); e.setIcerik(req.getIcerik()); e.setKaynak(req.getKaynak());
        e.setUrl(req.getUrl()); e.setKategori(req.getKategori()); e.setYayinTarihi(req.getYayinTarihi());
        return toResponse(repository.save(e));
    }
    public void sil(Long id) { repository.deleteById(id); }
    private HaberDto.Response toResponse(Haber e) {
        return new HaberDto.Response(e.getId(),e.getBaslik(),e.getIcerik(),e.getKaynak(),e.getUrl(),e.getKategori(),e.getYayinTarihi());
    }
}
