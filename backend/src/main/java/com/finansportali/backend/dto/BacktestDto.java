package com.finansportali.backend.dto;

import lombok.*;
import java.util.List;
import java.util.Map;

public class BacktestDto {

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class Request {
        private Long araciId;
        private String strateji; // MA_KESISIM, RSI, MACD
        private Map<String, Double> parametreler;
        private String baslangicTarihi; // YYYY-MM-DD
        private String bitisTarihi;
        private double baslangicSermayesi;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class Response {
        private List<Islem> islemler;
        private List<PortfoyNokta> portfoyDegerleri;
        private double toplamGetiriYuzde;
        private double toplamGetiriTL;
        private double maxDusus;
        private double kazanmaOrani;
        private int toplamIslem;
        private int kazananIslem;
        private int kaybettirenIslem;
        private double sharpeOrani;
        private double baslangicSermayesi;
        private double bitisSermayesi;
        private String sembol;
        private String strateji;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class Islem {
        private String tarih;
        private String tur; // AL or SAT
        private double fiyat;
        private double miktar;
        private double deger;
        private Double karZarar;
        private Double karZararYuzde;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class PortfoyNokta {
        private String tarih;
        private double deger;
        private String isaret; // AL, SAT, or null
    }
}
