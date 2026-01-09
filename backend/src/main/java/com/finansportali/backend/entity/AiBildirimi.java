package com.finansportali.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_bildirimler")
@Data @NoArgsConstructor @AllArgsConstructor
public class AiBildirimi {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kullanici_id", nullable = false)
    private Kullanici kullanici;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "haber_id")
    private Haber haber;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String mesaj;

    @Column(name = "haber_baslik", length = 255)
    private String haberBaslik;

    @Column(name = "etkilenen_semboller", length = 500)
    private String etkilenenSemboller;

    @Column(name = "etki_yonu", length = 20)
    private String etkiYonu;

    @Column(nullable = false)
    private boolean okundu = false;

    @Column(name = "olusturma_tarihi", updatable = false)
    private LocalDateTime olusturmaTarihi;

    @PrePersist
    protected void onCreate() { this.olusturmaTarihi = LocalDateTime.now(); }
}
