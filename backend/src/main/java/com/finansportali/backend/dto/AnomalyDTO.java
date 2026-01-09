package com.finansportali.backend.dto;

public record AnomalyDTO(
        String type,
        String symbol,
        String message,
        String severity,
        Double confidence
) {}
