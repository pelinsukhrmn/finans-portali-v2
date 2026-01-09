package com.finansportali.backend.repository;
import com.finansportali.backend.entity.Portfoy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface PortfoyRepository extends JpaRepository<Portfoy, Long> {
    List<Portfoy> findByKullaniciId(Long kullaniciId);
    boolean existsByKullaniciIdAndAd(Long kullaniciId, String ad);
}
