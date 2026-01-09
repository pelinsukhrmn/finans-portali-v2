package com.finansportali.backend.dto;

import java.time.LocalDateTime;

public record ChatSessionDTO(
        Long id,
        String baslik,
        LocalDateTime olusturmaTarihi,
        LocalDateTime guncellemeTarihi,
        String sonMesaj,
        String durum,
        Boolean hasInsights
) {}
