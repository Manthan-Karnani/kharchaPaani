package com.kharchapaani;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

/** Loads the teacher-readable database/queries.sql as the runtime source of truth. */
@Component
public class SqlCatalog {
    private final Map<String, String> queries = new LinkedHashMap<>();

    public SqlCatalog() throws IOException {
        String source = new ClassPathResource("queries.sql").getContentAsString(StandardCharsets.UTF_8);
        String name = null;
        StringBuilder query = new StringBuilder();
        for (String line : source.split("\\R")) {
            if (line.startsWith("-- name: ")) {
                if (name != null) put(name, query.toString());
                name = line.substring(9).trim();
                query.setLength(0);
            } else if (name != null && !line.stripLeading().startsWith("--")) {
                query.append(line).append('\n');
            }
        }
        if (name != null) put(name, query.toString());
    }

    private void put(String name, String sql) {
        if (queries.putIfAbsent(name, sql.trim().replaceFirst(";\\s*$", "")) != null) {
            throw new IllegalStateException("Duplicate SQL name: " + name);
        }
    }

    public String get(String name) {
        String query = queries.get(name);
        if (query == null) throw new IllegalArgumentException("Unknown SQL query: " + name);
        return query;
    }
}
