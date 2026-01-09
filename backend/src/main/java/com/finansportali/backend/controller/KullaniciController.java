package com.finansportali.backend.controller;

import com.finansportali.backend.entity.Kullanici;
import com.finansportali.backend.exception.ResourceNotFoundException;
import com.finansportali.backend.repository.KullaniciRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * KullaniciController - Kullanıcı senkronizasyonu
 *
 * Frontend Keycloak ile giriş yaptığında bu endpoint'i çağırır.
 * Keycloak sub (UUID) ile Kullanici tablosunda kayıt bulur veya oluşturur.
 * Portföy ve diğer işlemler için gereken internal DB ID'yi döner.
 */
@RestController
@RequestMapping("/api/v1/kullanicilar")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
@Tag(name = "Kullanıcılar", description = "Keycloak kullanıcı senkronizasyonu")
public class KullaniciController {

    private final KullaniciRepository kullaniciRepository;

    /**
     * POST /api/kullanicilar/sync
     * Body: { keycloakId, eposta, adSoyad }
     * Response: { id, eposta, adSoyad, rol }
     */
    @PostMapping("/sync")
    public ResponseEntity<Map<String, Object>> sync(@RequestBody Map<String, String> body) {
        String keycloakId = body.get("keycloakId");
        String eposta = body.getOrDefault("eposta", "");
        String adSoyad = body.getOrDefault("adSoyad", "");

        if (keycloakId == null || keycloakId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("hata", "keycloakId zorunlu"));
        }

        Kullanici kullanici = kullaniciRepository.findByKeycloakId(keycloakId)
            .orElseGet(() -> {
                log.info("Yeni kullanici olusturuluyor: {} - {}", keycloakId, eposta);
                Kullanici yeni = new Kullanici();
                yeni.setKeycloakId(keycloakId);
                yeni.setEposta(eposta);
                yeni.setAdSoyad(adSoyad);
                yeni.setRol("USER");
                return kullaniciRepository.save(yeni);
            });

        // Bilgileri güncelle (email değişmiş olabilir)
        boolean guncellendi = false;
        if (!eposta.isBlank() && !eposta.equals(kullanici.getEposta())) {
            kullanici.setEposta(eposta);
            guncellendi = true;
        }
        if (!adSoyad.isBlank() && !adSoyad.equals(kullanici.getAdSoyad())) {
            kullanici.setAdSoyad(adSoyad);
            guncellendi = true;
        }
        if (guncellendi) {
            kullanici = kullaniciRepository.save(kullanici);
        }

        return ResponseEntity.ok(Map.of(
            "id",      kullanici.getId(),
            "eposta",  kullanici.getEposta() != null ? kullanici.getEposta() : "",
            "adSoyad", kullanici.getAdSoyad() != null ? kullanici.getAdSoyad() : "",
            "rol",     kullanici.getRol() != null ? kullanici.getRol() : "USER"
        ));
    }

    /**
     * GET /api/kullanicilar/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getir(@PathVariable Long id) {
        Kullanici k = kullaniciRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Kullanici", "id", id));
        return ResponseEntity.ok(Map.of(
            "id",      k.getId(),
            "eposta",  k.getEposta() != null ? k.getEposta() : "",
            "adSoyad", k.getAdSoyad() != null ? k.getAdSoyad() : "",
            "rol",     k.getRol() != null ? k.getRol() : "USER"
        ));
    }
}
