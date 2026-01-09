package com.finansportali.backend.repository;
import com.finansportali.backend.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.*;
@Repository
public interface BorsaRepository extends JpaRepository<Borsa, Long> {}
