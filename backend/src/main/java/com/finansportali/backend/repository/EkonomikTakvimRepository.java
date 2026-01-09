package com.finansportali.backend.repository;
import com.finansportali.backend.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.*;
@Repository
public interface EkonomikTakvimRepository extends JpaRepository<EkonomikTakvim, Long> {
    List<EkonomikTakvim> findAllByOrderByZamanAsc();
    List<EkonomikTakvim> findByZamanBetweenOrderByZamanAsc(java.time.LocalDateTime baslangic, java.time.LocalDateTime bitis);
    List<EkonomikTakvim> findByUlkeOrderByZamanAsc(String ulke);
}
