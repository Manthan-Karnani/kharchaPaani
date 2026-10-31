package com.kharchapaani;

import static com.kharchapaani.Models.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Repository;

@Repository
public class ExpenseRepository {
    public record UserRow(long id, String username, String passwordHash) {}
    private final NamedParameterJdbcTemplate jdbc;
    private final SqlCatalog sql;
    private static final RowMapper<Expense> EXPENSE = (rs, row) -> new Expense(
        rs.getLong("id"), rs.getString("description"), rs.getBigDecimal("amount"),
        rs.getObject("expense_date", LocalDate.class), rs.getLong("category_id"), rs.getString("category_name"));

    public ExpenseRepository(NamedParameterJdbcTemplate jdbc, SqlCatalog sql) {
        this.jdbc = jdbc;
        this.sql = sql;
    }

    public Optional<UserRow> userByUsername(String username) {
        return jdbc.query(sql.get("userByUsername"), Map.of("username", username),
            (rs, row) -> new UserRow(rs.getLong("id"), rs.getString("username"), rs.getString("password_hash")))
            .stream().findFirst();
    }

    public long insertUser(String username, String passwordHash) {
        var key = new GeneratedKeyHolder();
        jdbc.update(sql.get("insertUser"), new MapSqlParameterSource()
            .addValue("username", username).addValue("passwordHash", passwordHash), key, new String[]{"id"});
        return requiredKey(key);
    }

    public List<Category> categories(long userId) {
        return jdbc.query(sql.get("listCategories"), Map.of("userId", userId),
            (rs, row) -> new Category(rs.getLong("id"), rs.getString("name")));
    }

    public long ensureCategory(long userId, String categoryName) {
        var params = Map.of("userId", userId, "categoryName", categoryName);
        jdbc.update(sql.get("ensureCategory"), params);
        return jdbc.queryForObject(sql.get("categoryByName"), params, (rs, row) -> rs.getLong("id"));
    }

    public Optional<BigDecimal> budget(long userId, YearMonth month) {
        return jdbc.query(sql.get("budgetForMonth"), Map.of("userId", userId, "month", month.atDay(1)),
            (rs, row) -> rs.getBigDecimal("amount")).stream().findFirst();
    }

    public void saveBudget(long userId, YearMonth month, BigDecimal amount) {
        jdbc.update(sql.get("saveBudget"), Map.of("userId", userId, "month", month.atDay(1), "amount", amount));
    }

    public List<Expense> expenses(long userId, YearMonth month) {
        return jdbc.query(sql.get("listExpenses"), monthParams(userId, month), EXPENSE);
    }

    public Optional<Expense> expense(long userId, long id) {
        return jdbc.query(sql.get("expenseById"), Map.of("userId", userId, "id", id), EXPENSE).stream().findFirst();
    }

    public long insertExpense(long userId, long categoryId, ExpenseInput input) {
        var key = new GeneratedKeyHolder();
        jdbc.update(sql.get("insertExpense"), expenseParams(userId, categoryId, input), key, new String[]{"id"});
        return requiredKey(key);
    }

    public void updateExpense(long userId, long id, long categoryId, ExpenseInput input) {
        jdbc.update(sql.get("updateExpense"), expenseParams(userId, categoryId, input).addValue("id", id));
    }

    public int deleteExpense(long userId, long id) {
        return jdbc.update(sql.get("deleteExpense"), Map.of("userId", userId, "id", id));
    }

    public Totals totals(long userId, YearMonth month) {
        return jdbc.queryForObject(sql.get("monthlyTotals"), monthParams(userId, month),
            (rs, row) -> new Totals(rs.getBigDecimal("total_spent"), rs.getLong("expense_count")));
    }

    public List<CategoryTotal> categoryTotals(long userId, YearMonth month) {
        return jdbc.query(sql.get("categoryTotals"), monthParams(userId, month),
            (rs, row) -> new CategoryTotal(rs.getLong("category_id"), rs.getString("category_name"),
                rs.getBigDecimal("total"), rs.getLong("expense_count")));
    }

    private MapSqlParameterSource monthParams(long userId, YearMonth month) {
        return new MapSqlParameterSource("userId", userId)
            .addValue("start", month.atDay(1)).addValue("end", month.plusMonths(1).atDay(1));
    }

    private MapSqlParameterSource expenseParams(long userId, long categoryId, ExpenseInput input) {
        return new MapSqlParameterSource("userId", userId).addValue("categoryId", categoryId)
            .addValue("description", input.description().trim()).addValue("amount", input.amount())
            .addValue("expenseDate", input.expenseDate());
    }

    private long requiredKey(GeneratedKeyHolder key) {
        if (key.getKey() == null) throw new IllegalStateException("Database did not return a generated ID.");
        return key.getKey().longValue();
    }
}
