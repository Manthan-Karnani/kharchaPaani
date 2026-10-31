package com.kharchapaani;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRepository;

@Configuration
public class SecurityConfig {
    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }
    @Bean SecurityContextRepository securityContextRepository() { return new HttpSessionSecurityContextRepository(); }
    @Bean CsrfTokenRepository csrfTokenRepository() { return new HttpSessionCsrfTokenRepository(); }

    @Bean UserDetailsService userDetailsService(ExpenseRepository repository) {
        return username -> repository.userByUsername(username)
            .map(row -> new AccountPrincipal(row.id(), row.username(), row.passwordHash()))
            .orElseThrow(() -> new UsernameNotFoundException("Invalid username or password."));
    }

    @Bean AuthenticationManager authenticationManager(UserDetailsService users, PasswordEncoder passwords) {
        var provider = new DaoAuthenticationProvider(users);
        provider.setPasswordEncoder(passwords);
        return new ProviderManager(provider);
    }

    @Bean SecurityFilterChain securityFilterChain(HttpSecurity http, SecurityContextRepository contexts,
                                                  CsrfTokenRepository tokens) throws Exception {
        return http
            .securityContext(context -> context.securityContextRepository(contexts))
            .csrf(csrf -> csrf.csrfTokenRepository(tokens))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/csrf", "/api/auth/register", "/api/auth/login", "/error").permitAll()
                .anyRequest().authenticated())
            .exceptionHandling(errors -> errors
                .authenticationEntryPoint((request, response, error) -> jsonError(response, 401, "Please log in to continue."))
                .accessDeniedHandler((request, response, error) -> jsonError(response, 403, "Your session token expired. Refresh and try again.")))
            .logout(logout -> logout.logoutUrl("/api/auth/logout")
                .invalidateHttpSession(true).deleteCookies("JSESSIONID")
                .logoutSuccessHandler((request, response, auth) -> response.setStatus(204)))
            .build();
    }

    private static void jsonError(HttpServletResponse response, int status, String message) throws java.io.IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.getWriter().write("{\"message\":\"" + message + "\"}");
    }
}
