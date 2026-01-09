package com.finansportali.backend.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Entity @Table(name = "portfoy_varliklari", uniqueConstraints = { @UniqueConstraint(columnNames = {"portfoy_id", "yatirim_araci_id"}) })
@Data @NoArgsConstructor @AllArgsConstructor
public class PortfoyVarligi {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "portfoy_id", nullable = false) private Portfoy portfoy;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "yatirim_araci_id", nullable = false) private YatirimAraci yatirimAraci;
    @Column(nullable = false, precision = 19, scale = 4) private BigDecimal miktar;
    @Column(name = "ortalama_maliyet", nullable = false, precision = 19, scale = 4) private BigDecimal ortalamaMaliyet;
    @Column(name = "alis_tarihi") private LocalDateTime alisTarihi;
    @Column(name = "olusturma_tarihi", updatable = false) private LocalDateTime olusturmaTarihi;
    @Column(name = "guncelleme_tarihi") private LocalDateTime guncellemeTarihi;
    @PrePersist protected void onCreate() { this.olusturmaTarihi = LocalDateTime.now(); this.guncellemeTarihi = LocalDateTime.now(); }
    @PreUpdate protected void onUpdate() { this.guncellemeTarihi = LocalDateTime.now(); }
}
