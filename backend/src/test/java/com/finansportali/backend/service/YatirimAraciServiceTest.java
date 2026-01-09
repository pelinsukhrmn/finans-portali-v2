package com.finansportali.backend.service;

import com.finansportali.backend.dto.YatirimAraciDto;
import com.finansportali.backend.entity.EnstrumanTipi;
import com.finansportali.backend.entity.YatirimAraci;
import com.finansportali.backend.exception.DuplicateResourceException;
import com.finansportali.backend.exception.ResourceNotFoundException;
import com.finansportali.backend.repository.YatirimAraciRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * YatirimAraciService birim testleri.
 * Repository katmanı Mockito ile stub'lanır.
 */
@ExtendWith(MockitoExtension.class)
class YatirimAraciServiceTest {

    @Mock
    private YatirimAraciRepository repository;

    @InjectMocks
    private YatirimAraciService service;

    private YatirimAraci hisse;

    @BeforeEach
    void setUp() {
        hisse = new YatirimAraci();
        hisse.setId(1L);
        hisse.setSembol("THYAO");
        hisse.setAd("Türk Hava Yolları");
        hisse.setTip(EnstrumanTipi.HISSE);
        hisse.setAktifMi(true);
    }

    @Test
    @DisplayName("tumunuGetir — tüm araçları döner")
    void tumunuGetir_tumListeDoner() {
        when(repository.findAll()).thenReturn(List.of(hisse));

        List<YatirimAraciDto.Response> result = service.tumunuGetir();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getSembol()).isEqualTo("THYAO");
    }

    @Test
    @DisplayName("idIleGetir — mevcut ID ile doğru aracı döner")
    void idIleGetir_mevcutId_aracDoner() {
        when(repository.findById(1L)).thenReturn(Optional.of(hisse));

        YatirimAraciDto.Response result = service.idIleGetir(1L);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getSembol()).isEqualTo("THYAO");
    }

    @Test
    @DisplayName("idIleGetir — bulunamayan ID için ResourceNotFoundException fırlatır")
    void idIleGetir_bulunamayanId_exceptionFirlatir() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.idIleGetir(99L))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("99");
    }

    @Test
    @DisplayName("sembolIleGetir — doğru sembolle aracı döner")
    void sembolIleGetir_dogruSembol_aracDoner() {
        when(repository.findBySembol("THYAO")).thenReturn(Optional.of(hisse));

        YatirimAraciDto.Response result = service.sembolIleGetir("THYAO");

        assertThat(result.getSembol()).isEqualTo("THYAO");
        assertThat(result.getTip()).isEqualTo(EnstrumanTipi.HISSE);
    }

    @Test
    @DisplayName("sembolIleGetir — bulunamayan sembol için ResourceNotFoundException fırlatır")
    void sembolIleGetir_bulunamayanSembol_exceptionFirlatir() {
        when(repository.findBySembol("YOK")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.sembolIleGetir("YOK"))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("ekle — yeni benzersiz sembol ile aracı kaydeder")
    void ekle_yeniSembol_kaydeder() {
        YatirimAraciDto.Request req = new YatirimAraciDto.Request("AKBNK", "Akbank", EnstrumanTipi.HISSE, true);
        YatirimAraci kayitli = new YatirimAraci();
        kayitli.setId(2L);
        kayitli.setSembol("AKBNK");
        kayitli.setAd("Akbank");
        kayitli.setTip(EnstrumanTipi.HISSE);
        kayitli.setAktifMi(true);

        when(repository.existsBySembol("AKBNK")).thenReturn(false);
        when(repository.save(any())).thenReturn(kayitli);

        YatirimAraciDto.Response result = service.ekle(req);

        assertThat(result.getSembol()).isEqualTo("AKBNK");
        verify(repository).save(any(YatirimAraci.class));
    }

    @Test
    @DisplayName("ekle — mevcut sembol için DuplicateResourceException fırlatır")
    void ekle_mevcutSembol_exceptionFirlatir() {
        YatirimAraciDto.Request req = new YatirimAraciDto.Request("THYAO", "THY", EnstrumanTipi.HISSE, true);
        when(repository.existsBySembol("THYAO")).thenReturn(true);

        assertThatThrownBy(() -> service.ekle(req))
            .isInstanceOf(DuplicateResourceException.class);

        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("sil — mevcut araç başarıyla silinir")
    void sil_mevcutAraci_siler() {
        when(repository.findById(1L)).thenReturn(Optional.of(hisse));

        service.sil(1L);

        verify(repository).delete(hisse);
    }

    @Test
    @DisplayName("tipeGoreGetir — HISSE tipinde araçları filtreler")
    void tipeGoreGetir_hisseTipi_filtreliListeDoner() {
        when(repository.findByTip(EnstrumanTipi.HISSE)).thenReturn(List.of(hisse));

        List<YatirimAraciDto.Response> result = service.tipeGoreGetir(EnstrumanTipi.HISSE);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTip()).isEqualTo(EnstrumanTipi.HISSE);
    }
}
