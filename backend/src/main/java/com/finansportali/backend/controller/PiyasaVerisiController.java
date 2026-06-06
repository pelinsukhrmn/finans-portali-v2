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
 * Piyasa verileri REST API.
 *
 * <p>Anlık, tarihsel ve sıralı fiyat bilgilerini sunar. Zamanlanmış görevler
 * ({@link com.finansportali.backend.scheduler.DataScheduler}) aracılığıyla periyodik
 * güncellenen fiyat kayıtlarına erişim sağlar.</p>
 */
@RestController
@RequestMapping("/api/v1/piyasa-verileri")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Piyasa Verileri", description = "Hisse, döviz ve kripto fiyat verileri")
public class PiyasaVerisiController {

    private final PiyasaVerisiService service;

    /**
     * Her enstrümanın en güncel fiyat kaydını döner.
     *
     * @return tüm aktif enstrümanlar için son fiyat listesi
     */
    @Operation(summary = "Tüm güncel fiyatları getir")
    @GetMapping("/guncel")
    public ResponseEntity<List<PiyasaVerisiDto.Response>> guncel() {
        return ResponseEntity.ok(service.tumGuncelVeriler());
    }

    /**
     * Günlük değişim yüzdesine göre en çok yükselen enstrümanları döner.
     *
     * @param limit döndürülecek maksimum kayıt sayısı (varsayılan: 5)
     * @return yükselen sıralama listesi
     */
    @Operation(summary = "En çok yükselen enstrümanları getir")
    @GetMapping("/yukselen")
    public ResponseEntity<List<PiyasaVerisiDto.Response>> yukselen(
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(service.enCokYukselen(limit));
    }

    /**
     * Günlük değişim yüzdesine göre en çok düşen enstrümanları döner.
     *
     * @param limit döndürülecek maksimum kayıt sayısı (varsayılan: 5)
     * @return düşen sıralama listesi
     */
    @Operation(summary = "En çok düşen enstrümanları getir")
    @GetMapping("/dusen")
    public ResponseEntity<List<PiyasaVerisiDto.Response>> dusen(
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(service.enCokDusen(limit));
    }

    /**
     * Belirtilen yatırım aracının en son fiyat kaydını döner.
     *
     * @param araciId yatırım aracı ID'si
     * @return son fiyat verisi
     * @throws com.finansportali.backend.exception.ResourceNotFoundException kayıt yoksa
     */
    @Operation(summary = "Tek enstrüman için son fiyatı getir")
    @GetMapping("/{araciId}/son")
    public ResponseEntity<PiyasaVerisiDto.Response> son(@PathVariable Long araciId) {
        return ResponseEntity.ok(service.sonFiyatGetir(araciId));
    }

    /**
     * Belirtilen tarih aralığındaki tarihsel fiyat verilerini döner.
     * Grafik ve teknik analiz hesaplamaları için kullanılır.
     *
     * @param araciId   yatırım aracı ID'si
     * @param baslangic başlangıç tarihi (ISO 8601 formatında)
     * @param bitis     bitiş tarihi (ISO 8601 formatında)
     * @return sıralı tarihsel fiyat listesi
     */
    @Operation(summary = "Tarih aralığına göre tarihsel fiyat getir")
    @GetMapping("/{araciId}/tarihsel")
    public ResponseEntity<List<PiyasaVerisiDto.Response>> tarihsel(
            @PathVariable Long araciId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime baslangic,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime bitis) {
        return ResponseEntity.ok(service.tarihselVeriGetir(araciId, baslangic, bitis));
    }

    /**
     * Belirtilen enstrümanın fiyat geçmişini sayfalı olarak döner.
     *
     * @param araciId  yatırım aracı ID'si
     * @param pageable sayfalama ve sıralama parametreleri
     * @return sayfalı fiyat verisi
     */
    @Operation(summary = "Sayfalı fiyat geçmişi")
    @GetMapping("/{araciId}")
    public ResponseEntity<Page<PiyasaVerisiDto.Response>> sayfali(
            @PathVariable Long araciId, Pageable pageable) {
        return ResponseEntity.ok(service.sayfaliListele(araciId, pageable));
    }

    /**
     * Tek fiyat kaydı ekler. Genellikle scheduler veya harici veri servisi tarafından çağrılır.
     *
     * @param req enstrüman ID, fiyat, değişim yüzdesi ve zaman damgası
     * @return oluşturulan kayıt; HTTP 201
     */
    @Operation(summary = "Tek fiyat verisi ekle")
    @PostMapping
    public ResponseEntity<PiyasaVerisiDto.Response> ekle(@RequestBody PiyasaVerisiDto.Request req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.ekle(req));
    }

    /**
     * Birden fazla fiyat kaydını tek istekte kaydeder (toplu yükleme).
     *
     * @param reqs fiyat verisi istek listesi
     * @return oluşturulan kayıtlar; HTTP 201
     */
    @Operation(summary = "Toplu fiyat verisi ekle")
    @PostMapping("/toplu")
    public ResponseEntity<List<PiyasaVerisiDto.Response>> toplu(
            @RequestBody List<PiyasaVerisiDto.Request> reqs) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.topluEkle(reqs));
    }
}
