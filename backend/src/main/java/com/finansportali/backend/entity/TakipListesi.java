package com.finansportali.backend.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
@Entity @Table(name = "takip_listeleri", uniqueConstraints = { @UniqueConstraint(columnNames = {"kullanici_id", "yatirim_araci_id"}) })
@Data @NoArgsConstructor @AllArgsConstructor
public class TakipListesi {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "kullanici_id", nullable = false) private Kullanici kullanici;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "yatirim_araci_id", nullable = false) private YatirimAraci yatirimAraci;
    @Column(name = "ekleme_tarihi", updatable = false) private LocalDateTime eklemeTarihi;
    @PrePersist protected void onCreate() { this.eklemeTarihi = LocalDateTime.now(); }
}
