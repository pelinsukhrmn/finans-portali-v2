package com.finansportali.backend.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalTime;
@Entity @Table(name = "borsalar")
@Data @NoArgsConstructor @AllArgsConstructor
public class Borsa {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(length = 20, nullable = false, unique = true) private String kod;
    @Column(length = 100) private String ad;
    @Column(name = "acilis_saati") private LocalTime acilisSaati;
    @Column(name = "kapanis_saati") private LocalTime kapanisSaati;
    @Column(length = 50) private String timezone;
}
