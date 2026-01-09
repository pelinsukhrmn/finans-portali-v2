package com.finansportali.backend.controller;

import com.finansportali.backend.dto.PiyasaVerisiDto;
import com.finansportali.backend.service.PiyasaVerisiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Piyasa verileri REST API. Anlık, tarihsel ve sıralı fiyat bilgilerini sunar.
 */
@RestController
@RequestMapping("/api/v1/piyasa-verileri")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Piyasa Verileri", description = "Hisse, döviz ve kripto fiyat verileri")
public class PiyasaVerisiController {

    private final PiyasaVerisiService service;

    @Operation(summary = "Tüm güncel fiyatları getir")
    @GetMapping("/guncel")
    public ResponseEntity<List<PiyasaVerisiDto.Response>> guncel() {
        return ResponseEntity.ok(service.tumGuncelVeriler());
    }

    @GetMapping("/yukselen")
    public ResponseEntity<List<PiyasaVerisiDto.Response>> yukselen(
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(service.enCokYukselen(limit));
    }

    @GetMapping("/dusen")
    public ResponseEntity<List<PiyasaVerisiDto.Response>> dusen(
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(service.enCokDusen(limit));
    }

    @GetMapping("/{araciId}/son")
    public ResponseEntity<PiyasaVerisiDto.Response> son(@PathVariable Long araciId) {
        return ResponseEntity.ok(service.sonFiyatGetir(araciId));
    }

    @GetMapping("/{araciId}/tarihsel")
    public ResponseEntity<List<PiyasaVerisiDto.Response>> tarihsel(
            @PathVariable Long araciId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime baslangic,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime bitis) {
        return ResponseEntity.ok(service.tarihselVeriGetir(araciId, baslangic, bitis));
    }

    @GetMapping("/{araciId}")
    public ResponseEntity<Page<PiyasaVerisiDto.Response>> sayfali(
            @PathVariable Long araciId, Pageable pageable) {
        return ResponseEntity.ok(service.sayfaliListele(araciId, pageable));
    }

    @PostMapping
    public ResponseEntity<PiyasaVerisiDto.Response> ekle(@RequestBody PiyasaVerisiDto.Request req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.ekle(req));
    }

    @PostMapping("/toplu")
    public ResponseEntity<List<PiyasaVerisiDto.Response>> toplu(
            @RequestBody List<PiyasaVerisiDto.Request> reqs) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.topluEkle(reqs));
    }
}
