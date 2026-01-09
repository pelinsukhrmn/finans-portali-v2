package com.finansportali.backend.service;
import com.finansportali.backend.dto.PortfoyDto;
import com.finansportali.backend.entity.*;
import com.finansportali.backend.exception.*;
import com.finansportali.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;
/**
 * Portföy ve varlık yönetimi iş mantığı.
 * <p>
 * Portföy değeri ve getirisi, anlık piyasa fiyatları kullanılarak
 * her istek anında hesaplanır. Redis cache ile performans optimize edilebilir.
 */
@Service @RequiredArgsConstructor
public class PortfoyService {
    private final PortfoyRepository portfoyRepository;
    private final PortfoyVarligiRepository varlikRepository;
    private final KullaniciRepository kullaniciRepository;
    private final YatirimAraciService yatirimAraciService;
    private final PiyasaVerisiService piyasaVerisiService;
    public List<PortfoyDto.OzetResponse> kullanicininPortfoyleri(Long kullaniciId) {
        return portfoyRepository.findByKullaniciId(kullaniciId).stream().map(this::toOzetResponse).collect(Collectors.toList());
    }
    public PortfoyDto.DetayResponse portfoyDetay(Long id) { return toDetayResponse(findById(id)); }
    @Transactional
    public PortfoyDto.OzetResponse olustur(Long kullaniciId, PortfoyDto.Request req) {
        Kullanici k = kullaniciRepository.findById(kullaniciId).orElseThrow(() -> new ResourceNotFoundException("Kullanici","id",kullaniciId));
        if (portfoyRepository.existsByKullaniciIdAndAd(kullaniciId, req.getAd())) throw new DuplicateResourceException("Portfoy","ad",req.getAd());
        Portfoy p = new Portfoy(); p.setKullanici(k); p.setAd(req.getAd());
        return toOzetResponse(portfoyRepository.save(p));
    }
    @Transactional
    public PortfoyDto.OzetResponse guncelle(Long id, PortfoyDto.Request req) {
        Portfoy p = findById(id); p.setAd(req.getAd()); return toOzetResponse(portfoyRepository.save(p));
    }
    @Transactional
    public void sil(Long id) { portfoyRepository.delete(findById(id)); }
    @Transactional
    public PortfoyDto.VarlikResponse varlikEkle(Long portfoyId, PortfoyDto.VarlikRequest req) {
        Portfoy p = findById(portfoyId);
        YatirimAraci a = yatirimAraciService.findEntityById(req.getYatirimAraciId());
        if (varlikRepository.existsByPortfoyIdAndYatirimAraciId(portfoyId, req.getYatirimAraciId()))
            throw new DuplicateResourceException("PortfoyVarligi","enstruman",a.getSembol());
        PortfoyVarligi v = new PortfoyVarligi();
        v.setPortfoy(p); v.setYatirimAraci(a); v.setMiktar(req.getMiktar());
        v.setOrtalamaMaliyet(req.getOrtalamaMaliyet()); v.setAlisTarihi(req.getAlisTarihi());
        return toVarlikResponse(varlikRepository.save(v), BigDecimal.ZERO);
    }
    @Transactional
    public PortfoyDto.VarlikResponse varlikGuncelle(Long varlikId, PortfoyDto.VarlikRequest req) {
        PortfoyVarligi v = varlikRepository.findById(varlikId).orElseThrow(() -> new ResourceNotFoundException("PortfoyVarligi","id",varlikId));
        v.setMiktar(req.getMiktar()); v.setOrtalamaMaliyet(req.getOrtalamaMaliyet());
        if (req.getAlisTarihi() != null) v.setAlisTarihi(req.getAlisTarihi());
        return toVarlikResponse(varlikRepository.save(v), BigDecimal.ZERO);
    }
    @Transactional
    public void varlikSil(Long varlikId) {
        varlikRepository.delete(varlikRepository.findById(varlikId).orElseThrow(() -> new ResourceNotFoundException("PortfoyVarligi","id",varlikId)));
    }
    private Portfoy findById(Long id) { return portfoyRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Portfoy","id",id)); }
    private PortfoyDto.OzetResponse toOzetResponse(Portfoy p) {
        List<PortfoyVarligi> varliklar = varlikRepository.findByPortfoyId(p.getId());
        BigDecimal toplamDeger = varliklar.stream().map(v -> v.getMiktar().multiply(piyasaVerisiService.getGuncelFiyat(v.getYatirimAraci().getId()))).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal toplamMaliyet = varliklar.stream().map(v -> v.getMiktar().multiply(v.getOrtalamaMaliyet())).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal nominalGetiri = toplamDeger.subtract(toplamMaliyet);
        BigDecimal yuzde = toplamMaliyet.compareTo(BigDecimal.ZERO) > 0 ? nominalGetiri.multiply(BigDecimal.valueOf(100)).divide(toplamMaliyet, 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        return new PortfoyDto.OzetResponse(p.getId(), p.getAd(), toplamDeger, toplamMaliyet, nominalGetiri, yuzde, varliklar.size(), p.getGuncellemeTarihi());
    }
    private PortfoyDto.DetayResponse toDetayResponse(Portfoy p) {
        List<PortfoyVarligi> varliklar = varlikRepository.findByPortfoyId(p.getId());
        BigDecimal toplamDeger = varliklar.stream().map(v -> v.getMiktar().multiply(piyasaVerisiService.getGuncelFiyat(v.getYatirimAraci().getId()))).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal toplamMaliyet = varliklar.stream().map(v -> v.getMiktar().multiply(v.getOrtalamaMaliyet())).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal nominalGetiri = toplamDeger.subtract(toplamMaliyet);
        BigDecimal yuzde = toplamMaliyet.compareTo(BigDecimal.ZERO) > 0 ? nominalGetiri.multiply(BigDecimal.valueOf(100)).divide(toplamMaliyet, 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        List<PortfoyDto.VarlikResponse> varlikDtoList = varliklar.stream().map(v -> toVarlikResponse(v, toplamDeger)).collect(Collectors.toList());
        PortfoyDto.DetayResponse d = new PortfoyDto.DetayResponse();
        d.setId(p.getId()); d.setAd(p.getAd()); d.setToplamDeger(toplamDeger); d.setToplamMaliyet(toplamMaliyet);
        d.setNominalGetiri(nominalGetiri); d.setNominalGetiriYuzde(yuzde); d.setVarliklar(varlikDtoList);
        d.setOlusturmaTarihi(p.getOlusturmaTarihi()); d.setGuncellemeTarihi(p.getGuncellemeTarihi());
        return d;
    }
    private PortfoyDto.VarlikResponse toVarlikResponse(PortfoyVarligi v, BigDecimal toplamDeger) {
        BigDecimal guncelFiyat = piyasaVerisiService.getGuncelFiyat(v.getYatirimAraci().getId());
        BigDecimal varlikDeger = v.getMiktar().multiply(guncelFiyat);
        BigDecimal maliyet = v.getMiktar().multiply(v.getOrtalamaMaliyet());
        BigDecimal kz = varlikDeger.subtract(maliyet);
        BigDecimal agirlik = toplamDeger.compareTo(BigDecimal.ZERO) > 0 ? varlikDeger.multiply(BigDecimal.valueOf(100)).divide(toplamDeger, 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        PortfoyDto.VarlikResponse dto = new PortfoyDto.VarlikResponse();
        dto.setId(v.getId()); dto.setYatirimAraciId(v.getYatirimAraci().getId());
        dto.setSembol(v.getYatirimAraci().getSembol()); dto.setEnstrumanAdi(v.getYatirimAraci().getAd());
        dto.setMiktar(v.getMiktar()); dto.setOrtalamaMaliyet(v.getOrtalamaMaliyet());
        dto.setGuncelFiyat(guncelFiyat); dto.setNominalKarZarar(kz); dto.setAgirlik(agirlik);
        return dto;
    }
}
