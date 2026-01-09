package com.finansportali.backend.repository;

import com.finansportali.backend.entity.EnstrumanTipi;
import com.finansportali.backend.entity.PiyasaVerisi;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.*;

@Repository
public interface PiyasaVerisiRepository extends JpaRepository<PiyasaVerisi, Long> {

    Optional<PiyasaVerisi> findTopByYatirimAraciIdOrderByVeriZamaniDesc(Long araciId);

    long countByYatirimAraciId(Long araciId);

    List<PiyasaVerisi> findByYatirimAraciIdAndVeriZamaniBetweenOrderByVeriZamaniAsc(
        Long araciId, LocalDateTime baslangic, LocalDateTime bitis);

    Page<PiyasaVerisi> findByYatirimAraciIdOrderByVeriZamaniDesc(Long araciId, Pageable pageable);

    /** Her enstruman icin en son kayit */
    @Query("SELECT p FROM PiyasaVerisi p WHERE p.id IN " +
           "(SELECT MAX(p2.id) FROM PiyasaVerisi p2 GROUP BY p2.yatirimAraci.id)")
    List<PiyasaVerisi> findLatestForAllAraclar();

    /** Belirli tip icin en son kayitlar */
    @Query("SELECT p FROM PiyasaVerisi p WHERE p.id IN " +
           "(SELECT MAX(p2.id) FROM PiyasaVerisi p2 " +
           " WHERE p2.yatirimAraci.tip = :tip GROUP BY p2.yatirimAraci.id)")
    List<PiyasaVerisi> findLatestByTip(@Param("tip") EnstrumanTipi tip);
}
