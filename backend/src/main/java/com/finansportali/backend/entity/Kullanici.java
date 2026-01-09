package com.finansportali.backend.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
@Entity @Table(name = "kullanicilar")
@Data @NoArgsConstructor @AllArgsConstructor
public class Kullanici {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "keycloak_id", nullable = false, unique = true) private String keycloakId;
    @Column(length = 255, nullable = false, unique = true) private String eposta;
    @Column(name = "ad_soyad", length = 255) private String adSoyad;
    @Column(length = 50) private String rol;
    @Column(name = "olusturma_tarihi", updatable = false) private LocalDateTime olusturmaTarihi;
    @PrePersist protected void onCreate() { this.olusturmaTarihi = LocalDateTime.now(); }
}
