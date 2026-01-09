package com.finansportali.backend.exception;
public class DuplicateResourceException extends RuntimeException {
    public DuplicateResourceException(String resource, String field, Object value) {
        super(resource + " zaten mevcut: " + field + " = " + value);
    }
}
