package com.kharchapaani;

import static com.kharchapaani.Models.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.CannotCreateTransactionException;

@WebMvcTest({AuthController.class, ExpenseController.class})
@Import(SecurityConfig.class)
class ApiSecurityTest {
    @Autowired MockMvc mvc;
    @Autowired PasswordEncoder passwords;
    @MockitoBean ExpenseService service;
    @MockitoBean ExpenseRepository repository;
    AccountPrincipal account;

    @BeforeEach void setup() {
        account = new AccountPrincipal(7, "person", passwords.encode("password123"));
        when(repository.userByUsername("person")).thenReturn(Optional.of(new ExpenseRepository.UserRow(7, "person", account.passwordHash())));
    }

    @Test void protectedRoutesRequireLogin() throws Exception {
        mvc.perform(get("/api/expenses?month=2026-10")).andExpect(status().isUnauthorized());
    }

    @Test void csrfEndpointIsPublicAndMutationsRequireToken() throws Exception {
        mvc.perform(get("/api/auth/csrf")).andExpect(status().isOk()).andExpect(jsonPath("$.token").isString());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content("{\"username\":\"person\",\"password\":\"password123\"}")).andExpect(status().isForbidden());
    }

    @Test void loginPersistsSessionAndLogoutRevokesIt() throws Exception {
        var result = mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"username\":\"PERSON\",\"password\":\"password123\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.username").value("person"))
            .andExpect(jsonPath("$.passwordHash").doesNotExist()).andReturn();
        var session = (MockHttpSession) result.getRequest().getSession(false);
        mvc.perform(get("/api/auth/me").session(session)).andExpect(status().isOk()).andExpect(jsonPath("$.id").value(7));
        mvc.perform(post("/api/auth/logout").session(session).with(csrf())).andExpect(status().isNoContent());
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
        org.assertj.core.api.Assertions.assertThat(session.isInvalid()).isTrue();
    }

    @Test void incorrectPasswordIsRejected() throws Exception {
        mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"username\":\"person\",\"password\":\"incorrect123\"}"))
            .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.message").value("Incorrect username or password."));
    }

    @Test void registrationDuplicateUsernameIsReadable() throws Exception {
        when(service.register(any())).thenThrow(new DuplicateKeyException("duplicate"));
        mvc.perform(post("/api/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"username\":\"person\",\"password\":\"password123\"}"))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.message").value("That username is already taken. Choose another one."));
    }

    @Test void databaseOutageDuringLoginIsNotReportedAsBadPassword() throws Exception {
        when(repository.userByUsername("person")).thenThrow(new DataAccessResourceFailureException("offline"));
        mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"username\":\"person\",\"password\":\"password123\"}"))
            .andExpect(status().isServiceUnavailable());
    }

    @Test void registrationConnectionFailureReturnsHelpfulErrorInsteadOfGenericServerError() throws Exception {
        when(service.register(any())).thenThrow(new CannotCreateTransactionException("Could not open JDBC Connection",
            new java.sql.SQLException("Access denied", "28000", 1045)));
        mvc.perform(post("/api/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"username\":\"person\",\"password\":\"password123\"}"))
            .andExpect(status().isServiceUnavailable())
            .andExpect(jsonPath("$.message").value("MySQL rejected the database username or password. Check DB_USERNAME and DB_PASSWORD, then restart the backend."));
    }

    @Test void registrationMissingTablesReportsSchemaSetup() throws Exception {
        when(service.register(any())).thenThrow(new org.springframework.jdbc.BadSqlGrammarException("insert", "SQL",
            new java.sql.SQLException("Table missing", "42S02", 1146)));
        mvc.perform(post("/api/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"username\":\"person\",\"password\":\"password123\"}"))
            .andExpect(status().isServiceUnavailable())
            .andExpect(jsonPath("$.message").value("The Kharcha Paani database or tables are missing. Restart the backend to create them and check that the MySQL user has CREATE and REFERENCES permissions on DB_NAME."));
    }

    @Test void expenseValidationRejectsInvalidMoney() throws Exception {
        mvc.perform(post("/api/expenses").with(user(account)).with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"description\":\"Coffee\",\"amount\":0.001,\"expenseDate\":\"2026-10-01\",\"categoryName\":\"Food\"}"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fields.amount").exists());
        verify(service, never()).create(anyLong(), any());
    }

    @Test void requestsUseAuthenticatedOwnerAndRejectInjectedUserIds() throws Exception {
        when(service.categories(7)).thenReturn(List.of(new Category(1, "Food")));
        mvc.perform(get("/api/categories").with(user(account))).andExpect(status().isOk()).andExpect(jsonPath("$[0].name").value("Food"));
        verify(service).categories(7);
        mvc.perform(post("/api/expenses").with(user(account)).with(csrf()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"userId\":9,\"description\":\"Coffee\",\"amount\":20,\"expenseDate\":\"2026-10-01\",\"categoryName\":\"Food\"}"))
            .andExpect(status().isBadRequest());
    }
}
