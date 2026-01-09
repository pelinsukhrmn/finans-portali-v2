package com.finansportali.backend.service;

import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * Kafka'dan uygulama loglarını tüketerek OpenSearch'e indeksleyen servis.
 * <p>
 * Pipeline: Log4j2 KafkaAppender → "application-logs" topic → bu servis → OpenSearch
 * <p>
 * Log4j2 yapılandırmasındaki KafkaAppender, her log kaydını JSON olarak
 * "application-logs" Kafka topic'ine yazar. Bu consumer o topic'i dinleyerek
 * OpenSearch REST API üzerinden indeksler.
 */
@Service
@Log4j2
public class KafkaLogConsumerService {

    private final RestTemplate restTemplate;
    private final String opensearchHost;

    public KafkaLogConsumerService(
            RestTemplate restTemplate,
            @Value("${opensearch.host:http://localhost:9200}") String opensearchHost) {
        this.restTemplate = restTemplate;
        this.opensearchHost = opensearchHost;
    }

    /**
     * "application-logs" topic'inden gelen log mesajlarını OpenSearch'e yazar.
     *
     * @param logJson Log4j2 ECS JSON formatında log kaydı
     */
    @KafkaListener(
        topics = "application-logs",
        groupId = "log-consumer-group",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void consumeLog(String logJson) {
        try {
            String index = buildIndexName();
            String url = String.format("%s/%s/_doc", opensearchHost, index);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> request = new HttpEntity<>(logJson, headers);
            restTemplate.postForObject(url, request, Map.class);
        } catch (Exception ex) {
            // Log hatalarını kaydetme döngüsünden kaçın — sadece stderr'e yaz
            System.err.println("[KafkaLogConsumer] OpenSearch'e log yazma hatası: " + ex.getMessage());
        }
    }

    /** Günlük index ismi: finans-portali-logs-2026.05.24 */
    private String buildIndexName() {
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy.MM.dd"));
        return "finans-portali-logs-" + date;
    }
}
