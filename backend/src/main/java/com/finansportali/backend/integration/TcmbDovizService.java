package com.finansportali.backend.integration;
import com.finansportali.backend.entity.*;
import com.finansportali.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.w3c.dom.*;
import javax.xml.parsers.*;
import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
@Service @RequiredArgsConstructor @Slf4j
public class TcmbDovizService {
    private final RestTemplate restTemplate;
    private final YatirimAraciRepository yatirimAraciRepository;
    private final PiyasaVerisiRepository piyasaVerisiRepository;
    @Value("${finans.api.tcmb.url}") private String tcmbUrl;
    public List<PiyasaVerisi> kurlariGuncelle() {
        List<PiyasaVerisi> kaydedilenler = new ArrayList<>();
        try {
            // Read raw bytes to avoid Spring's default Latin-1 decoding of XML responses
            byte[] xmlBytes = restTemplate.getForObject(tcmbUrl, byte[].class);
            if (xmlBytes == null || xmlBytes.length == 0) return kaydedilenler;
            String xml = new String(xmlBytes, StandardCharsets.UTF_8);
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)));
            NodeList currencies = doc.getElementsByTagName("Currency");
            for (int i = 0; i < currencies.getLength(); i++) {
                Element currency = (Element) currencies.item(i);
                String kod = currency.getAttribute("Kod");
                String isim = getElementText(currency, "Isim");
                String forexBuyingStr = getElementText(currency, "ForexBuying");
                String forexSellingStr = getElementText(currency, "ForexSelling");
                if (forexBuyingStr == null || forexBuyingStr.isEmpty()) continue;
                try {
                    BigDecimal alis = new BigDecimal(forexBuyingStr);
                    BigDecimal satis = new BigDecimal(forexSellingStr);
                    BigDecimal fiyat = alis.add(satis).divide(BigDecimal.valueOf(2), 4, BigDecimal.ROUND_HALF_UP);
                    String sembol = kod + "/TRY";
                    YatirimAraci araci = yatirimAraciRepository.findBySembol(sembol).orElseGet(() -> {
                        YatirimAraci yeni = new YatirimAraci();
                        yeni.setSembol(sembol); yeni.setTip(EnstrumanTipi.DOVIZ); yeni.setAktifMi(true);
                        return yeni;
                    });
                    araci.setAd(isim);
                    araci = yatirimAraciRepository.save(araci);
                    PiyasaVerisi veri = new PiyasaVerisi();
                    veri.setYatirimAraci(araci); veri.setFiyat(fiyat);
                    veri.setEnYuksek(satis); veri.setEnDusuk(alis); veri.setAcilis(alis);
                    veri.setVeriZamani(LocalDateTime.now());
                    kaydedilenler.add(piyasaVerisiRepository.save(veri));
                } catch (NumberFormatException e) { log.warn("Kur parse hatasi: {}", kod); }
            }
        } catch (Exception e) { log.error("TCMB hata: {}", e.getMessage(), e); }
        return kaydedilenler;
    }
    private String getElementText(Element parent, String tagName) {
        NodeList nodes = parent.getElementsByTagName(tagName);
        return nodes.getLength() > 0 ? nodes.item(0).getTextContent().trim() : null;
    }
}
