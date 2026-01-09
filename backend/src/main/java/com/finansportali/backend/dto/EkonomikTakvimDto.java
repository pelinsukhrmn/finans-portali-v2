package com.finansportali.backend.dto;

import lombok.*;
import java.time.LocalDateTime;

public class EkonomikTakvimDto {

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class Response {
        private Long id;
        private String ulke;
        private String olay;
        private int onemDerecesi;
        private String aciklananDeger;
        private String beklenti;
        private String oncekiDeger;
        private String tarih;
        private String saat;
        private boolean gerceklesti;
        private String sonucDurumu; // YUKARI, ASAGI, NÖTR, null
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class Request {
        private String ulke;
        private String olay;
        private int onemDerecesi;
        private String aciklananDeger;
        private String beklenti;
        private String oncekiDeger;
        private LocalDateTime zaman;
    }
}
