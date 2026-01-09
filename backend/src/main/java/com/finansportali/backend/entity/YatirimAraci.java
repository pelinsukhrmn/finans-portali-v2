package com.finansportali.backend.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Yatırım aracı — hisse senedi, döviz veya kripto para.
 * Sembol alanı benzersizdir (örn. "THYAO", "USD", "BTC").
 */
@Entity @Table(name = "yatirim_araclari")
@Data @NoArgsConstructor @AllArgsConstructor
public class YatirimAraci {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(length = 20, nullable = false, unique = true) private String sembol;
    @Column(length = 255, nullable = false) private String ad;
    @Enumerated(EnumType.STRING) @Column(length = 50, nullable = false) private EnstrumanTipi tip;
    @Column(name = "aktif_mi") private Boolean aktifMi = true;
    @Column(name = "guncelleme_tarihi") private LocalDateTime guncellemeTarihi;
    @Column(name = "olusturma_tarihi", updatable = false) private LocalDateTime olusturmaTarihi;
    @PrePersist protected void onCreate() { this.olusturmaTarihi = LocalDateTime.now(); this.guncellemeTarihi = LocalDateTime.now(); }
    @PreUpdate protected void onUpdate() { this.guncellemeTarihi = LocalDateTime.now(); }
}
