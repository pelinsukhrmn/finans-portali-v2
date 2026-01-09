package com.finansportali.backend.controller;

import com.finansportali.backend.dto.BacktestDto;
import com.finansportali.backend.service.BacktestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Strateji geri testi (backtesting) endpoint'i.
 */
@RestController
@RequestMapping("/api/v1/backtest")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Geri Test", description = "Yatırım stratejisi tarihsel performans testi")
public class BacktestController {

    private final BacktestService backtestService;

    @PostMapping
    public ResponseEntity<BacktestDto.Response> backtest(@RequestBody BacktestDto.Request req) {
        return ResponseEntity.ok(backtestService.backtest(req));
    }
}
