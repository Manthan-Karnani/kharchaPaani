package com.kharchapaani;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.sql.Connection;
import java.sql.Statement;
import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.sql.init.SqlInitializationAutoConfiguration;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.support.ResourcePropertySource;

class DatabaseInitializationTest {
    @Test void startupAndRestartApplyOnlyNonDestructiveTablesToTheConfiguredDatabase() throws Exception {
        var dataSource = mock(DataSource.class);
        var connection = mock(Connection.class);
        var statement = mock(Statement.class);
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);
        when(connection.getAutoCommit()).thenReturn(true);
        when(statement.getUpdateCount()).thenReturn(-1);

        var properties = new ResourcePropertySource(new ClassPathResource("application.properties"));
        var runner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(SqlInitializationAutoConfiguration.class))
            .withBean(DataSource.class, () -> dataSource)
            .withInitializer(context -> context.getEnvironment().getPropertySources()
                .addLast(properties));

        runner.run(context -> assertThat(context).hasNotFailed());
        runner.run(context -> assertThat(context).hasNotFailed());

        var sql = ArgumentCaptor.forClass(String.class);
        verify(statement, times(8)).execute(sql.capture());
        var expectedTables = new String[]{"users", "monthly_budgets", "categories", "expenses"};
        for (int startup = 0; startup < 2; startup++) {
            for (int table = 0; table < expectedTables.length; table++) {
                assertThat(sql.getAllValues().get(startup * 4 + table))
                    .startsWith("CREATE TABLE IF NOT EXISTS " + expectedTables[table] + " (")
                    .doesNotContain("DROP ", "TRUNCATE ", "DELETE ", "INSERT ", "USE ", "CREATE DATABASE ");
            }
        }
    }
}
