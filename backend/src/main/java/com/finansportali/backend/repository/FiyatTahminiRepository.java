package com.finansportali.backend.repository;

import com.finansportali.backend.entity.FiyatTahmini;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FiyatTahminiRepository extends JpaRepository<FiyatTahmini, Long> {
    List<FiyatTahmini> findByKullaniciIdOrderByOlusturmaTarihiDesc(Long kullaniciId);
}
