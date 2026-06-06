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
 * Yatırım araçları (hisse, döviz, kripto, fon, tahvil, VIOP) için CRUD REST API.
 *
 * <p>Tüm endpoint'ler {@code /api/v1/yatirim-araclari} prefix'i altındadır ve
 * kimlik doğrulaması gerektirmez; okuma işlemleri herkes tarafından yapılabilir.</p>
 */
@RestController
@RequestMapping("/api/v1/yatirim-araclari")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Yatırım Araçları", description = "Hisse, döviz, kripto, fon, tahvil ve VIOP enstrümanları")
public class YatirimAraciController {

    private final YatirimAraciService service;

    /**
     * Tüm yatırım araçlarını listeler; opsiyonel olarak enstrüman tipine göre filtreler.
     *
     * @param tip filtre tipi (HISSE, DOVIZ, KRIPTO, FON, TAHVIL_BONO, VIOP) – boş bırakılırsa tümü döner
     * @return enstrüman listesi
     */
    @Operation(summary = "Tüm yatırım araçlarını listele (isteğe bağlı tip filtresi ile)")
    @GetMapping
    public ResponseEntity<List<YatirimAraciDto.Response>> listele(
            @RequestParam(required = false) EnstrumanTipi tip) {
        return ResponseEntity.ok(tip != null ? service.tipeGoreGetir(tip) : service.tumunuGetir());
    }

    /**
     * Verilen ID'ye sahip yatırım aracını döner.
     *
     * @param id yatırım aracı birincil anahtarı
     * @return bulunan enstrüman detayı
     * @throws com.finansportali.backend.exception.ResourceNotFoundException kayıt bulunamazsa
     */
    @Operation(summary = "ID ile tek enstrüman getir")
    @GetMapping("/{id}")
    public ResponseEntity<YatirimAraciDto.Response> detay(@PathVariable Long id) {
        return ResponseEntity.ok(service.idIleGetir(id));
    }

    /**
     * Verilen sembol (örn. "THYAO") ile yatırım aracını döner.
     *
     * @param sembol borsa sembolü, büyük/küçük harf duyarlı
     * @return eşleşen enstrüman
     */
    @Operation(summary = "Sembol ile enstrüman getir")
    @GetMapping("/sembol/{sembol}")
    public ResponseEntity<YatirimAraciDto.Response> sembol(@PathVariable String sembol) {
        return ResponseEntity.ok(service.sembolIleGetir(sembol));
    }

    /**
     * Sembol veya ad alanında serbest metin araması yapar.
     *
     * @param q en az 2 karakter arama terimi
     * @return en fazla 20 sonuç döner
     */
    @Operation(summary = "Sembol veya isme göre enstrüman ara")
    @GetMapping("/ara")
    public ResponseEntity<List<YatirimAraciDto.Response>> ara(@RequestParam String q) {
        return ResponseEntity.ok(service.aramaYap(q));
    }

    /**
     * Yeni yatırım aracı kaydeder.
     *
     * @param req sembol, ad, tip ve açıklama içeren istek gövdesi
     * @return oluşturulan kayıt; HTTP 201
     * @throws com.finansportali.backend.exception.DuplicateResourceException sembol zaten mevcutsa
     */
    @Operation(summary = "Yeni enstrüman ekle")
    @PostMapping
    public ResponseEntity<YatirimAraciDto.Response> ekle(@RequestBody YatirimAraciDto.Request req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.ekle(req));
    }

    /**
     * Mevcut bir yatırım aracının bilgilerini günceller.
     *
     * @param id  güncellenecek kaydın ID'si
     * @param req güncel alan değerleri
     * @return güncellenmiş enstrüman
     */
    @Operation(summary = "Enstrüman bilgilerini güncelle")
    @PutMapping("/{id}")
    public ResponseEntity<YatirimAraciDto.Response> guncelle(
            @PathVariable Long id,
            @RequestBody YatirimAraciDto.Request req) {
        return ResponseEntity.ok(service.guncelle(id, req));
    }

    /**
     * Yatırım aracını ve ilgili tüm fiyat verilerini kalıcı olarak siler.
     *
     * @param id silinecek enstrüman ID'si
     * @return HTTP 204 No Content
     */
    @Operation(summary = "Enstrümanı sil")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> sil(@PathVariable Long id) {
        service.sil(id);
        return ResponseEntity.noContent().build();
    }
}
