package com.finansportali.backend.repository;
import com.finansportali.backend.entity.Haber;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface HaberRepository extends JpaRepository<Haber, Long> {
    Page<Haber> findByKategoriOrderByYayinTarihiDesc(String kategori, Pageable pageable);
    List<Haber> findTop20ByOrderByYayinTarihiDesc();
    List<Haber> findTop50ByOrderByYayinTarihiDesc();
    List<Haber> findByBaslikContainingIgnoreCase(String q);
    boolean existsByUrl(String url);
}
