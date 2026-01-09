package com.finansportali.backend.repository;
import com.finansportali.backend.entity.PortfoyVarligi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface PortfoyVarligiRepository extends JpaRepository<PortfoyVarligi, Long> {
    List<PortfoyVarligi> findByPortfoyId(Long portfoyId);
    boolean existsByPortfoyIdAndYatirimAraciId(Long portfoyId, Long araciId);

    /** All assets belonging to any portfolio of a given user, with yatirimAraci eagerly joined */
    @Query("SELECT v FROM PortfoyVarligi v JOIN FETCH v.yatirimAraci ya JOIN v.portfoy p WHERE p.kullanici.id = :kullaniciId")
    List<PortfoyVarligi> findByKullaniciId(@Param("kullaniciId") Long kullaniciId);
}
