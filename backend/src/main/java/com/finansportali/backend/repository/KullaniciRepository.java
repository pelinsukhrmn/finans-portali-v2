package com.finansportali.backend.repository;
import com.finansportali.backend.entity.Kullanici;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
@Repository
public interface KullaniciRepository extends JpaRepository<Kullanici, Long> {
    Optional<Kullanici> findByKeycloakId(String keycloakId);
    Optional<Kullanici> findByEposta(String eposta);
}
