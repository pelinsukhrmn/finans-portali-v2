package com.finansportali.backend.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Kullanıcı portföyü. Birden fazla {@link PortfoyVarligi} içerebilir.
 * Her kullanıcı aynı isimde iki portföy oluşturamaz.
 */
@Entity @Table(name = "portfoyler")
@Data @NoArgsConstructor @AllArgsConstructor
public class Portfoy {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "kullanici_id", nullable = false) private Kullanici kullanici;
    @Column(length = 100, nullable = false) private String ad;
    @OneToMany(mappedBy = "portfoy", cascade = CascadeType.ALL, orphanRemoval = true) private List<PortfoyVarligi> varliklar = new ArrayList<>();
    @Column(name = "olusturma_tarihi", updatable = false) private LocalDateTime olusturmaTarihi;
    @Column(name = "guncelleme_tarihi") private LocalDateTime guncellemeTarihi;
    @PrePersist protected void onCreate() { this.olusturmaTarihi = LocalDateTime.now(); this.guncellemeTarihi = LocalDateTime.now(); }
    @PreUpdate protected void onUpdate() { this.guncellemeTarihi = LocalDateTime.now(); }
}
