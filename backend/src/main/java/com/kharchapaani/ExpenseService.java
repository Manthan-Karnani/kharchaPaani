package com.kharchapaani;

import static com.kharchapaani.Models.*;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ExpenseService {
    private final ExpenseRepository repository;
    private final PasswordEncoder passwords;

    public ExpenseService(ExpenseRepository repository, PasswordEncoder passwords) {
        this.repository = repository;
        this.passwords = passwords;
    }

    @Transactional
    public UserView register(Credentials credentials) {
        validatePasswordBytes(credentials.password());
        String username = credentials.username().toLowerCase(Locale.ROOT);
        long id = repository.insertUser(username, passwords.encode(credentials.password()));
        return new UserView(id, username);
    }

    public static void validatePasswordBytes(String password) {
        if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at most 72 UTF-8 bytes.");
        }
    }

    public static YearMonth parseMonth(String value) {
        try {
            if (!value.matches("\\d{4}-\\d{2}")) throw new DateTimeParseException("Invalid month", value, 0);
            YearMonth month = YearMonth.parse(value);
            if (month.getYear() < 1000 || month.getYear() > 9998) throw new DateTimeParseException("Invalid year", value, 0);
            return month;
        } catch (DateTimeParseException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a valid month in YYYY-MM format (years 1000–9998).");
        }
    }

    public List<Category> categories(long userId) { return repository.categories(userId); }
    public List<Expense> expenses(long userId, YearMonth month) { return repository.expenses(userId, month); }
    public Budget budget(long userId, YearMonth month) { return new Budget(month.toString(), repository.budget(userId, month).orElse(null)); }

    @Transactional
    public Budget saveBudget(long userId, YearMonth month, BigDecimal amount) {
        repository.saveBudget(userId, month, amount);
        return budget(userId, month);
    }

    @Transactional(readOnly = true)
    public Dashboard dashboard(long userId, YearMonth month) {
        BigDecimal budget = repository.budget(userId, month).orElse(null);
        Totals totals = repository.totals(userId, month);
        return new Dashboard(month.toString(), budget, totals.totalSpent(),
            budget == null ? null : budget.subtract(totals.totalSpent()), totals.expenseCount(), repository.categoryTotals(userId, month));
    }

    @Transactional
    public Expense create(long userId, ExpenseInput input) {
        validateDate(input);
        long categoryId = repository.ensureCategory(userId, input.categoryName().trim());
        long id = repository.insertExpense(userId, categoryId, input);
        return requiredExpense(userId, id);
    }

    @Transactional
    public Expense update(long userId, long id, ExpenseInput input) {
        validateDate(input);
        requiredExpense(userId, id);
        long categoryId = repository.ensureCategory(userId, input.categoryName().trim());
        repository.updateExpense(userId, id, categoryId, input);
        return requiredExpense(userId, id);
    }

    @Transactional
    public void delete(long userId, long id) {
        if (repository.deleteExpense(userId, id) == 0) throw notFound();
    }

    private Expense requiredExpense(long userId, long id) {
        return repository.expense(userId, id).orElseThrow(ExpenseService::notFound);
    }

    private static ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Expense not found.");
    }

    private void validateDate(ExpenseInput input) {
        if (input.expenseDate().getYear() < 1000 || input.expenseDate().getYear() > 9998) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose an expense date between years 1000 and 9998.");
        }
    }
}
