package com.finansportali.backend.exception;
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String resource, String field, Object value) {
        super(resource + " bulunamadı: " + field + " = " + value);
    }
}
