package com.finansportali.backend.dto;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
public class PiyasaVerisiDto {
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class Request {
        private Long yatirimAraciId; private BigDecimal fiyat; private Long hacim;
        private BigDecimal enYuksek; private BigDecimal enDusuk; private BigDecimal acilis; private LocalDateTime veriZamani;
    }
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class Response {
        private Long id; private Long yatirimAraciId; private String sembol; private String enstrumanAdi;
        private BigDecimal fiyat; private Long hacim; private BigDecimal enYuksek; private BigDecimal enDusuk;
        private BigDecimal acilis; private BigDecimal degisim; private BigDecimal degisimYuzde; private LocalDateTime veriZamani;
    }
}
