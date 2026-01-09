package com.finansportali.backend.dto;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
public class PortfoyDto {
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class Request { private String ad; }
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class OzetResponse {
        private Long id; private String ad; private BigDecimal toplamDeger; private BigDecimal toplamMaliyet;
        private BigDecimal nominalGetiri; private BigDecimal nominalGetiriYuzde; private int varlikSayisi; private LocalDateTime guncellemeTarihi;
    }
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class DetayResponse {
        private Long id; private String ad; private BigDecimal toplamDeger; private BigDecimal toplamMaliyet;
        private BigDecimal nominalGetiri; private BigDecimal nominalGetiriYuzde; private BigDecimal reelGetiri;
        private BigDecimal portfoyBeta; private List<VarlikResponse> varliklar; private LocalDateTime olusturmaTarihi; private LocalDateTime guncellemeTarihi;
    }
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class VarlikRequest {
        private Long yatirimAraciId; private BigDecimal miktar; private BigDecimal ortalamaMaliyet; private LocalDateTime alisTarihi;
    }
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class VarlikResponse {
        private Long id; private Long yatirimAraciId; private String sembol; private String enstrumanAdi;
        private BigDecimal miktar; private BigDecimal ortalamaMaliyet; private BigDecimal guncelFiyat;
        private BigDecimal nominalKarZarar; private BigDecimal reelKarZarar; private BigDecimal agirlik; private BigDecimal beta; private String risk;
    }
}
