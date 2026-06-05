package com.finansportali.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity @Table(name = "fiyat_tahminleri")
@Data @NoArgsConstructor @AllArgsConstructor
public class FiyatTahmini {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kullanici_id", nullable = false)
    private Kullanici kullanici;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "yatirim_araci_id", nullable = false)
    private YatirimAraci yatirimAraci;

    @Column(name = "hedef_fiyat", nullable = false)
    private Double hedefFiyat;

    @Column(name = "mevcut_fiyat_olusturma")
    private Double mevcutFiyatOlusturma;

    @Column(name = "hedef_tarih", nullable = false)
    private LocalDate hedefTarih;

    @Column(name = "notlar")
    private String notlar;

    @Column(name = "durum", nullable = false, length = 20)
    private String durum = "BEKLEMEDE";

    @Column(name = "olusturma_tarihi", updatable = false)
    private LocalDateTime olusturmaTarihi;

    @PrePersist
    protected void onCreate() { this.olusturmaTarihi = LocalDateTime.now(); }
}
