package com.finansportali.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "bildirim_ayarlari")
@Data @NoArgsConstructor @AllArgsConstructor
public class BildirimAyari {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kullanici_id", nullable = false)
    private Kullanici kullanici;

    @Column(nullable = false)
    private boolean aktif = true;

    @Column(name = "email_aktif", nullable = false)
    private boolean emailAktif = true;

    @Column(name = "hisse_takip", nullable = false)
    private boolean hisseTakip = true;

    @Column(name = "doviz_takip", nullable = false)
    private boolean dovizTakip = false;

    @Column(name = "kripto_takip", nullable = false)
    private boolean kriptoTakip = false;
}
