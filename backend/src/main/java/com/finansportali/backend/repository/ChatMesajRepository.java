package com.finansportali.backend.repository;

import com.finansportali.backend.entity.ChatMesaj;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMesajRepository extends JpaRepository<ChatMesaj, Long> {

    List<ChatMesaj> findTop20BySession_IdOrderByOlusturmaTarihiDesc(Long sessionId);

    List<ChatMesaj> findTop50BySession_IdOrderByOlusturmaTarihiAsc(Long sessionId);

    long countBySession_Id(Long sessionId);

    ChatMesaj findTopBySession_IdAndRolOrderByOlusturmaTarihiDesc(Long sessionId, String rol);
}
