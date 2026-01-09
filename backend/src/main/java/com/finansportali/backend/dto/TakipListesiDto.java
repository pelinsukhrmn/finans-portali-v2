package com.finansportali.backend.dto;
import com.finansportali.backend.entity.EnstrumanTipi;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
public class TakipListesiDto {
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class Request { private Long yatirimAraciId; }
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class Response {
        private Long id; private Long yatirimAraciId; private String sembol; private String enstrumanAdi;
        private EnstrumanTipi tip; private BigDecimal guncelFiyat; private BigDecimal degisimYuzde; private LocalDateTime eklemeTarihi;
    }
}
