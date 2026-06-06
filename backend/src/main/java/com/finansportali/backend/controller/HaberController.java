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
 * Finansal haber feed'i REST API.
 *
 * <p>Haberler NewsAPI gibi harici kaynaklardan periyodik olarak çekilir,
 * AI servisi tarafından analiz edilir ve kullanıcıya kategori/arama
 * destekli şekilde sunulur.</p>
 */
@RestController
@RequestMapping("/api/v1/haberler")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Haberler", description = "Finansal haber akışı ve kategorilere göre filtreleme")
public class HaberController {

    private final HaberService service;

    /**
     * Tüm haberleri oluşturulma tarihine göre azalan sırada sayfalı döner.
     *
     * @param pageable sayfa numarası, boyutu ve sıralama parametreleri
     * @return sayfalı haber listesi
     */
    @Operation(summary = "Tüm haberleri sayfalı listele")
    @GetMapping
    public ResponseEntity<Page<HaberDto.Response>> tumHaberler(Pageable pageable) {
        return ResponseEntity.ok(service.tumHaberler(pageable));
    }

    /**
     * En son eklenen 10 haberi döner. Dashboard özet bileşeni için kullanılır.
     *
     * @return son haberler listesi (en fazla 10 kayıt)
     */
    @Operation(summary = "Son 10 haberi getir")
    @GetMapping("/son")
    public ResponseEntity<List<HaberDto.Response>> son() {
        return ResponseEntity.ok(service.sonHaberler());
    }

    /**
     * Belirtilen ID'ye sahip haberin tam detayını döner.
     *
     * @param id haber birincil anahtarı
     * @return haber başlık, içerik, kaynak ve tarih bilgisi
     * @throws com.finansportali.backend.exception.ResourceNotFoundException haber bulunamazsa
     */
    @Operation(summary = "Haber detayını getir")
    @GetMapping("/{id}")
    public ResponseEntity<HaberDto.Response> detay(@PathVariable Long id) {
        return ResponseEntity.ok(service.detayGetir(id));
    }

    /**
     * Belirtilen kategorideki haberleri sayfalı döner.
     * Örnek kategoriler: {@code ekonomi}, {@code hisse}, {@code doviz}, {@code kripto}.
     *
     * @param kategori haber kategorisi (URL path değişkeni)
     * @param pageable sayfalama parametreleri
     * @return filtrelenmiş sayfalı haber listesi
     */
    @Operation(summary = "Kategoriye göre haber filtrele")
    @GetMapping("/kategori/{kategori}")
    public ResponseEntity<Page<HaberDto.Response>> kategori(
            @PathVariable String kategori, Pageable pageable) {
        return ResponseEntity.ok(service.kategoriIleGetir(kategori, pageable));
    }

    /**
     * Başlık ve içerik alanlarında serbest metin araması yapar.
     *
     * @param q arama terimi (en az 2 karakter önerilir)
     * @return eşleşen haberler listesi
     */
    @Operation(summary = "Haberlerde arama yap")
    @GetMapping("/ara")
    public ResponseEntity<List<HaberDto.Response>> ara(@RequestParam String q) {
        return ResponseEntity.ok(service.aramaYap(q));
    }

    /**
     * Yeni haber kaydeder. Genellikle scheduler tarafından otomatik çağrılır;
     * manuel ekleme için de kullanılabilir.
     *
     * @param req başlık, içerik, kaynak URL ve kategori bilgisi
     * @return oluşturulan haber; HTTP 201
     */
    @Operation(summary = "Yeni haber ekle")
    @PostMapping
    public ResponseEntity<HaberDto.Response> ekle(@RequestBody HaberDto.Request req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.ekle(req));
    }

    /**
     * Belirtilen haberi kalıcı olarak siler.
     *
     * @param id silinecek haber ID'si
     * @return HTTP 204 No Content
     */
    @Operation(summary = "Haberi sil")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> sil(@PathVariable Long id) {
        service.sil(id);
        return ResponseEntity.noContent().build();
    }
}
