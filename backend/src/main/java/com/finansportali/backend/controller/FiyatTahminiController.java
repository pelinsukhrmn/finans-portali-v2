package com.finansportali.backend.controller;

import com.finansportali.backend.entity.FiyatTahmini;
import com.finansportali.backend.entity.Kullanici;
import com.finansportali.backend.entity.YatirimAraci;
import com.finansportali.backend.exception.ResourceNotFoundException;
import com.finansportali.backend.repository.FiyatTahminiRepository;
import com.finansportali.backend.repository.KullaniciRepository;
import com.finansportali.backend.repository.YatirimAraciRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tahminler")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Tahmin Defteri", description = "Fiyat tahmin takip sistemi")
public class FiyatTahminiController {

    private final FiyatTahminiRepository tahminRepository;
    private final KullaniciRepository kullaniciRepository;
    private final YatirimAraciRepository yatirimAraciRepository;

    @GetMapping
    public ResponseEntity<?> listele(@RequestParam Long kullaniciId) {
        List<FiyatTahmini> tahminler = tahminRepository.findByKullaniciIdOrderByOlusturmaTarihiDesc(kullaniciId);
        return ResponseEntity.ok(tahminler.stream().map(this::toMap).toList());
    }

    @PostMapping
    public ResponseEntity<?> ekle(@RequestParam Long kullaniciId, @RequestBody Map<String, Object> body) {
        Kullanici kullanici = kullaniciRepository.findById(kullaniciId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanici", "id", kullaniciId));
        Long araciId = Long.valueOf(body.get("yatirimAraciId").toString());
        YatirimAraci araci = yatirimAraciRepository.findById(araciId)
                .orElseThrow(() -> new ResourceNotFoundException("YatirimAraci", "id", araciId));

        FiyatTahmini t = new FiyatTahmini();
        t.setKullanici(kullanici);
        t.setYatirimAraci(araci);
        t.setHedefFiyat(Double.parseDouble(body.get("hedefFiyat").toString()));
        t.setMevcutFiyatOlusturma(body.containsKey("mevcutFiyat")
                ? Double.parseDouble(body.get("mevcutFiyat").toString()) : null);
        t.setHedefTarih(LocalDate.parse(body.get("hedefTarih").toString()));
        t.setNotlar(body.containsKey("notlar") ? body.get("notlar").toString() : null);
        t.setDurum("BEKLEMEDE");

        return ResponseEntity.ok(toMap(tahminRepository.save(t)));
    }

    @PutMapping("/{id}/durum")
    public ResponseEntity<?> durumGuncelle(@PathVariable Long id,
                                            @RequestParam Long kullaniciId,
                                            @RequestBody Map<String, String> body) {
        FiyatTahmini t = tahminRepository.findById(id)
                .filter(x -> x.getKullanici().getId().equals(kullaniciId))
                .orElseThrow(() -> new ResourceNotFoundException("FiyatTahmini", "id", id));
        t.setDurum(body.get("durum"));
        return ResponseEntity.ok(toMap(tahminRepository.save(t)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> sil(@PathVariable Long id, @RequestParam Long kullaniciId) {
        FiyatTahmini t = tahminRepository.findById(id)
                .filter(x -> x.getKullanici().getId().equals(kullaniciId))
                .orElseThrow(() -> new ResourceNotFoundException("FiyatTahmini", "id", id));
        tahminRepository.delete(t);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    private Map<String, Object> toMap(FiyatTahmini t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", t.getId());
        m.put("yatirimAraciId", t.getYatirimAraci().getId());
        m.put("sembol", t.getYatirimAraci().getSembol());
        m.put("ad", t.getYatirimAraci().getAd());
        m.put("tip", t.getYatirimAraci().getTip());
        m.put("hedefFiyat", t.getHedefFiyat());
        m.put("mevcutFiyatOlusturma", t.getMevcutFiyatOlusturma());
        m.put("hedefTarih", t.getHedefTarih());
        m.put("durum", t.getDurum());
        m.put("notlar", t.getNotlar());
        m.put("olusturmaTarihi", t.getOlusturmaTarihi());
        return m;
    }
}
