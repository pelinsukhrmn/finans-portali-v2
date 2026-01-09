package com.finansportali.backend.repository;
import com.finansportali.backend.entity.FiyatAlarmi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface FiyatAlarmiRepository extends JpaRepository<FiyatAlarmi, Long> {
    List<FiyatAlarmi> findByKullaniciId(Long kullaniciId);
    List<FiyatAlarmi> findByAktifMiTrueAndTetiklendiMiFalse();
}
