package com.finansportali.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ChatMesajDTO(
        Long id,
        String rol,
        String icerik,
        String grafikData,
        List<AnomalyDTO> anomalies,
        LocalDateTime olusturmaTarihi,
        Boolean hasChart,
        Boolean hasAnomaly,
        Boolean hasInsights,
        String signals,
        String aiMetadata
) {}
