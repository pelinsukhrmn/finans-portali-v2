package com.finansportali.backend.controller;
import com.finansportali.backend.dto.YatirimAraciDto;
import com.finansportali.backend.entity.EnstrumanTipi;
import com.finansportali.backend.service.YatirimAraciService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Yatırım araçları (hisse, döviz, kripto) CRUD işlemleri.
 */
@RestController @RequestMapping("/api/v1/yatirim-araclari") @RequiredArgsConstructor @CrossOrigin(origins = "*")
@Tag(name = "Yatırım Araçları", description = "Hisse, döviz ve kripto yatırım araçları")
public class YatirimAraciController {
    private final YatirimAraciService service;
    @GetMapping public ResponseEntity<List<YatirimAraciDto.Response>> listele(@RequestParam(required=false) EnstrumanTipi tip) {
        return ResponseEntity.ok(tip != null ? service.tipeGoreGetir(tip) : service.tumunuGetir());
    }
    @GetMapping("/{id}") public ResponseEntity<YatirimAraciDto.Response> detay(@PathVariable Long id) { return ResponseEntity.ok(service.idIleGetir(id)); }
    @GetMapping("/sembol/{sembol}") public ResponseEntity<YatirimAraciDto.Response> sembol(@PathVariable String sembol) { return ResponseEntity.ok(service.sembolIleGetir(sembol)); }
    @GetMapping("/ara") public ResponseEntity<List<YatirimAraciDto.Response>> ara(@RequestParam String q) { return ResponseEntity.ok(service.aramaYap(q)); }
    @PostMapping public ResponseEntity<YatirimAraciDto.Response> ekle(@RequestBody YatirimAraciDto.Request req) { return ResponseEntity.status(HttpStatus.CREATED).body(service.ekle(req)); }
    @PutMapping("/{id}") public ResponseEntity<YatirimAraciDto.Response> guncelle(@PathVariable Long id, @RequestBody YatirimAraciDto.Request req) { return ResponseEntity.ok(service.guncelle(id,req)); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> sil(@PathVariable Long id) { service.sil(id); return ResponseEntity.noContent().build(); }
}
