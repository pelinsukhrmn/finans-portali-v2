package com.finansportali.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "chat_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "kullanici_id", nullable = false)
    private Long kullaniciId;

    @Column(name = "portfoy_id")
    private Long portfoyId;

    @Column(name = "baslik", length = 255)
    @Builder.Default
    private String baslik = "Yeni Sohbet";

    @Column(name = "son_mesaj", columnDefinition = "TEXT")
    private String sonMesaj;

    @Column(name = "durum", length = 30)
    @Builder.Default
    private String durum = "ACTIVE";

    @Column(name = "has_insights")
    @Builder.Default
    private Boolean hasInsights = false;

    @Column(name = "last_ai_metadata", columnDefinition = "TEXT")
    private String lastAiMetadata;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @OrderBy("olusturmaTarihi ASC")
    @JsonIgnore
    @Builder.Default
    private List<ChatMesaj> mesajlar = new ArrayList<>();

    @Column(name = "olusturma_tarihi", updatable = false)
    private LocalDateTime olusturmaTarihi;

    @Column(name = "guncelleme_tarihi")
    private LocalDateTime guncellemeTarihi;

    @PrePersist
    protected void onCreate() {
        this.olusturmaTarihi = LocalDateTime.now();
        this.guncellemeTarihi = LocalDateTime.now();
        if (durum == null) durum = "ACTIVE";
        if (hasInsights == null) hasInsights = false;
    }

    @PreUpdate
    protected void onUpdate() {
        this.guncellemeTarihi = LocalDateTime.now();
    }
}
