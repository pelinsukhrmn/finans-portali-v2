package com.finansportali.backend.dto;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
public class FiyatAlarmiDto {
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class Request { private Long yatirimAraciId; private BigDecimal hedefFiyat; private String yon; }
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class Response {
        private Long id; private Long yatirimAraciId; private String sembol; private String enstrumanAdi;
        private BigDecimal hedefFiyat; private BigDecimal guncelFiyat; private String yon;
        private Boolean aktifMi; private Boolean tetiklendiMi; private LocalDateTime olusturmaTarihi;
    }
}
