package com.finansportali.backend.service;

import com.finansportali.backend.dto.PiyasaVerisiDto;
import com.finansportali.backend.entity.*;
import com.finansportali.backend.exception.ResourceNotFoundException;
import com.finansportali.backend.repository.PiyasaVerisiRepository;
import com.finansportali.backend.repository.YatirimAraciRepository;
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
 * PiyasaVerisiService birim testleri.
 */
@ExtendWith(MockitoExtension.class)
class PiyasaVerisiServiceTest {

    @Mock
    private PiyasaVerisiRepository repository;

    @Mock
    private YatirimAraciRepository araciRepository;

    @InjectMocks
    private PiyasaVerisiService service;

    private YatirimAraci thyao;
    private PiyasaVerisi piyasaVerisi;

    @BeforeEach
    void setUp() {
        thyao = new YatirimAraci();
        thyao.setId(1L);
        thyao.setSembol("THYAO");
        thyao.setAd("Türk Hava Yolları");
        thyao.setTip(EnstrumanTipi.HISSE);
        thyao.setAktifMi(true);

        piyasaVerisi = new PiyasaVerisi();
        piyasaVerisi.setId(10L);
        piyasaVerisi.setYatirimAraci(thyao);
        piyasaVerisi.setFiyat(new BigDecimal("350.50"));
        piyasaVerisi.setAcilis(new BigDecimal("340.00"));
        piyasaVerisi.setEnYuksek(new BigDecimal("355.00"));
        piyasaVerisi.setEnDusuk(new BigDecimal("338.00"));
        piyasaVerisi.setHacim(1_500_000L);
        piyasaVerisi.setVeriZamani(LocalDateTime.now());
    }

    @Test
    @DisplayName("sonFiyatGetir — mevcut araç için son fiyatı döner")
    void sonFiyatGetir_mevcutAraci_sonFiyatDoner() {
        when(repository.findTopByYatirimAraciIdOrderByVeriZamaniDesc(1L))
            .thenReturn(Optional.of(piyasaVerisi));

        PiyasaVerisiDto.Response result = service.sonFiyatGetir(1L);

        assertThat(result.getFiyat()).isEqualByComparingTo("350.50");
        assertThat(result.getSembol()).isEqualTo("THYAO");
    }

    @Test
    @DisplayName("sonFiyatGetir — kayıt yoksa ResourceNotFoundException fırlatır")
    void sonFiyatGetir_kayitYok_exceptionFirlatir() {
        when(repository.findTopByYatirimAraciIdOrderByVeriZamaniDesc(99L))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.sonFiyatGetir(99L))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("sonFiyatGetir — değişim yüzdesi doğru hesaplanır")
    void sonFiyatGetir_degisimYuzdeHesaplama() {
        // Açılış 340, güncel 350.50 → %3.09 artış
        when(repository.findTopByYatirimAraciIdOrderByVeriZamaniDesc(1L))
            .thenReturn(Optional.of(piyasaVerisi));

        PiyasaVerisiDto.Response result = service.sonFiyatGetir(1L);

        assertThat(result.getDegisimYuzde()).isNotNull();
        assertThat(result.getDegisimYuzde()).isGreaterThan(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("ekle — geçerli araç ID ile veri kaydeder")
    void ekle_gecerliAraci_veriKaydeder() {
        PiyasaVerisiDto.Request req = new PiyasaVerisiDto.Request();
        req.setYatirimAraciId(1L);
        req.setFiyat(new BigDecimal("360.00"));
        req.setAcilis(new BigDecimal("350.00"));
        req.setHacim(2_000_000L);

        when(araciRepository.findById(1L)).thenReturn(Optional.of(thyao));
        when(repository.save(any())).thenReturn(piyasaVerisi);

        PiyasaVerisiDto.Response result = service.ekle(req);

        assertThat(result).isNotNull();
        verify(repository).save(any(PiyasaVerisi.class));
    }

    @Test
    @DisplayName("ekle — bulunamayan araç için ResourceNotFoundException fırlatır")
    void ekle_bulunamayanAraci_exceptionFirlatir() {
        PiyasaVerisiDto.Request req = new PiyasaVerisiDto.Request();
        req.setYatirimAraciId(99L);
        req.setFiyat(new BigDecimal("100.00"));

        when(araciRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.ekle(req))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("getGuncelFiyat — kayıt varsa fiyatı döner")
    void getGuncelFiyat_kayitVar_fiyatDoner() {
        when(repository.findTopByYatirimAraciIdOrderByVeriZamaniDesc(1L))
            .thenReturn(Optional.of(piyasaVerisi));

        BigDecimal fiyat = service.getGuncelFiyat(1L);

        assertThat(fiyat).isEqualByComparingTo("350.50");
    }

    @Test
    @DisplayName("getGuncelFiyat — kayıt yoksa ZERO döner")
    void getGuncelFiyat_kayitYok_zeroDoner() {
        when(repository.findTopByYatirimAraciIdOrderByVeriZamaniDesc(1L))
            .thenReturn(Optional.empty());

        BigDecimal fiyat = service.getGuncelFiyat(1L);

        assertThat(fiyat).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("tarihselVeriGetir — belirli tarih aralığı için doğru veriyi döner")
    void tarihselVeriGetir_tarihAraligi_dogruVeriDoner() {
        LocalDateTime bas = LocalDateTime.now().minusDays(7);
        LocalDateTime bit = LocalDateTime.now();

        when(repository.findByYatirimAraciIdAndVeriZamaniBetweenOrderByVeriZamaniAsc(
            eq(1L), any(), any()))
            .thenReturn(List.of(piyasaVerisi));

        List<PiyasaVerisiDto.Response> result = service.tarihselVeriGetir(1L, bas, bit);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getSembol()).isEqualTo("THYAO");
    }
}
