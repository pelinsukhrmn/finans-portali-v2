package com.finansportali.backend.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
@Entity @Table(name = "ekonomik_takvim")
@Data @NoArgsConstructor @AllArgsConstructor
public class EkonomikTakvim {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(length = 50) private String ulke;
    @Column(length = 255) private String olay;
    @Column(name = "onem_derecesi") private Integer onemDerecesi;
    @Column(name = "aciklanan_deger", length = 50) private String aciklananDeger;
    @Column(length = 50) private String beklenti;
    @Column(name = "onceki_deger", length = 50) private String oncekiDeger;
    private LocalDateTime zaman;
}
