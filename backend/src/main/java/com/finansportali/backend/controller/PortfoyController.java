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
 * Portföy ve varlık yönetimi endpoint'leri.
 */
@RestController @RequestMapping("/api/v1/portfoyler") @RequiredArgsConstructor @CrossOrigin(origins = "*")
@Tag(name = "Portföy", description = "Portföy oluşturma, güncelleme ve varlık yönetimi")
public class PortfoyController {
    private final PortfoyService service;
    @GetMapping public ResponseEntity<List<PortfoyDto.OzetResponse>> listele(@RequestParam Long kullaniciId) { return ResponseEntity.ok(service.kullanicininPortfoyleri(kullaniciId)); }
    @GetMapping("/{id}") public ResponseEntity<PortfoyDto.DetayResponse> detay(@PathVariable Long id) { return ResponseEntity.ok(service.portfoyDetay(id)); }
    @PostMapping public ResponseEntity<PortfoyDto.OzetResponse> olustur(@RequestParam Long kullaniciId, @RequestBody PortfoyDto.Request req) { return ResponseEntity.status(HttpStatus.CREATED).body(service.olustur(kullaniciId, req)); }
    @PutMapping("/{id}") public ResponseEntity<PortfoyDto.OzetResponse> guncelle(@PathVariable Long id, @RequestBody PortfoyDto.Request req) { return ResponseEntity.ok(service.guncelle(id, req)); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> sil(@PathVariable Long id) { service.sil(id); return ResponseEntity.noContent().build(); }
    @PostMapping("/{id}/varliklar") public ResponseEntity<PortfoyDto.VarlikResponse> varlikEkle(@PathVariable Long id, @RequestBody PortfoyDto.VarlikRequest req) { return ResponseEntity.status(HttpStatus.CREATED).body(service.varlikEkle(id, req)); }
    @PutMapping("/varliklar/{varlikId}") public ResponseEntity<PortfoyDto.VarlikResponse> varlikGuncelle(@PathVariable Long varlikId, @RequestBody PortfoyDto.VarlikRequest req) { return ResponseEntity.ok(service.varlikGuncelle(varlikId, req)); }
    @DeleteMapping("/varliklar/{varlikId}") public ResponseEntity<Void> varlikSil(@PathVariable Long varlikId) { service.varlikSil(varlikId); return ResponseEntity.noContent().build(); }
}
