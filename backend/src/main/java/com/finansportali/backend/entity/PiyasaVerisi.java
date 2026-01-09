package com.finansportali.backend.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Entity @Table(name = "piyasa_verileri", indexes = { @Index(name = "idx_piyasa_araci_zaman", columnList = "yatirim_araci_id, veri_zamani") })
@Data @NoArgsConstructor @AllArgsConstructor
public class PiyasaVerisi {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "yatirim_araci_id", nullable = false) private YatirimAraci yatirimAraci;
    @Column(nullable = false, precision = 19, scale = 4) private BigDecimal fiyat;
    private Long hacim;
    @Column(name = "en_yuksek", precision = 19, scale = 4) private BigDecimal enYuksek;
    @Column(name = "en_dusuk", precision = 19, scale = 4) private BigDecimal enDusuk;
    @Column(name = "acilis", precision = 19, scale = 4) private BigDecimal acilis;
    @Column(name = "veri_zamani", nullable = false) private LocalDateTime veriZamani;
    @Column(name = "kayit_tarihi") private LocalDateTime kayitTarihi;
    @PrePersist protected void onCreate() { this.kayitTarihi = LocalDateTime.now(); }
}
