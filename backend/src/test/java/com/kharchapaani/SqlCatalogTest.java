package com.kharchapaani;

import static org.assertj.core.api.Assertions.*;
import org.junit.jupiter.api.Test;

class SqlCatalogTest {
    @Test void allRuntimeQueriesArePresentAndOwnershipScoped() throws Exception {
        var sql = new SqlCatalog();
        for (String name : new String[]{"listCategories", "ensureCategory", "categoryByName", "budgetForMonth", "saveBudget", "listExpenses", "expenseById", "insertExpense", "updateExpense", "deleteExpense", "monthlyTotals", "categoryTotals"}) {
            assertThat(sql.get(name)).contains(":userId").doesNotEndWith(";");
        }
        assertThat(sql.get("userByUsername")).contains(":username");
        assertThat(sql.get("insertUser")).contains(":passwordHash");
        assertThat(sql.get("listExpenses")).contains("expense_date >= :start", "expense_date < :end");
    }
}
