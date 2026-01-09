package com.finansportali.backend.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Entity @Table(name = "fiyat_alarmlari")
@Data @NoArgsConstructor @AllArgsConstructor
public class FiyatAlarmi {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "kullanici_id", nullable = false) private Kullanici kullanici;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "yatirim_araci_id", nullable = false) private YatirimAraci yatirimAraci;
    @Column(name = "hedef_fiyat", nullable = false, precision = 19, scale = 4) private BigDecimal hedefFiyat;
    @Column(length = 10, nullable = false) private String yon;
    @Column(name = "aktif_mi") private Boolean aktifMi = true;
    @Column(name = "tetiklendi_mi") private Boolean tetiklendiMi = false;
    @Column(name = "olusturma_tarihi", updatable = false) private LocalDateTime olusturmaTarihi;
    @PrePersist protected void onCreate() { this.olusturmaTarihi = LocalDateTime.now(); }
}
