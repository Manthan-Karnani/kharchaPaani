package com.kharchapaani;

import static com.kharchapaani.Models.*;
import static org.assertj.core.api.Assertions.*;
import java.math.BigDecimal;
import java.sql.Connection;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.UUID;
import javax.sql.DataSource;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Opt-in: uses only a database whose name ends in _test; test records roll back. */
@EnabledIfEnvironmentVariable(named = "TEST_DB_NAME", matches = "[a-zA-Z0-9_]+_test")
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:mysql://${DB_HOST:localhost}:${DB_PORT:3306}/${TEST_DB_NAME}?connectionTimeZone=UTC&forceConnectionTimeZoneToSession=true"
})
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class MySqlIntegrationTest {
    @Autowired DataSource dataSource;
    @Autowired ExpenseService service;
    @Autowired ExpenseRepository repository;

    @BeforeAll void checkTestDatabase() throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            assertThat(connection.getCatalog()).isEqualTo(System.getenv("TEST_DB_NAME")).endsWith("_test");
        }
    }

    private UserView user() { return service.register(new Credentials("test_" + UUID.randomUUID().toString().replace("-", "").substring(0, 20), "password123")); }
    private ExpenseInput expense(String amount, String date, String category) {
        return new ExpenseInput("Integration expense", new BigDecimal(amount), LocalDate.parse(date), category);
    }

    @Test @Transactional void actualSqlHandlesOwnershipDecimalsCategoriesAndMonthBoundaries() {
        var a = user(); var b = user(); var feb = YearMonth.of(2024, 2); var march = YearMonth.of(2024, 3);
        assertThat(service.dashboard(a.id(), feb).remaining()).isNull();
        service.saveBudget(a.id(), feb, new BigDecimal("0.20"));
        var first = service.create(a.id(), expense("0.10", "2024-02-01", "Food"));
        var second = service.create(a.id(), expense("0.20", "2024-02-29", "food"));
        var nextMonth = service.create(a.id(), expense("10.00", "2024-03-01", "Travel"));
        assertThat(first.categoryId()).isEqualTo(second.categoryId());
        assertThat(service.categories(a.id())).hasSize(2);
        assertThat(service.dashboard(a.id(), feb).totalSpent()).isEqualByComparingTo("0.30");
        assertThat(service.dashboard(a.id(), feb).remaining()).isEqualByComparingTo("-0.10");
        assertThat(service.dashboard(a.id(), feb).categories()).hasSize(1);
        assertThat(service.expenses(a.id(), feb)).hasSize(2);
        assertThat(service.expenses(b.id(), feb)).isEmpty();
        assertThat(repository.expense(b.id(), first.id())).isEmpty();
        assertThatThrownBy(() -> service.update(b.id(), first.id(), expense("3.00", "2024-02-01", "Forbidden"))).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service.delete(b.id(), first.id())).isInstanceOf(ResponseStatusException.class);
        assertThat(service.categories(b.id())).isEmpty();
        service.update(a.id(), first.id(), expense("0.15", "2024-03-01", "Food"));
        assertThat(service.dashboard(a.id(), feb).totalSpent()).isEqualByComparingTo("0.20");
        assertThat(service.dashboard(a.id(), march).totalSpent()).isEqualByComparingTo("10.15");
        service.delete(a.id(), nextMonth.id());
        assertThat(service.dashboard(a.id(), march).totalSpent()).isEqualByComparingTo("0.15");
        assertThat(service.budget(b.id(), feb).amount()).isNull();
    }

    @Test @Transactional void uniqueUsernameAndZeroBudgetAreEnforced() {
        var a = user();
        assertThatThrownBy(() -> service.register(new Credentials(a.username().toUpperCase(), "password123"))).isInstanceOf(DuplicateKeyException.class);
        service.saveBudget(a.id(), YearMonth.of(2026, 10), BigDecimal.ZERO);
        assertThat(service.dashboard(a.id(), YearMonth.of(2026, 10)).remaining()).isEqualByComparingTo("0.00");
    }
}
