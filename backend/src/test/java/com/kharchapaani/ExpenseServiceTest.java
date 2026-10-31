package com.kharchapaani;

import static com.kharchapaani.Models.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

class ExpenseServiceTest {
    ExpenseRepository repository;
    ExpenseService service;
    final YearMonth month = YearMonth.of(2026, 10);

    @BeforeEach void setup() {
        repository = mock(ExpenseRepository.class);
        service = new ExpenseService(repository, new BCryptPasswordEncoder());
    }

    @Test void hashesPasswordAndNormalizesUsername() {
        when(repository.insertUser(eq("manthan"), anyString())).thenReturn(1L);
        assertThat(service.register(new Credentials("Manthan", "password123"))).isEqualTo(new UserView(1, "manthan"));
        var hash = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(repository).insertUser(eq("manthan"), hash.capture());
        assertThat(hash.getValue()).isNotEqualTo("password123");
        assertThat(new BCryptPasswordEncoder().matches("password123", hash.getValue())).isTrue();
    }

    @Test void rejectsPasswordsAboveBcryptByteLimit() {
        assertThatThrownBy(() -> service.register(new Credentials("person", "अ".repeat(25))))
            .isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(repository);
    }

    @Test void computesExactTotalsAndOverspending() {
        when(repository.budget(7, month)).thenReturn(Optional.of(new BigDecimal("100.00")));
        when(repository.totals(7, month)).thenReturn(new Totals(new BigDecimal("100.30"), 2));
        when(repository.categoryTotals(7, month)).thenReturn(List.of());
        var result = service.dashboard(7, month);
        assertThat(result.remaining()).isEqualByComparingTo("-0.30");
        assertThat(result.totalSpent()).isEqualByComparingTo("100.30");
    }

    @Test void missingBudgetHasNoRemainingBalance() {
        when(repository.budget(7, month)).thenReturn(Optional.empty());
        when(repository.totals(7, month)).thenReturn(new Totals(new BigDecimal("20.01"), 1));
        when(repository.categoryTotals(7, month)).thenReturn(List.of());
        var result = service.dashboard(7, month);
        assertThat(result.budget()).isNull();
        assertThat(result.remaining()).isNull();
    }

    @Test void ownershipIsCheckedBeforeCreatingCategoryOnEdit() {
        when(repository.expense(7, 99)).thenReturn(Optional.empty());
        var input = new ExpenseInput("Lunch", new BigDecimal("20.00"), LocalDate.of(2026, 10, 1), "Food");
        assertThatThrownBy(() -> service.update(7, 99, input)).isInstanceOf(ResponseStatusException.class);
        verify(repository, never()).ensureCategory(anyLong(), anyString());
        verify(repository, never()).updateExpense(anyLong(), anyLong(), anyLong(), any());
    }

    @Test void monthValidationRejectsMalformedAndOutOfRangeValues() {
        assertThat(ExpenseService.parseMonth("2024-02")).isEqualTo(YearMonth.of(2024, 2));
        for (String invalid : List.of("2026-13", "26-10", "2026-1", "0999-01", "9999-12", "x")) {
            assertThatThrownBy(() -> ExpenseService.parseMonth(invalid)).isInstanceOf(ResponseStatusException.class);
        }
    }

    @Test void absentOrForeignExpenseCannotBeDeleted() {
        when(repository.deleteExpense(7, 99)).thenReturn(0);
        assertThatThrownBy(() -> service.delete(7, 99)).isInstanceOf(ResponseStatusException.class);
    }
}
