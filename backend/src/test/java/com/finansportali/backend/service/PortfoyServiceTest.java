package com.finansportali.backend.service;

import com.finansportali.backend.dto.PortfoyDto;
import com.finansportali.backend.entity.*;
import com.finansportali.backend.exception.DuplicateResourceException;
import com.finansportali.backend.exception.ResourceNotFoundException;
import com.finansportali.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * PortfoyService birim testleri.
 */
@ExtendWith(MockitoExtension.class)
class PortfoyServiceTest {

    @Mock private PortfoyRepository portfoyRepository;
    @Mock private PortfoyVarligiRepository varlikRepository;
    @Mock private KullaniciRepository kullaniciRepository;
    @Mock private YatirimAraciService yatirimAraciService;
    @Mock private PiyasaVerisiService piyasaVerisiService;

    @InjectMocks
    private PortfoyService service;

    private Kullanici kullanici;
    private Portfoy portfoy;

    @BeforeEach
    void setUp() {
        kullanici = new Kullanici();
        kullanici.setId(1L);
        kullanici.setKeycloakId("kc-uuid-123");
        kullanici.setEposta("test@finans.local");
        kullanici.setAdSoyad("Test Kullanici");
        kullanici.setRol("USER");

        portfoy = new Portfoy();
        portfoy.setId(10L);
        portfoy.setKullanici(kullanici);
        portfoy.setAd("Ana Portföyüm");
        portfoy.setOlusturmaTarihi(LocalDateTime.now());
        portfoy.setGuncellemeTarihi(LocalDateTime.now());
    }

    @Test
    @DisplayName("olustur — yeni portföy kullanıcıya bağlı kaydedilir")
    void olustur_yeniPortfoy_kaydedilir() {
        PortfoyDto.Request req = new PortfoyDto.Request("Ana Portföyüm");

        when(kullaniciRepository.findById(1L)).thenReturn(Optional.of(kullanici));
        when(portfoyRepository.existsByKullaniciIdAndAd(1L, "Ana Portföyüm")).thenReturn(false);
        when(portfoyRepository.save(any())).thenReturn(portfoy);
        when(varlikRepository.findByPortfoyId(10L)).thenReturn(List.of());
        when(piyasaVerisiService.getGuncelFiyat(any())).thenReturn(BigDecimal.ZERO);

        PortfoyDto.OzetResponse result = service.olustur(1L, req);

        assertThat(result.getId()).isEqualTo(10L);
        assertThat(result.getAd()).isEqualTo("Ana Portföyüm");
        verify(portfoyRepository).save(any(Portfoy.class));
    }

    @Test
    @DisplayName("olustur — kullanıcı bulunamazsa ResourceNotFoundException fırlatır")
    void olustur_kullaniciBulunamaz_exceptionFirlatir() {
        when(kullaniciRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.olustur(99L, new PortfoyDto.Request("Test")))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("olustur — aynı isimde portföy varsa DuplicateResourceException fırlatır")
    void olustur_aynıIsim_exceptionFirlatir() {
        when(kullaniciRepository.findById(1L)).thenReturn(Optional.of(kullanici));
        when(portfoyRepository.existsByKullaniciIdAndAd(1L, "Ana Portföyüm")).thenReturn(true);

        assertThatThrownBy(() -> service.olustur(1L, new PortfoyDto.Request("Ana Portföyüm")))
            .isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    @DisplayName("kullanicininPortfoyleri — kullanıcıya ait portföyleri döner")
    void kullanicininPortfoyleri_portfoylerDoner() {
        when(portfoyRepository.findByKullaniciId(1L)).thenReturn(List.of(portfoy));
        when(varlikRepository.findByPortfoyId(10L)).thenReturn(List.of());

        List<PortfoyDto.OzetResponse> result = service.kullanicininPortfoyleri(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getAd()).isEqualTo("Ana Portföyüm");
    }

    @Test
    @DisplayName("sil — mevcut portföy başarıyla silinir")
    void sil_mevcutPortfoy_silinir() {
        when(portfoyRepository.findById(10L)).thenReturn(Optional.of(portfoy));

        service.sil(10L);

        verify(portfoyRepository).delete(portfoy);
    }

    @Test
    @DisplayName("sil — bulunamayan portföy için ResourceNotFoundException fırlatır")
    void sil_bulunamayanPortfoy_exceptionFirlatir() {
        when(portfoyRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.sil(99L))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("portfoyDetay — toplam değer ve maliyet doğru hesaplanır")
    void portfoyDetay_hesaplamalar_dogruYapilir() {
        YatirimAraci araci = new YatirimAraci();
        araci.setId(1L);
        araci.setSembol("THYAO");

        PortfoyVarligi varlik = new PortfoyVarligi();
        varlik.setId(1L);
        varlik.setYatirimAraci(araci);
        varlik.setMiktar(new BigDecimal("100"));
        varlik.setOrtalamaMaliyet(new BigDecimal("300"));

        when(portfoyRepository.findById(10L)).thenReturn(Optional.of(portfoy));
        when(varlikRepository.findByPortfoyId(10L)).thenReturn(List.of(varlik));
        when(piyasaVerisiService.getGuncelFiyat(1L)).thenReturn(new BigDecimal("350"));

        PortfoyDto.DetayResponse result = service.portfoyDetay(10L);

        // toplam değer = 100 * 350 = 35000
        assertThat(result.getToplamDeger()).isEqualByComparingTo("35000");
        // toplam maliyet = 100 * 300 = 30000
        assertThat(result.getToplamMaliyet()).isEqualByComparingTo("30000");
        // nominal getiri = 35000 - 30000 = 5000
        assertThat(result.getNominalGetiri()).isEqualByComparingTo("5000");
    }
}
