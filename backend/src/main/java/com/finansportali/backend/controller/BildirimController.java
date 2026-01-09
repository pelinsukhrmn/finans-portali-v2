package com.finansportali.backend.controller;

import com.finansportali.backend.entity.*;
import com.finansportali.backend.repository.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * AI destekli bildirim sistemi endpoint'leri.
 */
@RestController
@RequestMapping("/api/v1/bildirimler")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Bildirimler", description = "AI haber analizi bildirimleri ve kullanıcı ayarları")
public class BildirimController {

    private final BildirimAyariRepository bildirimAyariRepository;
    private final AiBildirimRepository aiBildirimRepository;
    private final KullaniciRepository kullaniciRepository;

    // GET /api/bildirimler/ayarlar?kullaniciId=1
    @GetMapping("/ayarlar")
    public ResponseEntity<?> ayarlariGetir(@RequestParam Long kullaniciId) {
        BildirimAyari ayar = bildirimAyariRepository.findByKullaniciId(kullaniciId)
            .orElseGet(() -> {
                Kullanici k = kullaniciRepository.findById(kullaniciId).orElse(null);
                if (k == null) return null;
                BildirimAyari yeni = new BildirimAyari();
                yeni.setKullanici(k);
                return bildirimAyariRepository.save(yeni);
            });
        if (ayar == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ayarMap(ayar));
    }

    // PUT /api/bildirimler/ayarlar?kullaniciId=1
    @PutMapping("/ayarlar")
    public ResponseEntity<?> ayarlariGuncelle(
            @RequestParam Long kullaniciId,
            @RequestBody Map<String, Boolean> body) {

        BildirimAyari ayar = bildirimAyariRepository.findByKullaniciId(kullaniciId)
            .orElseGet(() -> {
                Kullanici k = kullaniciRepository.findById(kullaniciId).orElse(null);
                if (k == null) return null;
                BildirimAyari yeni = new BildirimAyari();
                yeni.setKullanici(k);
                return yeni;
            });
        if (ayar == null) return ResponseEntity.notFound().build();

        if (body.containsKey("aktif"))       ayar.setAktif(body.get("aktif"));
        if (body.containsKey("emailAktif"))  ayar.setEmailAktif(body.get("emailAktif"));
        if (body.containsKey("hisseTakip"))  ayar.setHisseTakip(body.get("hisseTakip"));
        if (body.containsKey("dovizTakip"))  ayar.setDovizTakip(body.get("dovizTakip"));
        if (body.containsKey("kriptoTakip")) ayar.setKriptoTakip(body.get("kriptoTakip"));

        bildirimAyariRepository.save(ayar);
        return ResponseEntity.ok(ayarMap(ayar));
    }

    // GET /api/bildirimler?kullaniciId=1&limit=20
    @GetMapping
    public ResponseEntity<?> bildirimlerGetir(
            @RequestParam Long kullaniciId,
            @RequestParam(defaultValue = "20") int limit) {

        List<AiBildirimi> list = aiBildirimRepository
            .findByKullaniciIdOrderByOlusturmaTarihiDesc(kullaniciId);

        List<Map<String, Object>> result = list.stream()
            .limit(limit)
            .map(this::bildirimMap)
            .toList();

        return ResponseEntity.ok(result);
    }

    // GET /api/bildirimler/okunmamis-sayi?kullaniciId=1
    @GetMapping("/okunmamis-sayi")
    public ResponseEntity<?> okunmamisSayi(@RequestParam Long kullaniciId) {
        long sayi = aiBildirimRepository.countByKullaniciIdAndOkunduFalse(kullaniciId);
        return ResponseEntity.ok(Map.of("sayi", sayi));
    }

    // PUT /api/bildirimler/{id}/okundu?kullaniciId=1
    @PutMapping("/{id}/okundu")
    public ResponseEntity<?> okunduIsaretle(
            @PathVariable Long id,
            @RequestParam Long kullaniciId) {

        return aiBildirimRepository.findById(id)
            .filter(b -> b.getKullanici().getId().equals(kullaniciId))
            .map(b -> {
                b.setOkundu(true);
                aiBildirimRepository.save(b);
                return ResponseEntity.ok(Map.of("ok", true));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    // GET /api/bildirimler/haber-etkiler?kullaniciId=1
    // Returns map of haberId → { etkilenenSemboller, etkiYonu, mesaj } for the Haberler page
    @GetMapping("/haber-etkiler")
    public ResponseEntity<?> haberEtkiler(@RequestParam Long kullaniciId) {
        List<AiBildirimi> liste = aiBildirimRepository
            .findByKullaniciIdOrderByOlusturmaTarihiDesc(kullaniciId);

        Map<String, Map<String, Object>> result = new LinkedHashMap<>();
        for (AiBildirimi b : liste) {
            if (b.getHaber() == null) continue;
            String key = String.valueOf(b.getHaber().getId());
            if (result.containsKey(key)) continue; // keep latest per news
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("etkiYonu", b.getEtkiYonu() != null ? b.getEtkiYonu() : "KARISIK");
            entry.put("etkilenenSemboller", b.getEtkilenenSemboller());
            entry.put("mesaj", b.getMesaj());
            result.put(key, entry);
        }
        return ResponseEntity.ok(result);
    }

    // PUT /api/bildirimler/hepsini-okundu?kullaniciId=1
    @PutMapping("/hepsini-okundu")
    public ResponseEntity<?> hepsiniOkunduIsaretle(@RequestParam Long kullaniciId) {
        List<AiBildirimi> okunmayanlar = aiBildirimRepository
            .findByKullaniciIdOrderByOlusturmaTarihiDesc(kullaniciId)
            .stream().filter(b -> !b.isOkundu()).toList();

        okunmayanlar.forEach(b -> b.setOkundu(true));
        aiBildirimRepository.saveAll(okunmayanlar);
        return ResponseEntity.ok(Map.of("guncellenen", okunmayanlar.size()));
    }

    private Map<String, Object> ayarMap(BildirimAyari a) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", a.getId());
        m.put("aktif", a.isAktif());
        m.put("emailAktif", a.isEmailAktif());
        m.put("hisseTakip", a.isHisseTakip());
        m.put("dovizTakip", a.isDovizTakip());
        m.put("kriptoTakip", a.isKriptoTakip());
        return m;
    }

    private Map<String, Object> bildirimMap(AiBildirimi b) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", b.getId());
        m.put("mesaj", b.getMesaj());
        m.put("haberBaslik", b.getHaberBaslik());
        m.put("etkilenenSemboller", b.getEtkilenenSemboller());
        m.put("etkiYonu", b.getEtkiYonu() != null ? b.getEtkiYonu() : "KARISIK");
        m.put("okundu", b.isOkundu());
        m.put("olusturmaTarihi", b.getOlusturmaTarihi());
        if (b.getHaber() != null) m.put("haberId", b.getHaber().getId());
        return m;
    }
}
