package com.finansportali.backend.repository;
import com.finansportali.backend.entity.TakipListesi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.*;
@Repository
public interface TakipListesiRepository extends JpaRepository<TakipListesi, Long> {
    List<TakipListesi> findByKullaniciId(Long kullaniciId);
    Optional<TakipListesi> findByKullaniciIdAndYatirimAraciId(Long kullaniciId, Long araciId);
    boolean existsByKullaniciIdAndYatirimAraciId(Long kullaniciId, Long araciId);
}
