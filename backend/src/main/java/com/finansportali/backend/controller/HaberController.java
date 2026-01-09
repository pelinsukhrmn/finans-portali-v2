package com.finansportali.backend.controller;
import com.finansportali.backend.dto.HaberDto;
import com.finansportali.backend.service.HaberService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Finansal haber feed'i endpoint'leri.
 */
@RestController @RequestMapping("/api/v1/haberler") @RequiredArgsConstructor @CrossOrigin(origins = "*")
@Tag(name = "Haberler", description = "Finansal haber akışı ve kategorilere göre filtreleme")
public class HaberController {
    private final HaberService service;
    @GetMapping public ResponseEntity<Page<HaberDto.Response>> tumHaberler(Pageable pageable) { return ResponseEntity.ok(service.tumHaberler(pageable)); }
    @GetMapping("/son") public ResponseEntity<List<HaberDto.Response>> son() { return ResponseEntity.ok(service.sonHaberler()); }
    @GetMapping("/{id}") public ResponseEntity<HaberDto.Response> detay(@PathVariable Long id) { return ResponseEntity.ok(service.detayGetir(id)); }
    @GetMapping("/kategori/{kategori}") public ResponseEntity<Page<HaberDto.Response>> kategori(@PathVariable String kategori, Pageable pageable) { return ResponseEntity.ok(service.kategoriIleGetir(kategori, pageable)); }
    @GetMapping("/ara") public ResponseEntity<List<HaberDto.Response>> ara(@RequestParam String q) { return ResponseEntity.ok(service.aramaYap(q)); }
    @PostMapping public ResponseEntity<HaberDto.Response> ekle(@RequestBody HaberDto.Request req) { return ResponseEntity.status(HttpStatus.CREATED).body(service.ekle(req)); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> sil(@PathVariable Long id) { service.sil(id); return ResponseEntity.noContent().build(); }
}
