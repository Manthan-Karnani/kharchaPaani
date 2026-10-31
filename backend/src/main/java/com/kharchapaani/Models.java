package com.kharchapaani;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public final class Models {
    private Models() {}

    public record Credentials(
        @NotBlank @Pattern(regexp = "[a-zA-Z0-9_]{3,32}", message = "Use 3–32 letters, numbers, or underscores.") String username,
        @NotBlank @Size(min = 8, max = 72, message = "Use a password with 8–72 characters.") String password
    ) {}

    public record BudgetInput(
        @NotNull @DecimalMin("0.00") @DecimalMax("9999999999.99") @Digits(integer = 10, fraction = 2) BigDecimal amount
    ) {}

    public record ExpenseInput(
        @NotBlank @Size(max = 160) String description,
        @NotNull @DecimalMin("0.01") @DecimalMax("9999999999.99") @Digits(integer = 10, fraction = 2) BigDecimal amount,
        @NotNull LocalDate expenseDate,
        @NotBlank @Size(max = 40) String categoryName
    ) {}

    public record UserView(long id, String username) {}
    public record Category(long id, String name) {}
    public record Expense(long id, String description, BigDecimal amount, LocalDate expenseDate, long categoryId, String categoryName) {}
    public record Budget(String month, BigDecimal amount) {}
    public record CategoryTotal(long categoryId, String categoryName, BigDecimal total, long expenseCount) {}
    public record Totals(BigDecimal totalSpent, long expenseCount) {}
    public record Dashboard(String month, BigDecimal budget, BigDecimal totalSpent, BigDecimal remaining,
                            long expenseCount, List<CategoryTotal> categories) {}
}
