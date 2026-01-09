package com.finansportali.backend.dto;
import lombok.*;
import java.time.LocalDateTime;
public class HaberDto {
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class Request {
        private String baslik; private String icerik; private String kaynak; private String url; private String kategori; private LocalDateTime yayinTarihi;
    }
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class Response {
        private Long id; private String baslik; private String icerik; private String kaynak; private String url; private String kategori; private LocalDateTime yayinTarihi;
    }
}
