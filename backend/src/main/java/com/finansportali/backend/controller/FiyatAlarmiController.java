package com.finansportali.backend.controller;
import com.finansportali.backend.dto.FiyatAlarmiDto;
import com.finansportali.backend.service.FiyatAlarmiService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Fiyat alarmı endpoint'leri.
 */
@RestController @RequestMapping("/api/v1/fiyat-alarmlari") @RequiredArgsConstructor @CrossOrigin(origins = "*")
@Tag(name = "Fiyat Alarmları", description = "Hedef fiyat alarmı oluşturma ve yönetimi")
public class FiyatAlarmiController {
    private final FiyatAlarmiService service;
    @GetMapping public ResponseEntity<List<FiyatAlarmiDto.Response>> listele(@RequestParam Long kullaniciId) { return ResponseEntity.ok(service.kullanicininAlarmlari(kullaniciId)); }
    @PostMapping public ResponseEntity<FiyatAlarmiDto.Response> olustur(@RequestParam Long kullaniciId, @RequestBody FiyatAlarmiDto.Request req) { return ResponseEntity.status(HttpStatus.CREATED).body(service.olustur(kullaniciId, req)); }
    @PutMapping("/{id}/iptal") public ResponseEntity<Void> iptal(@PathVariable Long id) { service.iptalEt(id); return ResponseEntity.ok().build(); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> sil(@PathVariable Long id) { service.sil(id); return ResponseEntity.noContent().build(); }
}
