package com.finansportali.backend.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
@Entity @Table(name = "haberler")
@Data @NoArgsConstructor @AllArgsConstructor
public class Haber {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(length = 255, nullable = false) private String baslik;
    @Column(columnDefinition = "TEXT") private String icerik;
    @Column(length = 100) private String kaynak;
    @Column(length = 500) private String url;
    @Column(length = 50) private String kategori;
    @Column(name = "yayin_tarihi") private LocalDateTime yayinTarihi;
    @Column(name = "kayit_tarihi") private LocalDateTime kayitTarihi;
    @PrePersist protected void onCreate() { this.kayitTarihi = LocalDateTime.now(); }
}
