package com.finansportali.backend.repository;

import com.finansportali.backend.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {

    List<ChatSession> findByKullaniciIdOrderByGuncellemeTarihiDesc(Long kullaniciId);

    Optional<ChatSession> findByPortfoyId(Long portfoyId);

    Optional<ChatSession> findTopByKullaniciIdOrderByGuncellemeTarihiDesc(Long kullaniciId);

    Optional<ChatSession> findByKullaniciIdAndPortfoyId(Long kullaniciId, Long portfoyId);
}
