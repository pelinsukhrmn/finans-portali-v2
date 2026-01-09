package com.finansportali.backend.controller;

import com.finansportali.backend.dto.EkonomikTakvimDto;
import com.finansportali.backend.service.EkonomikTakvimService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Ekonomik takvim olayları endpoint'i.
 */
@RestController
@RequestMapping("/api/v1/ekonomik-takvim")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Ekonomik Takvim", description = "TCMB faiz, enflasyon ve diğer makroekonomik olaylar")
public class EkonomikTakvimController {

    private final EkonomikTakvimService service;

    @GetMapping
    public ResponseEntity<List<EkonomikTakvimDto.Response>> listele(
            @RequestParam(required = false) String aralik,
            @RequestParam(required = false) String ulke,
            @RequestParam(required = false) Integer onem) {
        service.demoDataSeed();
        return ResponseEntity.ok(service.listele(aralik, ulke, onem));
    }

    @PostMapping
    public ResponseEntity<EkonomikTakvimDto.Response> ekle(@RequestBody EkonomikTakvimDto.Request req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.ekle(req));
    }
}
