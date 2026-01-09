package com.finansportali.backend.dto;
import com.finansportali.backend.entity.EnstrumanTipi;
import lombok.*;
import java.time.LocalDateTime;
public class YatirimAraciDto {
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class Request {
        private String sembol; private String ad; private EnstrumanTipi tip; private Boolean aktifMi;
    }
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class Response {
        private Long id; private String sembol; private String ad; private EnstrumanTipi tip; private Boolean aktifMi; private LocalDateTime guncellemeTarihi;
    }
}
