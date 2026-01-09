package com.finansportali.backend.integration;

import com.finansportali.backend.entity.Haber;
import com.finansportali.backend.repository.HaberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.w3c.dom.*;
import javax.xml.parsers.*;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

@Service @RequiredArgsConstructor @Slf4j
public class RssHaberService {

    private final RestTemplate restTemplate;
    private final HaberRepository haberRepository;

    private static final List<String[]> RSS_KAYNAKLARI = List.of(
        new String[]{"https://www.hurriyet.com.tr/rss/ekonomi", "Hürriyet Ekonomi"},
        new String[]{"https://www.sabah.com.tr/rss/ekonomi.xml", "Sabah Ekonomi"},
        new String[]{"https://www.ntv.com.tr/ekonomi.rss", "NTV Ekonomi"},
        new String[]{"https://www.ntv.com.tr/teknoloji.rss", "NTV Teknoloji"},
        new String[]{"https://www.sabah.com.tr/rss/teknoloji.xml", "Sabah Teknoloji"},
        new String[]{"https://cointurk.com/feed", "CoinTurk"},
        new String[]{"https://kripto.ist/feed/", "Kripto.ist"},
        new String[]{"https://www.btchaber.com/feed/", "BTC Haber"}
    );

    public List<Haber> haberleriGuncelle() {
        List<Haber> kaydedilenler = new ArrayList<>();

        for (String[] kaynak : RSS_KAYNAKLARI) {
            try {
                String xml = restTemplate.getForObject(kaynak[0], String.class);
                if (xml == null || xml.isEmpty()) continue;

                List<Haber> haberler = rssParseEt(xml, kaynak[1]);
                for (Haber h : haberler) {
                    if (h.getUrl() != null && !h.getUrl().isEmpty() && haberRepository.existsByUrl(h.getUrl())) continue;
                    kaydedilenler.add(haberRepository.save(h));
                    if (kaydedilenler.size() >= 30) break;
                }
                if (kaydedilenler.size() >= 30) break;

            } catch (Exception e) {
                log.warn("[RSS] {} hatasi: {}", kaynak[1], e.getMessage());
            }
        }

        // Hiç haber çekemediyse demo haberler ekle
        if (kaydedilenler.isEmpty()) {
            kaydedilenler.addAll(demoHaberlerEkle());
        }

        log.info("[RSS] {} haber guncellendi.", kaydedilenler.size());
        return kaydedilenler;
    }

    private String kategoriTespit(String baslik, String icerik) {
        String metin = ((baslik != null ? baslik : "") + " " + (icerik != null ? icerik : "")).toLowerCase();
        if (metin.contains("bitcoin") || metin.contains("kripto") || metin.contains("ethereum") ||
                metin.contains("blockchain") || metin.contains("btc") || metin.contains("crypto") ||
                metin.contains("nft") || metin.contains("solana") || metin.contains("ripple") ||
                metin.contains("binance") || metin.contains("xrp") || metin.contains("coin")) {
            return "KRIPTO";
        }
        if (metin.contains("teknoloji") || metin.contains("yapay zeka") || metin.contains("artificial") ||
                metin.contains("yazilim") || metin.contains("siber") || metin.contains("robot") ||
                metin.contains("elektrikli arac") || metin.contains("iphone") || metin.contains("apple") ||
                metin.contains("google") || metin.contains("microsoft") || metin.contains("samsung") ||
                metin.contains("wired") || metin.contains("tesla") || metin.contains("chatgpt") ||
                metin.contains("ai ") || metin.contains(" ai") || metin.contains("bilisim")) {
            return "TEKNOLOJI";
        }
        return "EKONOMI";
    }

