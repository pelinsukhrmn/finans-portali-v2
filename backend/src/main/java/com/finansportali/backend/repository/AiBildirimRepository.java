package com.finansportali.backend.repository;

import com.finansportali.backend.entity.AiBildirimi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AiBildirimRepository extends JpaRepository<AiBildirimi, Long> {
    List<AiBildirimi> findByKullaniciIdOrderByOlusturmaTarihiDesc(Long kullaniciId);
    long countByKullaniciIdAndOkunduFalse(Long kullaniciId);
    Optional<AiBildirimi> findByKullaniciIdAndHaberId(Long kullaniciId, Long haberId);
}
