package com.finansportali.backend.controller;

import com.finansportali.backend.dto.PortfoyDto;
import com.finansportali.backend.service.PortfoyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Portföy ve varlık yönetimi REST API.
 *
 * <p>Kullanıcılar birden fazla portföy oluşturabilir; her portföyde farklı
 * enstrüman tiplerinden (hisse, döviz, fon vb.) varlık tutabilirler.
 * Portföy değeri ve kar/zarar anlık piyasa fiyatlarına göre hesaplanır.</p>
 */
@RestController
@RequestMapping("/api/v1/portfoyler")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Portföy", description = "Portföy oluşturma, güncelleme ve varlık yönetimi")
public class PortfoyController {

    private final PortfoyService service;

    /**
     * Belirtilen kullanıcıya ait tüm portföyleri özet bilgileriyle döner.
     *
     * @param kullaniciId portföyleri sorgulanacak kullanıcı ID'si
     * @return toplam değer, maliyet ve getiri bilgisi içeren portföy listesi
     */
    @Operation(summary = "Kullanıcının portföylerini listele")
    @GetMapping
    public ResponseEntity<List<PortfoyDto.OzetResponse>> listele(@RequestParam Long kullaniciId) {
        return ResponseEntity.ok(service.kullanicininPortfoyleri(kullaniciId));
    }

    /**
     * Tek bir portföyün tüm varlıklarını güncel fiyat ve kar/zarar bilgisiyle döner.
     *
     * @param id portföy birincil anahtarı
     * @return varlık detayları dahil portföy yanıtı
     */
    @Operation(summary = "Portföy detayını getir")
    @GetMapping("/{id}")
    public ResponseEntity<PortfoyDto.DetayResponse> detay(@PathVariable Long id) {
        return ResponseEntity.ok(service.portfoyDetay(id));
    }

    /**
     * Kullanıcı için yeni boş portföy oluşturur.
     *
     * @param kullaniciId portföy sahibi kullanıcı ID'si
     * @param req         portföy adını içeren istek gövdesi
     * @return oluşturulan portföy özeti; HTTP 201
     */
    @Operation(summary = "Yeni portföy oluştur")
    @PostMapping
    public ResponseEntity<PortfoyDto.OzetResponse> olustur(
            @RequestParam Long kullaniciId,
            @RequestBody PortfoyDto.Request req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.olustur(kullaniciId, req));
    }

    /**
     * Portföy adını günceller.
     *
     * @param id  güncellenecek portföy ID'si
     * @param req yeni portföy adını içeren istek
     * @return güncellenmiş portföy özeti
     */
    @Operation(summary = "Portföy adını güncelle")
    @PutMapping("/{id}")
    public ResponseEntity<PortfoyDto.OzetResponse> guncelle(
            @PathVariable Long id,
            @RequestBody PortfoyDto.Request req) {
        return ResponseEntity.ok(service.guncelle(id, req));
    }

    /**
     * Portföyü ve içindeki tüm varlıkları kalıcı olarak siler.
     *
     * @param id silinecek portföy ID'si
     * @return HTTP 204 No Content
     */
    @Operation(summary = "Portföyü sil")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> sil(@PathVariable Long id) {
        service.sil(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Portföye yeni varlık ekler. Aynı enstrüman zaten mevcutsa miktar ve
     * ortalama maliyet birleştirilir.
     *
     * @param id  varlığın ekleneceği portföy ID'si
     * @param req enstrüman ID, miktar ve ortalama maliyet bilgisi
     * @return eklenen varlık detayı; HTTP 201
     */
    @Operation(summary = "Portföye varlık ekle")
    @PostMapping("/{id}/varliklar")
    public ResponseEntity<PortfoyDto.VarlikResponse> varlikEkle(
            @PathVariable Long id,
            @RequestBody PortfoyDto.VarlikRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.varlikEkle(id, req));
    }

    /**
     * Mevcut portföy varlığının miktar veya maliyet bilgisini günceller.
     *
     * @param varlikId güncellenecek varlık ID'si
     * @param req      yeni miktar ve/veya ortalama maliyet
     * @return güncellenmiş varlık detayı
     */
    @Operation(summary = "Portföy varlığını güncelle")
    @PutMapping("/varliklar/{varlikId}")
    public ResponseEntity<PortfoyDto.VarlikResponse> varlikGuncelle(
            @PathVariable Long varlikId,
            @RequestBody PortfoyDto.VarlikRequest req) {
        return ResponseEntity.ok(service.varlikGuncelle(varlikId, req));
    }

    /**
     * Portföyden varlığı çıkarır.
     *
     * @param varlikId silinecek varlık ID'si
     * @return HTTP 204 No Content
     */
    @Operation(summary = "Portföyden varlık çıkar")
    @DeleteMapping("/varliklar/{varlikId}")
    public ResponseEntity<Void> varlikSil(@PathVariable Long varlikId) {
        service.varlikSil(varlikId);
        return ResponseEntity.noContent().build();
    }
}
