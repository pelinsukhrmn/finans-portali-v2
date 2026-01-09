package com.finansportali.backend.repository;

import com.finansportali.backend.entity.BildirimAyari;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BildirimAyariRepository extends JpaRepository<BildirimAyari, Long> {
    Optional<BildirimAyari> findByKullaniciId(Long kullaniciId);
    List<BildirimAyari> findByAktifTrue();

    /** Eagerly load kullanici so the @Async thread can access all fields without a session */
    @Query("SELECT ba FROM BildirimAyari ba JOIN FETCH ba.kullanici WHERE ba.aktif = true")
    List<BildirimAyari> findByAktifTrueWithKullanici();
}
