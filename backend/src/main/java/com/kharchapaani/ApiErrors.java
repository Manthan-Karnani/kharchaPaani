package com.kharchapaani;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.transaction.CannotCreateTransactionException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiErrors {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<?> validation(MethodArgumentNotValidException ex) {
        var fields = new LinkedHashMap<String, String>();
        ex.getBindingResult().getFieldErrors().forEach(error -> fields.putIfAbsent(error.getField(), error.getDefaultMessage()));
        return ResponseEntity.badRequest().body(Map.of("message", "Please check the highlighted details.", "fields", fields));
    }

    @ExceptionHandler(DuplicateKeyException.class)
    ResponseEntity<?> duplicate(DuplicateKeyException ex) { return error(409, "That username is already taken. Choose another one."); }

    @ExceptionHandler({DataAccessException.class, AuthenticationServiceException.class, CannotCreateTransactionException.class})
    ResponseEntity<?> database(Exception ex) {
        // Registration opens a transaction before its first SQL statement. Connection
        // failures there are transaction exceptions, not DataAccessException instances.
        Throwable cause = ex;
        for (int depth = 0; cause != null && depth < 20; depth++, cause = cause.getCause()) {
            if (cause instanceof java.sql.SQLException sql) {
                if (sql.getErrorCode() == 1045 || "28000".equals(sql.getSQLState())) {
                    return error(503, "MySQL rejected the database username or password. Check DB_USERNAME and DB_PASSWORD, then restart the backend.");
                }
                if (sql.getErrorCode() == 1049 || sql.getErrorCode() == 1146) {
                    return error(503, "The Kharcha Paani database or tables are missing. Restart the backend to create them and check that the MySQL user has CREATE and REFERENCES permissions on DB_NAME.");
                }
            }
        }
        return error(503, "Cannot reach the database. Check MySQL and the connection settings, then restart the backend.");
    }

    @ExceptionHandler(AuthenticationException.class)
    ResponseEntity<?> authentication(AuthenticationException ex) { return error(401, "Incorrect username or password."); }

    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<?> status(ResponseStatusException ex) { return error(ex.getStatusCode().value(), ex.getReason()); }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class, MissingServletRequestParameterException.class})
    ResponseEntity<?> malformed(Exception ex) { return error(400, "Please provide valid amounts, dates, and required fields."); }

    private ResponseEntity<?> error(int status, String message) { return ResponseEntity.status(status).body(Map.of("message", message)); }
}
