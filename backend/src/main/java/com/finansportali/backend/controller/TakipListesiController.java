package com.finansportali.backend.controller;
import com.finansportali.backend.dto.TakipListesiDto;
import com.finansportali.backend.service.TakipListesiService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Takip listesi endpoint'leri.
 */
@RestController @RequestMapping("/api/v1/takip-listesi") @RequiredArgsConstructor @CrossOrigin(origins = "*")
@Tag(name = "Takip Listesi", description = "Kullanıcı takip listesi (watchlist) yönetimi")
public class TakipListesiController {
    private final TakipListesiService service;
    @GetMapping public ResponseEntity<List<TakipListesiDto.Response>> listele(@RequestParam Long kullaniciId) { return ResponseEntity.ok(service.kullanicininListesi(kullaniciId)); }
    @PostMapping public ResponseEntity<TakipListesiDto.Response> ekle(@RequestParam Long kullaniciId, @RequestBody TakipListesiDto.Request req) { return ResponseEntity.status(HttpStatus.CREATED).body(service.ekle(kullaniciId, req)); }
    @DeleteMapping public ResponseEntity<Void> sil(@RequestParam Long kullaniciId, @RequestParam Long araciId) { service.sil(kullaniciId, araciId); return ResponseEntity.noContent().build(); }
}
