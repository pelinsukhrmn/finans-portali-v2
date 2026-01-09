package com.finansportali.backend.exception;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.*;

/**
 * GlobalExceptionHandler birim testleri.
 * HTTP durum kodlarının ve hata mesajlarının doğruluğunu kontrol eder.
 */
class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("handleNotFound — 404 NOT_FOUND döner")
    void handleNotFound_404StatusDoner() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Portfoy", "id", 5L);

        ResponseEntity<ApiErrorResponse> response = handler.handleNotFound(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo(404);
        assertThat(response.getBody().getMessage()).contains("Portfoy");
    }

    @Test
    @DisplayName("handleDuplicate — 409 CONFLICT döner")
    void handleDuplicate_409StatusDoner() {
        DuplicateResourceException ex = new DuplicateResourceException("YatirimAraci", "sembol", "THYAO");

        ResponseEntity<ApiErrorResponse> response = handler.handleDuplicate(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo(409);
        assertThat(response.getBody().getMessage()).contains("THYAO");
    }

    @Test
    @DisplayName("handleGeneral — 500 INTERNAL_SERVER_ERROR döner")
    void handleGeneral_500StatusDoner() {
        Exception ex = new RuntimeException("Beklenmeyen hata");

        ResponseEntity<ApiErrorResponse> response = handler.handleGeneral(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo(500);
    }

    @Test
    @DisplayName("handleNotFound — hata zamanı null değil")
    void handleNotFound_zamanNull_degil() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Test", "id", 1L);

        ResponseEntity<ApiErrorResponse> response = handler.handleNotFound(ex);

        assertThat(response.getBody().getTimestamp()).isNotNull();
    }

    @Test
    @DisplayName("ResourceNotFoundException — doğru mesaj formatı")
    void resourceNotFoundException_mesajFormati() {
        ResourceNotFoundException ex = new ResourceNotFoundException("PiyasaVerisi", "araciId", 42L);
        assertThat(ex.getMessage()).contains("PiyasaVerisi", "araciId", "42");
    }

    @Test
    @DisplayName("DuplicateResourceException — doğru mesaj formatı")
    void duplicateResourceException_mesajFormati() {
        DuplicateResourceException ex = new DuplicateResourceException("Kullanici", "eposta", "test@test.com");
        assertThat(ex.getMessage()).contains("Kullanici", "eposta", "test@test.com");
    }
}
