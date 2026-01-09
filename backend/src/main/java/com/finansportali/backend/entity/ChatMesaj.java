package com.finansportali.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_mesajlari")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMesaj {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seans_id", nullable = false)
    @JsonIgnore
    private ChatSession session;

    @Column(name = "rol", nullable = false, length = 20)
    private String rol;

    @Column(name = "icerik", nullable = false, columnDefinition = "TEXT")
    private String icerik;

    @Column(name = "grafik_data", columnDefinition = "TEXT")
    private String grafikData;

    @Column(name = "anomalies", columnDefinition = "TEXT")
    private String anomalies;

    @Column(name = "signals", columnDefinition = "TEXT")
    private String signals;

    @Column(name = "ai_metadata", columnDefinition = "TEXT")
    private String aiMetadata;

    @Column(name = "has_chart")
    private Boolean hasChart;

    @Column(name = "has_anomaly")
    private Boolean hasAnomaly;

    @Column(name = "has_insights")
    private Boolean hasInsights;

    @Column(name = "olusturma_tarihi", updatable = false)
    private LocalDateTime olusturmaTarihi;

    @PrePersist
    protected void onCreate() {
        this.olusturmaTarihi = LocalDateTime.now();
        if (hasChart == null) hasChart = false;
        if (hasAnomaly == null) hasAnomaly = false;
        if (hasInsights == null) hasInsights = false;
    }
}
