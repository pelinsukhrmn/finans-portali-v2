package com.finansportali.backend.repository;
import com.finansportali.backend.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.*;
@Repository
public interface YatirimAraciRepository extends JpaRepository<YatirimAraci, Long> {
    Optional<YatirimAraci> findBySembol(String sembol);
    List<YatirimAraci> findByTip(EnstrumanTipi tip);
    List<YatirimAraci> findBySembolContainingIgnoreCaseOrAdContainingIgnoreCase(String sembol, String ad);
    boolean existsBySembol(String sembol);
}