    private List<Haber> rssParseEt(String xml, String kaynak) {
        List<Haber> haberler = new ArrayList<>();
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            DocumentBuilder builder = factory.newDocumentBuilder();
            byte[] bytes = xml.getBytes(StandardCharsets.UTF_8);
            Document doc = builder.parse(new ByteArrayInputStream(bytes));
            NodeList items = doc.getElementsByTagName("item");

            for (int i = 0; i < Math.min(items.getLength(), 10); i++) {
                Element item = (Element) items.item(i);
                String baslik = getTagText(item, "title");
                String url    = getTagText(item, "link");
                String icerik = getTagText(item, "description");

                if (baslik == null || baslik.isEmpty()) continue;

                Haber h = new Haber();
                h.setBaslik(baslik.length() > 255 ? baslik.substring(0, 255) : baslik);
                h.setUrl(url);
                h.setIcerik(icerik != null && icerik.length() > 500 ? icerik.substring(0, 500) : icerik);
                h.setKaynak(kaynak);
                h.setKategori(kategoriTespit(baslik, icerik));
                h.setYayinTarihi(LocalDateTime.now());
                haberler.add(h);
            }
        } catch (Exception e) {
            log.warn("[RSS] Parse hatasi {}: {}", kaynak, e.getMessage());
        }
        return haberler;
    }

    private static final String[][] DEMO_HABERLER = {
        {"BIST 100 Endeksi Güne Yükselişle Başladı",
         "Borsa İstanbul'da BIST 100 endeksi bugün yüzde 0,8 artışla işlem görüyor. Yabancı yatırımcı alımları öne çıktı.",
         "EKONOMI"},
        {"TCMB Faiz Kararını Açıkladı",
         "Türkiye Cumhuriyet Merkez Bankası politika faizini beklentiler doğrultusunda sabit tuttu.",
         "EKONOMI"},
        {"THY 3. Çeyrek Karını Açıkladı",
         "Türk Hava Yolları, üçüncü çeyrek net karını önceki yıla göre yüzde 18 artırarak 2,3 milyar TL olarak açıkladı.",
         "EKONOMI"},
        {"Bitcoin 3 Milyon TL Seviyesini Aştı",
         "Kripto para piyasasının öncü varlığı Bitcoin, artan kurumsal talep ve ETF onaylarıyla yeni zirve kırdı.",
         "KRIPTO"},
        {"Dolar/TL Hareketliliği Sürüyor",
         "Küresel risk iştahındaki değişimler ve yurt içi gelişmeler Dolar/TL paritesini etkiliyor.",
         "EKONOMI"},
        {"Ethereum Güncellemesi Tamamlandı",
         "Ethereum ağının beklenen güncellemesi başarıyla uygulandı. İşlem ücretleri önemli ölçüde düştü.",
         "KRIPTO"},
        {"İstanbul'da Yapay Zeka Zirvesi",
         "Türkiye'nin lider teknoloji şirketleri İstanbul'da bir araya gelerek yapay zeka ve blockchain uygulamalarını tartıştı.",
         "TEKNOLOJI"},
        {"Garanti Bankası Temettü Açıkladı",
         "Garanti BBVA, 2024 yılı için hisse başına 5,80 TL temettü dağıtım kararı aldı.",
         "EKONOMI"},
        {"Solana İşlem Hacmi Rekor Kırdı",
         "Solana ağında günlük işlem hacmi 12 milyar doların üzerine çıkarak tarihi rekor kırdı.",
         "KRIPTO"},
        {"Ford Otosan Elektrikli Araç Yatırımını Duyurdu",
         "Ford Otosan, Türkiye'deki elektrikli araç üretim kapasitesini artırmak için 1,5 milyar Euro yatırım yapacağını açıkladı.",
         "TEKNOLOJI"},
        {"Aselsan Yeni Sözleşme İmzaladı",
         "Aselsan, Savunma Sanayii Başkanlığı ile 2,1 milyar TL değerinde yeni sistem tedarik sözleşmesi imzaladı.",
         "EKONOMI"},
        {"BNB Zincirinde Yeni Güncelleme",
         "Binance'ın BNB zincirinde gerçekleştirilen güncelleme ile işlem hızı ve güvenlik iyileştirildi.",
         "KRIPTO"},
        {"IMF Türkiye Büyüme Tahminini Artırdı",
         "Uluslararası Para Fonu, Türkiye'nin yıl sonu büyüme tahminini yüzde 4,2'den 4,7'ye yükseltti.",
         "EKONOMI"},
        {"Samsung Galaxy AI Özellikleri Türkiye'de",
         "Samsung'un yapay zeka destekli yeni telefon serisi Türkiye'de satışa sunuldu. Fiyatlar açıklandı.",
         "TEKNOLOJI"},
        {"Koç Holding Çeyrek Bilançosu Beklentileri Aştı",
         "Koç Holding 2024 yılı üçüncü çeyrek konsolide net karı analist tahminlerini yüzde 12 aştı.",
         "EKONOMI"},
    };

    private List<Haber> demoHaberlerEkle() {
        List<Haber> eklenenler = new ArrayList<>();
        LocalDateTime simdi = LocalDateTime.now();
        for (int i = 0; i < DEMO_HABERLER.length; i++) {
            String[] d = DEMO_HABERLER[i];
            String url = "https://demo.finans.portali/" + (i + 1);
            if (haberRepository.existsByUrl(url)) continue;
            Haber h = new Haber();
            h.setBaslik(d[0]);
            h.setIcerik(d[1]);
            h.setKaynak("Finans Portalı");
            h.setUrl(url);
            h.setKategori(d[2]);
            h.setYayinTarihi(simdi.minusHours(i * 2L));
            eklenenler.add(haberRepository.save(h));
        }
        return eklenenler;
    }

    private String getTagText(Element parent, String tagName) {
        NodeList nodes = parent.getElementsByTagName(tagName);
        if (nodes.getLength() == 0) return null;
        return nodes.item(0).getTextContent().trim();
    }
}
